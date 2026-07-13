import { lookup } from 'node:dns'
import { isIP, isIPv6 } from 'node:net'
import type {
  InstalledNodeVersion,
  NodeReleaseSummary,
  NvmManagerProvider,
  NvmManagerVersionOption,
} from '../common/types'
import {
  githubRepoForProvider,
  recommendedManagerOption,
  releaseTagsToOptions,
} from './nvm-manager.shared'

export const DEFAULT_NODE_RELEASE_ORIGINS = ['https://nodejs.org', 'https://npmmirror.com']

// Keeps remote metadata access in the main process. Renderer code receives
// normalized DTOs and does not need to fetch or merge release data itself.
interface GithubRelease {
  tag_name?: string
  draft?: boolean
  prerelease?: boolean
}

export interface NodeReleaseRecord {
  version: string
  npm?: string
  lts?: string | false
  date?: string
}

export class ReleaseClient {
  constructor(private readonly provider: NvmManagerProvider) {}

  public async listManagerVersions(): Promise<NvmManagerVersionOption[]> {
    const fallback = this.provider === 'nvm-windows'
      ? [recommendedManagerOption(this.provider, 'embedded')]
      : [recommendedManagerOption(this.provider, 'remote')]

    try {
      const releases = await this.fetchGithubReleases()
      const remoteOptions = releaseTagsToOptions(this.provider, releases)
      if (this.provider !== 'nvm-windows')
        return remoteOptions.length > 0 ? remoteOptions : fallback

      const embedded = recommendedManagerOption(this.provider, 'embedded')
      return [
        embedded,
        ...remoteOptions.filter(item => item.version !== embedded.version),
      ]
    }
    catch (error) {
      console.warn('Failed to load NVM manager releases, using fallback', error)
      return fallback
    }
  }

  public async listNodeReleaseSummaries(
    releaseUrl: string,
    installedVersions: InstalledNodeVersion[],
  ): Promise<NodeReleaseSummary[]> {
    const records = await this.fetchNodeReleaseRecords(releaseUrl)
    return summarizeNodeReleases(records, installedVersions)
  }

  public async fetchNodeReleaseRecords(releaseUrl: string): Promise<NodeReleaseRecord[]> {
    const url = validateNodeReleaseUrl(releaseUrl)
    const response = await safeFetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'nvm-gui',
      },
    })

    return parseJson(response)
  }

  private async fetchGithubReleases(): Promise<GithubRelease[]> {
    const url = `https://api.github.com/repos/${githubRepoForProvider(this.provider)}/releases`
    const response = await safeFetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nvm-gui',
      },
    })

    return parseJson(response)
  }
}

export function summarizeNodeReleases(
  records: NodeReleaseRecord[],
  installedVersions: InstalledNodeVersion[],
  now = new Date(),
): NodeReleaseSummary[] {
    const installed = new Set(
      installedVersions.map(item => normalizeNodeVersion(item.version)),
    )
    const releasesByMajor = new Map<number, Omit<NodeReleaseSummary, 'status'>>()

    for (const item of records) {
      if (!item.version)
        continue

      const major = parseMajor(item.version)
      if (major === null)
        continue

      const existing = releasesByMajor.get(major)
      if (!existing) {
        releasesByMajor.set(major, {
          version: item.version,
          major,
          npm: item.npm,
          lts: item.lts ?? false,
          firstReleased: item.date,
          lastUpdated: item.date,
          installed: installed.has(normalizeNodeVersion(item.version)),
        })
        continue
      }

      if (isEarlierDate(item.date, existing.firstReleased))
        existing.firstReleased = item.date

      if (isLaterDate(item.date, existing.lastUpdated)) {
        existing.version = item.version
        existing.npm = item.npm
        existing.lts = item.lts ?? false
        existing.lastUpdated = item.date
        existing.installed = installed.has(normalizeNodeVersion(item.version))
      }
    }

    const newestMajor = Math.max(...releasesByMajor.keys())
    return Array.from(releasesByMajor.values())
      .map(summary => ({
        ...summary,
        status: resolveReleaseStatus(summary, newestMajor, now),
      }))
      .sort((a, b) => b.major - a.major)
}

export function validateHttpUrl(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Only http and https URLs are allowed')

  return url.toString()
}

export function validateNodeReleaseUrl(value: string): string {
  const url = new URL(validateHttpUrl(value))
  if (url.protocol !== 'https:')
    throw new Error('Node release URL must use HTTPS')
  return url.toString()
}

export function isDefaultNodeReleaseUrl(value: string): boolean {
  const url = new URL(value)
  return DEFAULT_NODE_RELEASE_ORIGINS.includes(url.origin)
}

async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:')
    throw new Error('Only HTTPS requests are allowed')
  if (isIP(parsed.hostname)) {
    if (isPrivateAddress(parsed.hostname))
      throw new Error('Private network addresses are not allowed')
  }
  else {
    const addresses = await resolvePublicAddresses(parsed.hostname)
    if (addresses.length === 0 || addresses.some(isPrivateAddress))
      throw new Error('Host does not resolve to a public address')
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal, redirect: 'error' })
    if (!response.ok)
      throw new Error(`Request failed: ${response.status}`)
    const length = response.headers.get('content-length')
    if (length && Number(length) > 10 * 1024 * 1024)
      throw new Error('Response exceeds the 10 MB limit')
    return response
  }
  finally { clearTimeout(timeout) }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.body)
    throw new Error('Response body is empty')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 10 * 1024 * 1024) {
      await reader.cancel()
      throw new Error('Response exceeds the 10 MB limit')
    }
    chunks.push(value)
  }
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(body))
}

async function resolvePublicAddresses(host: string): Promise<string[]> {
  try {
    const addresses = await new Promise<Array<{ address: string }>>((resolve, reject) => {
      lookup(host, { all: true, verbatim: true }, (error, results) => {
        if (error)
          reject(error)
        else
          resolve(results)
      })
    })
    return addresses.map(item => item.address)
  }
  catch {
    return []
  }
}

function isPrivateAddress(ip: string): boolean {
  if (isIPv6(ip)) {
    const value = ip.toLowerCase()
    return value === '::' || value === '::1' || value.startsWith('fe80:') || value.startsWith('fc') || value.startsWith('fd')
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 0
    || a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 192 && b === 168)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 100 && b >= 64 && b <= 127)
}

function normalizeNodeVersion(version: string): string {
  return version.trim().replace(/^v/i, '')
}

function parseMajor(version: string): number | null {
  const match = version.match(/^v?(\d+)\.\d+\.\d+$/)
  return match ? Number(match[1]) : null
}

function isEarlierDate(candidate?: string, current?: string): boolean {
  const candidateTime = Date.parse(candidate || '')
  const currentTime = Date.parse(current || '')
  return Number.isFinite(candidateTime) && (!Number.isFinite(currentTime) || candidateTime < currentTime)
}

function isLaterDate(candidate?: string, current?: string): boolean {
  const candidateTime = Date.parse(candidate || '')
  const currentTime = Date.parse(current || '')
  return Number.isFinite(candidateTime) && (!Number.isFinite(currentTime) || candidateTime > currentTime)
}

function resolveReleaseStatus(
  summary: Pick<NodeReleaseSummary, 'major' | 'lts' | 'firstReleased'>,
  newestMajor: number,
  now: Date,
): NodeReleaseSummary['status'] {
  if (hasReachedEndOfLife(summary.major, summary.firstReleased, now))
    return 'eol'
  if (summary.lts !== false)
    return 'lts'
  return summary.major === newestMajor ? 'current' : 'eol'
}

function hasReachedEndOfLife(major: number, firstReleased: string | undefined, now: Date): boolean {
  const releasedAt = Date.parse(firstReleased || '')
  if (!Number.isFinite(releasedAt))
    return false

  const releaseYear = new Date(releasedAt).getUTCFullYear()
  const endOfLife = major % 2 === 0
    ? Date.UTC(releaseYear + 3, 3, 30, 23, 59, 59, 999)
    : Date.UTC(releaseYear + 1, 5, 1, 23, 59, 59, 999)
  return now.getTime() > endOfLife
}

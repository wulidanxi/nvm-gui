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

// Keeps remote metadata access in the main process. Renderer code receives
// normalized DTOs and does not need to fetch or merge release data itself.
interface GithubRelease {
  tag_name?: string
  draft?: boolean
  prerelease?: boolean
}

interface NodeReleaseRecord {
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
    const installed = new Set(
      installedVersions.map(item => normalizeNodeVersion(item.version)),
    )
    const newestByMajor = new Map<number, NodeReleaseSummary>()

    for (const item of records) {
      if (!item.version)
        continue

      const major = parseMajor(item.version)
      if (major === null)
        continue

      const summary: NodeReleaseSummary = {
        version: item.version,
        major,
        npm: item.npm,
        lts: item.lts ?? false,
        date: item.date,
        installed: installed.has(normalizeNodeVersion(item.version)),
      }

      const existing = newestByMajor.get(major)
      if (!existing || compareDate(summary.date, existing.date) > 0)
        newestByMajor.set(major, summary)
    }

    return Array.from(newestByMajor.values())
      .sort((a, b) => b.major - a.major)
  }

  private async fetchGithubReleases(): Promise<GithubRelease[]> {
    const url = `https://api.github.com/repos/${githubRepoForProvider(this.provider)}/releases`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nvm-gui',
      },
    })

    if (!response.ok)
      throw new Error(`GitHub release request failed: ${response.status}`)

    return response.json()
  }

  private async fetchNodeReleaseRecords(releaseUrl: string): Promise<NodeReleaseRecord[]> {
    const url = validateHttpUrl(releaseUrl)
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'nvm-gui',
      },
    })

    if (!response.ok)
      throw new Error(`Node release request failed: ${response.status}`)

    return response.json()
  }
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

function normalizeNodeVersion(version: string): string {
  return version.trim().replace(/^v/i, '')
}

function parseMajor(version: string): number | null {
  const match = version.match(/^v?(\d+)\.\d+\.\d+$/)
  return match ? Number(match[1]) : null
}

function compareDate(a?: string, b?: string): number {
  return Date.parse(a || '') - Date.parse(b || '')
}

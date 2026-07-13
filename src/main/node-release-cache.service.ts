import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { NodeReleaseRecord } from './release-client'
import { AsyncMutex } from './async-mutex'

export interface CacheEntry {
  fetchedAt: string
  records: NodeReleaseRecord[]
}

interface CacheFile {
  version: 1
  entries: Record<string, CacheEntry>
}

export interface NodeReleaseCacheAppAdapter {
  getPath(name: 'userData'): string
}

export class NodeReleaseCacheService {
  private readonly mutex = new AsyncMutex()
  private cache: CacheFile = { version: 1, entries: {} }
  private loaded = false

  constructor(private readonly appAdapter: NodeReleaseCacheAppAdapter) {}

  public async get(url: string): Promise<CacheEntry | undefined> {
    return this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      return this.cache.entries[url]
    })
  }

  public async set(url: string, records: NodeReleaseRecord[], fetchedAt: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.cache.entries[url] = { fetchedAt, records }
      await this.persist()
    })
  }

  private get filePath(): string {
    return join(this.appAdapter.getPath('userData'), 'node-release-cache.json')
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded)
      return
    this.loaded = true
    try {
      const value: unknown = JSON.parse(await readFile(this.filePath, 'utf-8'))
      if (isCacheFile(value))
        this.cache = value
    }
    catch {
      this.cache = { version: 1, entries: {} }
    }
  }

  private async persist(): Promise<void> {
    const target = this.filePath
    const temp = `${target}.tmp`
    await mkdir(dirname(target), { recursive: true })
    await writeFile(temp, JSON.stringify(this.cache), 'utf-8')
    try {
      await rename(temp, target)
    }
    catch {
      await unlink(target).catch(() => {})
      await rename(temp, target)
    }
  }
}

function isCacheFile(value: unknown): value is CacheFile {
  if (!value || typeof value !== 'object')
    return false
  const candidate = value as Partial<CacheFile>
  if (candidate.version !== 1 || !candidate.entries || typeof candidate.entries !== 'object')
    return false
  return Object.values(candidate.entries).every((entry) => {
    if (!entry || typeof entry !== 'object')
      return false
    const item = entry as Partial<CacheEntry>
    return typeof item.fetchedAt === 'string'
      && Array.isArray(item.records)
      && item.records.every(record => Boolean(record) && typeof record.version === 'string')
  })
}

import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { NodeReleaseRecord } from './release-client'
import { AsyncMutex } from './async-mutex'

/** 单个发布数据源的缓存内容。 */
export interface CacheEntry {
  fetchedAt: string
  records: NodeReleaseRecord[]
}

interface CacheFile {
  version: 1
  entries: Record<string, CacheEntry>
}

/** 隔离 Electron app，便于用临时目录测试缓存读写。 */
export interface NodeReleaseCacheAppAdapter {
  getPath(name: 'userData'): string
}

/** 按发布 URL 分桶持久化原始 Node.js 发布记录。 */
export class NodeReleaseCacheService {
  private readonly mutex = new AsyncMutex()
  private cache: CacheFile = { version: 1, entries: {} }
  private loaded = false

  constructor(private readonly appAdapter: NodeReleaseCacheAppAdapter) {}

  /** 返回指定数据源的缓存，不在此层判断是否过期。 */
  public async get(url: string): Promise<CacheEntry | undefined> {
    return this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      return this.cache.entries[url]
    })
  }

  /** 更新指定数据源并原子写入完整缓存文件。 */
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

  /** 首次访问时容错加载；损坏或旧结构会退回空缓存。 */
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

  /** 使用临时文件替换，降低进程中断造成半写文件的风险。 */
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

/** 验证磁盘缓存的版本和最小记录结构。 */
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

import { randomUUID } from 'node:crypto'
import { access, appendFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type {
  CommandLogCategory,
  CommandLogEntry,
  CommandLogPage,
  CommandLogQuery,
  CommandLogStatus,
} from '../common/types'
import { AsyncMutex } from './async-mutex'

const MAX_ENTRIES = 500
const COMPACT_AT_ENTRIES = 600
const MAX_OUTPUT_LENGTH = 64 * 1024

/** 隔离 Electron app，便于在纯 Node.js 测试中提供 userData 目录。 */
export interface CommandLogAppAdapter {
  getPath(name: 'userData'): string
}

/** 写入日志所需的业务字段；标识和时间由服务统一生成。 */
export interface CommandLogInput {
  category: CommandLogCategory
  operation: string
  command: string
  args: string[]
  status: CommandLogStatus
  durationMs: number
  output: string
}

/**
 * 维护有界的命令历史，并以 JSONL 追加写降低每次记录的磁盘开销。
 * 所有文件操作通过互斥锁串行化，达到阈值后压缩为最近 500 条。
 */
export class CommandLogService {
  private readonly mutex = new AsyncMutex()
  private entries: CommandLogEntry[] = []
  private loaded = false
  private persistedCount = 0

  constructor(private readonly appAdapter: CommandLogAppAdapter) {}

  /** 记录一次命令，并在文件过大时触发压缩。 */
  public async record(input: CommandLogInput): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.entries.unshift({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...input,
        args: input.args.map(item => item.slice(0, 500)),
        durationMs: Math.max(0, Math.round(input.durationMs)),
        output: truncateOutput(input.output),
      })
      this.entries = this.entries.slice(0, MAX_ENTRIES)
      await this.append(this.entries[0])
      if (this.persistedCount >= COMPACT_AT_ENTRIES)
        await this.persist()
    })
  }

  /** 按时间倒序筛选并分页返回日志。 */
  public async list(query: CommandLogQuery = {}): Promise<CommandLogPage> {
    return this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      const page = Math.max(1, Math.floor(query.page || 1))
      const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize || 20)))
      const search = query.search?.trim().toLowerCase()
      const filtered = this.entries.filter((entry) => {
        if (query.status && entry.status !== query.status)
          return false
        if (query.category && entry.category !== query.category)
          return false
        if (!search)
          return true
        return [entry.operation, entry.command, ...entry.args, entry.output]
          .join('\n')
          .toLowerCase()
          .includes(search)
      })
      return {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
      }
    })
  }

  /** 删除指定日志并原子重写持久化文件。 */
  public async remove(id: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.entries = this.entries.filter(entry => entry.id !== id)
      await this.persist()
    })
  }

  /** 清空内存和磁盘中的日志。 */
  public async clear(): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.entries = []
      await this.persist()
    })
  }

  /** 以兼容旧版本的 JSON 数组格式导出当前日志。 */
  public async export(): Promise<string> {
    return this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      return JSON.stringify(this.entries, null, 2)
    })
  }

  /** 首次访问时加载 JSONL；损坏的单行会被忽略，不影响其余记录。 */
  private async ensureLoaded(): Promise<void> {
    if (this.loaded)
      return
    this.loaded = true
    await this.migrateLegacyFile()
    try {
      const content = await readFile(this.filePath, 'utf-8')
      const parsed = content.split(/\r?\n/)
        .filter(Boolean)
        .flatMap((line) => {
          try {
            const value: unknown = JSON.parse(line)
            return isCommandLogEntry(value) ? [value] : []
          }
          catch {
            return []
          }
        })
      this.persistedCount = parsed.length
      this.entries = parsed.slice(-MAX_ENTRIES).reverse()
    }
    catch {
      this.entries = []
    }
  }

  private get filePath(): string {
    return join(this.appAdapter.getPath('userData'), 'command-log.jsonl')
  }

  private get legacyFilePath(): string {
    return join(this.appAdapter.getPath('userData'), 'command-log.json')
  }

  /** 追加单条 JSONL 记录。 */
  private async append(entry: CommandLogEntry): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await appendFile(this.filePath, `${JSON.stringify(entry)}\n`, 'utf-8')
    this.persistedCount += 1
  }

  /** 通过临时文件替换实现完整快照写入，并兼容 Windows 的替换限制。 */
  private async persist(): Promise<void> {
    const target = this.filePath
    const temp = `${target}.tmp`
    await mkdir(dirname(target), { recursive: true })
    const content = this.entries.slice().reverse().map(entry => JSON.stringify(entry)).join('\n')
    await writeFile(temp, content ? `${content}\n` : '', 'utf-8')
    try {
      await rename(temp, target)
    }
    catch {
      await unlink(target).catch(() => {})
      await rename(temp, target)
    }
    this.persistedCount = this.entries.length
  }

  /** 将旧版 JSON 数组迁移为 JSONL，并保留原文件备份。 */
  private async migrateLegacyFile(): Promise<void> {
    if (await pathExists(this.filePath) || !await pathExists(this.legacyFilePath))
      return
    try {
      const value: unknown = JSON.parse(await readFile(this.legacyFilePath, 'utf-8'))
      const entries = Array.isArray(value) ? value.filter(isCommandLogEntry).slice(0, MAX_ENTRIES) : []
      await mkdir(dirname(this.filePath), { recursive: true })
      const content = entries.slice().reverse().map(entry => JSON.stringify(entry)).join('\n')
      await writeFile(this.filePath, content ? `${content}\n` : '', 'utf-8')
      await rename(this.legacyFilePath, `${this.legacyFilePath}.bak`).catch(() => {})
    }
    catch {
      // Leave an unreadable legacy file untouched and start with an empty JSONL history.
    }
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  }
  catch {
    return false
  }
}

/** 限制单条输出大小，避免失败日志长期挤占 userData 空间。 */
function truncateOutput(value: string): string {
  if (value.length <= MAX_OUTPUT_LENGTH)
    return value
  const suffix = '\n… Output truncated at 64 KB.'
  return `${value.slice(0, MAX_OUTPUT_LENGTH - suffix.length)}${suffix}`
}

/** 对磁盘数据做运行时守卫，拒绝结构不完整的历史记录。 */
function isCommandLogEntry(value: unknown): value is CommandLogEntry {
  if (!value || typeof value !== 'object')
    return false
  const entry = value as Partial<CommandLogEntry>
  return typeof entry.id === 'string'
    && typeof entry.timestamp === 'string'
    && typeof entry.category === 'string'
    && typeof entry.operation === 'string'
    && typeof entry.command === 'string'
    && Array.isArray(entry.args)
    && (entry.status === 'success' || entry.status === 'error')
    && typeof entry.durationMs === 'number'
    && typeof entry.output === 'string'
}

let sharedCommandLogService: CommandLogService | undefined

/** 延迟创建共享实例，避免模块加载阶段强依赖 Electron。 */
export function getCommandLogService(): CommandLogService {
  sharedCommandLogService ||= new CommandLogService(getElectronAppAdapter())
  return sharedCommandLogService
}

function getElectronAppAdapter(): CommandLogAppAdapter {
  // 延迟加载让文件服务在没有 Electron 二进制时仍可测试；生产环境再取得 userData。
  // 主进程打包为 CommonJS，__filename 在开发和打包后都可供 createRequire 安全解析。
  const loadModule = createRequire(__filename)
  const { app } = loadModule('electron') as typeof import('electron')
  return app
}

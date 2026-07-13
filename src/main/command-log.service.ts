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

export interface CommandLogAppAdapter {
  getPath(name: 'userData'): string
}

export interface CommandLogInput {
  category: CommandLogCategory
  operation: string
  command: string
  args: string[]
  status: CommandLogStatus
  durationMs: number
  output: string
}

export class CommandLogService {
  private readonly mutex = new AsyncMutex()
  private entries: CommandLogEntry[] = []
  private loaded = false
  private persistedCount = 0

  constructor(private readonly appAdapter: CommandLogAppAdapter) {}

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

  public async remove(id: string): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.entries = this.entries.filter(entry => entry.id !== id)
      await this.persist()
    })
  }

  public async clear(): Promise<void> {
    await this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      this.entries = []
      await this.persist()
    })
  }

  public async export(): Promise<string> {
    return this.mutex.runExclusive(async () => {
      await this.ensureLoaded()
      return JSON.stringify(this.entries, null, 2)
    })
  }

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

  private async append(entry: CommandLogEntry): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await appendFile(this.filePath, `${JSON.stringify(entry)}\n`, 'utf-8')
    this.persistedCount += 1
  }

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

function truncateOutput(value: string): string {
  if (value.length <= MAX_OUTPUT_LENGTH)
    return value
  const suffix = '\n… Output truncated at 64 KB.'
  return `${value.slice(0, MAX_OUTPUT_LENGTH - suffix.length)}${suffix}`
}

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

export function getCommandLogService(): CommandLogService {
  sharedCommandLogService ||= new CommandLogService(getElectronAppAdapter())
  return sharedCommandLogService
}

function getElectronAppAdapter(): CommandLogAppAdapter {
  // Delayed loading keeps this filesystem-only service unit-testable without an
  // installed Electron binary, while production code still receives Electron's userData path.
  // The main process is bundled as CommonJS, where esbuild cannot preserve
  // import.meta.url. __filename remains an absolute path in both development
  // and the packaged app, so createRequire can safely resolve Electron here.
  const loadModule = createRequire(__filename)
  const { app } = loadModule('electron') as typeof import('electron')
  return app
}

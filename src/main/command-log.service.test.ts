import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { CommandLogService } from './command-log.service'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

async function createService() {
  const directory = await mkdtemp(join(tmpdir(), 'nvm-gui-command-log-'))
  directories.push(directory)
  return { directory, service: new CommandLogService({ getPath: () => directory }) }
}

function entry(index: number, output = `output-${index}`) {
  return {
    category: 'nvm' as const,
    operation: 'nvm use', command: 'nvm', args: ['use', `20.0.${index}`],
    status: index % 2 ? 'success' as const : 'error' as const,
    durationMs: index, output,
  }
}

function storedEntry(
  id: string,
  timestamp: string,
  overrides: Partial<ReturnType<typeof entry>> = {},
) {
  return { id, timestamp, ...entry(1), ...overrides }
}

describe('CommandLogService', () => {
  it('persists entries and filters the newest-first history', async () => {
    const { directory, service } = await createService()
    await service.record(entry(1))
    await service.record(entry(2))
    await expect(service.list({ status: 'error' })).resolves.toMatchObject({ total: 1, items: [{ operation: 'nvm use', status: 'error' }] })

    const restored = new CommandLogService({ getPath: () => directory })
    const restoredPage = await restored.list()
    expect(restoredPage.total).toBe(2)
    expect(restoredPage.items[0].args).toEqual(['use', '20.0.2'])
  })

  it('serializes concurrent writes, trims to 500 entries, and truncates output', async () => {
    const { service } = await createService()
    await Promise.all(Array.from({ length: 520 }, (_, index) => service.record(entry(index))))
    await service.record(entry(521, 'x'.repeat(70 * 1024)))
    const page = await service.list({ pageSize: 100 })
    expect(page.total).toBe(500)
    expect(page.items[0].output.length).toBeLessThanOrEqual(64 * 1024)
    expect(page.items[0].output).toContain('Output truncated')
  })

  it('migrates legacy JSON, tolerates a damaged JSONL line, and keeps JSON export compatibility', async () => {
    const { directory, service } = await createService()
    await writeFile(join(directory, 'command-log.json'), JSON.stringify([
      { id: 'legacy', timestamp: '2026-07-13T00:00:00.000Z', ...entry(1) },
    ]), 'utf-8')

    await expect(service.list()).resolves.toMatchObject({ total: 1, items: [{ id: 'legacy' }] })
    await writeFile(join(directory, 'command-log.jsonl'), `${await readFile(join(directory, 'command-log.jsonl'), 'utf-8')}{broken\n`, 'utf-8')
    const restored = new CommandLogService({ getPath: () => directory })
    await expect(restored.list()).resolves.toMatchObject({ total: 1 })
    expect(JSON.parse(await restored.export())).toHaveLength(1)
  })

  it('compacts the append-only file after 600 persisted entries', async () => {
    const { directory, service } = await createService()
    for (let index = 0; index < 600; index += 1)
      await service.record(entry(index))
    const lines = (await readFile(join(directory, 'command-log.jsonl'), 'utf-8')).trim().split(/\r?\n/)
    expect(lines).toHaveLength(500)
    await expect(service.list()).resolves.toMatchObject({ total: 500 })
    await expect(service.statistics()).resolves.toMatchObject({ total: 500 })
  })

  it('aggregates retained logs into seven local calendar days', async () => {
    const { directory, service } = await createService()
    const now = new Date(2026, 6, 14, 12)
    const values = [
      storedEntry('switch', new Date(2026, 6, 8, 0).toISOString(), { durationMs: 100 }),
      storedEntry('failed-install', new Date(2026, 6, 10, 9).toISOString(), { operation: 'nvm install', status: 'error', durationMs: 300 }),
      storedEntry('install', new Date(2026, 6, 14, 8).toISOString(), { operation: 'nvm install', durationMs: 500 }),
      storedEntry('uninstall', new Date(2026, 6, 14, 10).toISOString(), { operation: 'nvm uninstall', durationMs: 700 }),
      storedEntry('too-old', new Date(2026, 6, 7, 23, 59).toISOString()),
      storedEntry('tomorrow', new Date(2026, 6, 15, 0).toISOString()),
      storedEntry('invalid', 'not-a-date'),
    ]
    await writeFile(join(directory, 'command-log.jsonl'), `${values.map(value => JSON.stringify(value)).join('\n')}\n`, 'utf-8')

    const result = await service.statistics(now)

    expect(result).toMatchObject({
      from: '2026-07-08', to: '2026-07-14', total: 4, successRate: 75, averageDurationMs: 400,
      switchCount: 1, installCount: 1, uninstallCount: 1,
    })
    expect(result.daily).toHaveLength(7)
    expect(result.daily[0]).toEqual({ date: '2026-07-08', success: 1, error: 0 })
    expect(result.daily[1]).toEqual({ date: '2026-07-09', success: 0, error: 0 })
    expect(result.daily[2]).toEqual({ date: '2026-07-10', success: 0, error: 1 })
    expect(result.daily[6]).toEqual({ date: '2026-07-14', success: 2, error: 0 })
  })

  it('returns an empty seven-day baseline when no logs are retained', async () => {
    const { service } = await createService()
    await service.record(entry(1))
    await service.clear()
    const result = await service.statistics(new Date(2026, 6, 14, 12))
    expect(result).toMatchObject({ total: 0, successRate: null, averageDurationMs: null, switchCount: 0, installCount: 0, uninstallCount: 0 })
    expect(result.daily).toHaveLength(7)
    expect(result.daily.every(day => day.success === 0 && day.error === 0)).toBe(true)
  })
})

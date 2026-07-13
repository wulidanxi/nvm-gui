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
  })
})

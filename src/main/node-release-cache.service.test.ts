import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { NodeReleaseCacheService } from './node-release-cache.service'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

async function createService() {
  const directory = await mkdtemp(join(tmpdir(), 'nvm-gui-release-cache-'))
  directories.push(directory)
  return { directory, service: new NodeReleaseCacheService({ getPath: () => directory }) }
}

describe('NodeReleaseCacheService', () => {
  it('persists records independently by normalized URL key', async () => {
    const { directory, service } = await createService()
    await service.set('https://nodejs.org/dist/index.json', [{ version: 'v22.1.0', lts: false }], '2026-07-13T00:00:00.000Z')
    await service.set('https://npmmirror.com/mirrors/node/index.json', [{ version: 'v20.1.0', lts: 'Iron' }], '2026-07-12T00:00:00.000Z')

    const restored = new NodeReleaseCacheService({ getPath: () => directory })
    await expect(restored.get('https://nodejs.org/dist/index.json')).resolves.toMatchObject({ records: [{ version: 'v22.1.0' }] })
    await expect(restored.get('https://npmmirror.com/mirrors/node/index.json')).resolves.toMatchObject({ records: [{ version: 'v20.1.0' }] })
    expect(JSON.parse(await readFile(join(directory, 'node-release-cache.json'), 'utf-8')).version).toBe(1)
  })

  it('ignores an invalid cache file', async () => {
    const { directory, service } = await createService()
    await import('node:fs/promises').then(fs => fs.writeFile(join(directory, 'node-release-cache.json'), '{broken', 'utf-8'))
    await expect(service.get('https://nodejs.org/dist/index.json')).resolves.toBeUndefined()
  })
})

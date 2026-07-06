import { afterEach, describe, expect, it, vi } from 'vitest'
import { consumeNodeEnvDirty } from './nodeEnvDirty'
import { useNvmOperations } from './useNvmOperations'

describe('useNvmOperations', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    consumeNodeEnvDirty()
  })

  it('marks the node environment dirty after a successful install', async () => {
    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          install: vi.fn(async () => ({ success: true, message: 'installed' })),
        },
      },
    })

    const operations = useNvmOperations()
    await operations.install('v22.12.0')

    expect(operations.operatingVersion.value).toBeNull()
    expect(consumeNodeEnvDirty()).toBe(true)
  })

  it('clears the busy version after a failed operation', async () => {
    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          use: vi.fn(async () => {
            throw new Error('switch failed')
          }),
        },
      },
    })

    const operations = useNvmOperations()

    await expect(operations.use('22.12.0')).rejects.toThrow('switch failed')
    expect(operations.operatingVersion.value).toBeNull()
    expect(consumeNodeEnvDirty()).toBe(false)
  })
})


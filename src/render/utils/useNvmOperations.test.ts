import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consumeNodeEnvDirty } from './nodeEnvDirty'
import { useNvmOperations } from './useNvmOperations'

describe('useNvmOperations', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('rejects a second operation while one is active', async () => {
    let resolveInstall: (() => void) | undefined
    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          install: vi.fn(() => new Promise<{ success: boolean, message: string }>((resolve) => {
            resolveInstall = () => resolve({ success: true, message: 'ok' })
          })),
        },
      },
    })
    const operations = useNvmOperations()
    const first = operations.install('20.0.0')

    await expect(operations.use('18.0.0')).rejects.toThrow('already running')
    resolveInstall?.()
    await first
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    consumeNodeEnvDirty()
  })

  it('exposes the running state while an operation is in flight', async () => {
    let resolveInstall: (value: { success: boolean, message: string }) => void

    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          install: vi.fn(() => new Promise<{ success: boolean, message: string }>((resolve) => {
            resolveInstall = resolve
          })),
        },
      },
    })

    const operations = useNvmOperations()
    const installPromise = operations.install('v22.12.0')

    expect(operations.operatingVersion.value).toBe('v22.12.0')
    expect(operations.operationState.value).toEqual({
      kind: 'install',
      version: 'v22.12.0',
      phase: 'running',
    })

    resolveInstall!({ success: true, message: 'installed' })
    await installPromise
  })

  it('marks the node environment dirty and keeps a short success state after install', async () => {
    vi.useFakeTimers()
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
    expect(operations.operationState.value).toEqual({
      kind: 'install',
      version: 'v22.12.0',
      phase: 'success',
      message: 'installed',
    })
    expect(consumeNodeEnvDirty()).toBe(true)

    vi.advanceTimersByTime(2400)

    expect(operations.operationState.value).toBeNull()
  })

  it('clears the busy version and keeps a short error state after failure', async () => {
    vi.useFakeTimers()
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
    expect(operations.operationState.value).toEqual({
      kind: 'use',
      version: '22.12.0',
      phase: 'error',
      message: 'switch failed',
    })
    expect(consumeNodeEnvDirty()).toBe(false)

    vi.advanceTimersByTime(2400)

    expect(operations.operationState.value).toBeNull()
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useAvailableNodeReleases } from './useAvailableNodeReleases'

describe('useAvailableNodeReleases', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads releases through the structured renderer API', async () => {
    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          listAvailableReleases: vi.fn(async () => [
            {
              version: 'v22.12.0',
              major: 22,
              lts: false,
              installed: false,
            },
          ]),
        },
      },
    })

    const composable = useAvailableNodeReleases()
    await composable.refresh()

    expect(composable.releases.value).toHaveLength(1)
    expect(composableValue(composable.filteredReleases)).toHaveLength(1)
    expect(composable.nvmMissing.value).toBe(false)
  })

  it('marks NVM missing errors', async () => {
    vi.stubGlobal('window', {
      nvmGui: {
        nvm: {
          listAvailableReleases: vi.fn(async () => {
            throw new Error('NVM manager is not installed')
          }),
        },
      },
    })

    const composable = useAvailableNodeReleases()

    await expect(composable.refresh()).rejects.toThrow('NVM manager is not installed')
    await nextTick()
    expect(composable.nvmMissing.value).toBe(true)
  })
})

function composableValue<T>(value: { value: T }): T {
  return value.value
}

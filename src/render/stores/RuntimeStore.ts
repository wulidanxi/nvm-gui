import { defineStore } from 'pinia'
import { ref } from 'vue'
import { currentNvmManagerVersion, nvmCurrent, nvmVersion } from '@render/api'
import { desktopApi } from '@render/api/desktop'

export type RuntimeStatus = 'loading' | 'missing' | 'ready'

export const useRuntimeStore = defineStore('runtime', () => {
  const currentNodeStatus = ref<RuntimeStatus>('loading')
  const nvmManagerStatus = ref<RuntimeStatus>('loading')
  const nvmCliStatus = ref<RuntimeStatus>('loading')
  const currentNodeVersion = ref('')
  const nvmManagerVersion = ref('')
  const nvmCliVersion = ref('')
  const system = desktopApi.system
  let refreshPromise: Promise<void> | undefined

  function refresh(): Promise<void> {
    if (refreshPromise) return refreshPromise
    refreshPromise = Promise.allSettled([
      load(nvmCurrent, currentNodeVersion, currentNodeStatus),
      load(currentNvmManagerVersion, nvmManagerVersion, nvmManagerStatus),
      load(nvmVersion, nvmCliVersion, nvmCliStatus),
    ]).then(() => undefined).finally(() => { refreshPromise = undefined })
    return refreshPromise
  }

  return {
    currentNodeStatus, nvmManagerStatus, nvmCliStatus,
    currentNodeVersion, nvmManagerVersion, nvmCliVersion,
    system, refresh,
  }
})

async function load(
  action: () => Promise<string>,
  value: { value: string },
  status: { value: RuntimeStatus },
): Promise<void> {
  status.value = 'loading'
  try {
    value.value = await action()
    status.value = 'ready'
  }
  catch {
    value.value = ''
    status.value = 'missing'
  }
}

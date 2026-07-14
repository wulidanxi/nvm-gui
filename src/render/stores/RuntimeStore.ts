import { defineStore } from 'pinia'
import { ref } from 'vue'
import { currentNvmManagerVersion, nvmCurrent, nvmVersion } from '@render/api'
import { desktopApi } from '@render/api/desktop'

export type RuntimeStatus = 'loading' | 'missing' | 'ready'

/** 缓存仪表盘共享的 Node.js、NVM 和系统运行时快照。 */
export const useRuntimeStore = defineStore('runtime', () => {
  const currentNodeStatus = ref<RuntimeStatus>('loading')
  const nvmManagerStatus = ref<RuntimeStatus>('loading')
  const nvmCliStatus = ref<RuntimeStatus>('loading')
  const currentNodeVersion = ref('')
  const nvmManagerVersion = ref('')
  const nvmCliVersion = ref('')
  const system = desktopApi.system
  let refreshPromise: Promise<void> | undefined

  /** 合并并发刷新请求，避免多个页面同时触发重复命令。 */
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

/** 加载单个运行时字段，并将异常收敛为 missing 状态。 */
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

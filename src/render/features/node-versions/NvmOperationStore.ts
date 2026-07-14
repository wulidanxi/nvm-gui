import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OperationResult } from '@common/types'
import { installNodeVersion, uninstallNodeVersion, useNodeVersion } from '@render/api'
import { useRuntimeStore } from '@render/stores/RuntimeStore'
import { markNodeEnvDirty } from '@render/utils/nodeEnvDirty'

export type NvmOperationKind = 'install' | 'use' | 'uninstall'
export type NvmOperationPhase = 'running' | 'success' | 'error'
/** 当前 NVM 变更及其反馈内容。 */
export interface NvmOperationState {
  kind: NvmOperationKind
  version: string
  phase: NvmOperationPhase
  message?: string
}

/** 串联版本变更、运行时刷新和短暂操作反馈。 */
export const useNvmOperationStore = defineStore('nvm-operation', () => {
  const runtimeStore = useRuntimeStore()
  const operatingVersion = ref<string | null>(null)
  const operationState = ref<NvmOperationState | null>(null)
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null

  const install = (version: string) => run('install', version, () => installNodeVersion(version.replace(/^v/i, '')))
  const use = (version: string) => run('use', version, () => useNodeVersion(version))
  const uninstall = (version: string) => run('uninstall', version, () => uninstallNodeVersion(version))

  /** 同一时刻只允许一个 NVM 变更，避免界面发出相互冲突的命令。 */
  async function run(kind: NvmOperationKind, version: string, action: () => Promise<OperationResult>) {
    if (operatingVersion.value) throw new Error(`NVM operation already running for ${operatingVersion.value}`)
    operatingVersion.value = version
    setState({ kind, version, phase: 'running' })
    try {
      const result = await action()
      if (kind === 'use') await runtimeStore.refresh()
      markNodeEnvDirty()
      operationState.value = { kind, version, phase: 'success', message: result.message }
      scheduleClear()
      return result
    }
    catch (error) {
      operationState.value = { kind, version, phase: 'error', message: error instanceof Error ? error.message : String(error) }
      scheduleClear()
      throw error
    }
    finally { operatingVersion.value = null }
  }

  /** 重置自动关闭计时并立即展示新状态。 */
  function setState(state: NvmOperationState) {
    if (feedbackTimer) clearTimeout(feedbackTimer)
    feedbackTimer = null
    operationState.value = state
  }

  /** 在用户有足够阅读时间后清除操作反馈。 */
  function scheduleClear() {
    if (feedbackTimer) clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => {
      operationState.value = null
      feedbackTimer = null
    }, 2400)
  }

  return { operatingVersion, operationState, install, use, uninstall }
})

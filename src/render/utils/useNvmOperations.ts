import { ref } from 'vue'
import type { OperationResult } from '@common/types'
import {
  installNodeVersion,
  uninstallNodeVersion,
  useNodeVersion,
} from '@render/api'
import { markNodeEnvDirty } from './nodeEnvDirty'

export type NvmOperationKind = 'install' | 'use' | 'uninstall'

export type NvmOperationPhase = 'running' | 'success' | 'error'

export interface NvmOperationState {
  kind: NvmOperationKind
  version: string
  phase: NvmOperationPhase
  message?: string
}

const feedbackVisibleMs = 2400

export function useNvmOperations() {
  const operatingVersion = ref<string | null>(null)
  const operationState = ref<NvmOperationState | null>(null)
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null

  async function install(version: string) {
    return run('install', version, () => installNodeVersion(normalizeVersion(version)))
  }

  async function use(version: string) {
    return run('use', version, () => useNodeVersion(version))
  }

  async function uninstall(version: string) {
    return run('uninstall', version, () => uninstallNodeVersion(version))
  }

  async function run(
    kind: NvmOperationKind,
    version: string,
    action: () => Promise<OperationResult>,
  ) {
    operatingVersion.value = version
    setOperationState({
      kind,
      version,
      phase: 'running',
    })

    try {
      const result = await action()
      markNodeEnvDirty()
      operationState.value = {
        kind,
        version,
        phase: 'success',
        message: result.message,
      }
      scheduleFeedbackClear()
      return result
    }
    catch (error) {
      operationState.value = {
        kind,
        version,
        phase: 'error',
        message: error instanceof Error ? error.message : String(error),
      }
      scheduleFeedbackClear()
      throw error
    }
    finally {
      operatingVersion.value = null
    }
  }

  function setOperationState(state: NvmOperationState) {
    if (feedbackTimer) {
      clearTimeout(feedbackTimer)
      feedbackTimer = null
    }

    operationState.value = state
  }

  function scheduleFeedbackClear() {
    if (feedbackTimer) clearTimeout(feedbackTimer)

    feedbackTimer = setTimeout(() => {
      operationState.value = null
      feedbackTimer = null
    }, feedbackVisibleMs)
  }

  return {
    operatingVersion,
    operationState,
    install,
    use,
    uninstall,
  }
}

function normalizeVersion(version: string): string {
  return version.replace(/^v/i, '')
}

import { storeToRefs } from 'pinia'
import { useNvmOperationStore } from './NvmOperationStore'

export type { NvmOperationKind, NvmOperationPhase, NvmOperationState } from './NvmOperationStore'

/** 将 Pinia 操作状态转换为组件可直接解构且保持响应式的接口。 */
export function useNvmOperations() {
  const store = useNvmOperationStore()
  const { operatingVersion, operationState } = storeToRefs(store)
  return {
    operatingVersion,
    operationState,
    install: store.install,
    use: store.use,
    uninstall: store.uninstall,
  }
}

import { storeToRefs } from 'pinia'
import { useNvmOperationStore } from './NvmOperationStore'

export type { NvmOperationKind, NvmOperationPhase, NvmOperationState } from './NvmOperationStore'

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

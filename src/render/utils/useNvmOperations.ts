import { storeToRefs } from 'pinia'
import { useNvmOperationStore } from '@render/stores/NvmOperationStore'

export type { NvmOperationKind, NvmOperationPhase, NvmOperationState } from '@render/stores/NvmOperationStore'

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

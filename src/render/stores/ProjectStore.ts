import { defineStore } from 'pinia'
import { ref } from 'vue'

const CURRENT_SCHEMA_VERSION = 1

export const useProjectStore = defineStore('project', () => {
  const schemaVersion = ref(CURRENT_SCHEMA_VERSION)
  const lastProjectPath = ref<string | null>(null)

  function rememberProject(path: string): void {
    lastProjectPath.value = path
  }

  function clearProject(): void {
    lastProjectPath.value = null
  }

  return { schemaVersion, lastProjectPath, rememberProject, clearProject }
}, {
  persist: {
    afterHydrate: ({ store }) => {
      // Older payloads are intentionally discarded rather than trusting a stale path.
      if (store.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        store.schemaVersion = CURRENT_SCHEMA_VERSION
        store.lastProjectPath = null
      }
    },
  },
})

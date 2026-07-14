import { defineStore } from 'pinia'
import { ref } from 'vue'

const CURRENT_SCHEMA_VERSION = 1

/** 保存项目检测的最近目录，并通过版本号隔离旧结构。 */
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
      // 不信任旧结构中可能已失效的路径，升级时直接清空。
      if (store.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        store.schemaVersion = CURRENT_SCHEMA_VERSION
        store.lastProjectPath = null
      }
    },
  },
})

import { computed, ref } from 'vue'
import type { InstalledNodeVersion } from '@common/types'
import { listInstalledNodeVersions } from '@render/api'
import { isNvmMissingError } from '@render/utils/nvmErrors'

/** 管理本地 Node.js 版本列表及当前激活版本。 */
export function useInstalledNodeVersions() {
  const versions = ref<InstalledNodeVersion[]>([])
  const loading = ref(false)
  const nvmMissing = ref(false)

  const currentVersion = computed(() => {
    return versions.value.find(item => item.active)?.version || ''
  })

  /** 刷新列表，并单独标记 NVM 缺失以展示安装引导。 */
  async function refresh() {
    loading.value = true
    nvmMissing.value = false
    try {
      versions.value = await listInstalledNodeVersions()
    }
    catch (error) {
      nvmMissing.value = isNvmMissingError(error)
      throw error
    }
    finally {
      loading.value = false
    }
  }

  return {
    versions,
    loading,
    nvmMissing,
    currentVersion,
    refresh,
  }
}

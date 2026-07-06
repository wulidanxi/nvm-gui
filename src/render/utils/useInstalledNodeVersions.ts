import { computed, ref } from 'vue'
import type { InstalledNodeVersion } from '@common/types'
import { listInstalledNodeVersions } from '@render/api'
import { isNvmMissingError } from './nvmErrors'

export function useInstalledNodeVersions() {
  const versions = ref<InstalledNodeVersion[]>([])
  const loading = ref(false)
  const nvmMissing = ref(false)

  const currentVersion = computed(() => {
    return versions.value.find(item => item.active)?.version || ''
  })

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


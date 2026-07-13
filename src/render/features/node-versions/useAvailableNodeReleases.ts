import { computed, ref } from 'vue'
import type { NodeReleaseDataSource, NodeReleaseSummary } from '@common/types'
import { listAvailableNodeReleases } from '@render/api'
import { useNodeURLStore } from '@render/stores/NodeURLStore'
import { isNvmMissingError } from '@render/utils/nvmErrors'

export function useAvailableNodeReleases() {
  const releases = ref<NodeReleaseSummary[]>([])
  const loading = ref(false)
  const nvmMissing = ref(false)
  const source = ref<NodeReleaseDataSource>()
  const fetchedAt = ref('')
  const warning = ref('')
  const keyword = ref('')
  const ltsOnly = ref(false)
  const store = useNodeURLStore()

  const filteredReleases = computed(() => {
    const query = keyword.value.trim().toLowerCase()
    return releases.value.filter((item) => {
      const matchesKeyword = !query
        || item.version.toLowerCase().includes(query)
        || `node.js ${item.major}`.includes(query)
        || String(item.lts || '').toLowerCase().includes(query)
      const matchesLts = !ltsOnly.value || item.lts !== false
      return matchesKeyword && matchesLts
    })
  })

  async function refresh(forceRefresh = false) {
    loading.value = true
    nvmMissing.value = false
    try {
      const result = await listAvailableNodeReleases({
        releaseUrl: store.nodeUrl,
        cacheHours: store.cacheHours,
        forceRefresh,
      })
      releases.value = result.items
      source.value = result.source
      fetchedAt.value = result.fetchedAt
      warning.value = result.warning || ''
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
    releases,
    filteredReleases,
    loading,
    nvmMissing,
    source,
    fetchedAt,
    warning,
    keyword,
    ltsOnly,
    refresh,
  }
}

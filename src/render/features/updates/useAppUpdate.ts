import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { AppUpdateStatus } from '@common/types'
import {
  checkForAppUpdate, downloadAppUpdate, getAppUpdateStatus, onAppUpdateStatus,
  openUrl, quitAndInstallAppUpdate,
} from '@render/api'
import { useI18n } from '@render/i18n'
import { useUpdateStore } from './UpdateStore'

export function useAppUpdate() {
  const { t } = useI18n()
  const preferences = useUpdateStore()
  const status = ref<AppUpdateStatus>({ phase: 'idle' })
  const dialogVisible = ref(false)
  const installing = ref(false)
  let removeListener: (() => void) | undefined
  let autoCheckTimer: ReturnType<typeof setTimeout> | undefined

  async function check() {
    status.value = await checkForAppUpdate(preferences.includePrerelease)
    if (status.value.phase === 'available') dialogVisible.value = true
    if (status.value.phase === 'up-to-date') window.$message.success(t('update.upToDate'))
    if (status.value.phase === 'error') window.$message.error(t('update.failed', { message: status.value.error || '-' }))
  }

  async function handle() {
    if (status.value.phase === 'available') return void (dialogVisible.value = true)
    if (status.value.phase === 'downloading') return void (dialogVisible.value = true)
    if (status.value.phase === 'downloaded') {
      await quitAndInstallAppUpdate()
      return
    }
    await check()
  }

  async function downloadAndInstall() {
    if (status.value.manualDownload) {
      await openUrl('projectReleases')
      return
    }
    installing.value = true
    try {
      status.value = await downloadAppUpdate()
      if (status.value.phase === 'downloaded') {
        window.$message.success(t('update.downloaded'))
        await quitAndInstallAppUpdate()
      }
    }
    finally {
      installing.value = false
    }
  }

  const buttonLabel = computed(() => {
    if (status.value.phase === 'checking') return t('update.checking')
    if (status.value.phase === 'available') return status.value.manualDownload ? t('update.manualDownload') : t('update.download')
    if (status.value.phase === 'downloading') return t('update.downloading', { progress: status.value.progress || 0 })
    if (status.value.phase === 'downloaded') return t('update.restart')
    return t('update.check')
  })

  onMounted(() => {
    removeListener = onAppUpdateStatus((value) => {
      status.value = value
      if (value.phase === 'available' || value.phase === 'downloading' || value.phase === 'downloaded')
        dialogVisible.value = true
    })
    getAppUpdateStatus().then((value) => {
      status.value = value
    })
    if (preferences.autoCheck) {
      autoCheckTimer = setTimeout(() => {
        check().catch(() => {})
      }, 800)
    }
  })
  onUnmounted(() => {
    removeListener?.()
    if (autoCheckTimer) clearTimeout(autoCheckTimer)
  })

  return { status, dialogVisible, installing, buttonLabel, check, handle, downloadAndInstall }
}

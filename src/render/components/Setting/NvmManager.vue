<template>
  <div class="nvm-manager-settings">
    <n-card :bordered="false" size="small" :title="t('nvmManager.title')">
      <n-space vertical size="large">
        <n-alert v-if="status && !status.installed" type="warning" :show-icon="true">
          {{ t("nvmManager.missingAlert") }}
        </n-alert>

        <n-descriptions v-if="status" :column="1" bordered size="small">
          <n-descriptions-item :label="t('nvmManager.platform')">
            {{ status.platform }}
          </n-descriptions-item>
          <n-descriptions-item :label="t('nvmManager.manager')">
            {{ status.provider }}
          </n-descriptions-item>
          <n-descriptions-item :label="t('common.status')">
            <n-tag :type="status.installed ? 'success' : 'warning'">
              {{ status.installed ? t("common.installed") : t("common.unavailable") }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item :label="t('nvmManager.currentVersion')">
            {{ status.version || '-' }}
          </n-descriptions-item>
          <n-descriptions-item :label="t('nvmManager.installPath')">
            {{ managerPath }}
          </n-descriptions-item>
        </n-descriptions>

        <n-form label-placement="left" label-width="auto">
          <n-form-item :label="t('nvmManager.installVersion')">
            <n-select
              v-model:value="selectedVersionKey"
              :options="versionSelectOptions"
              :loading="versionsLoading"
              :placeholder="t('nvmManager.versionPlaceholder')"
            />
          </n-form-item>
          <n-form-item
            v-if="status?.provider === 'nvm-sh'"
            :label="t('nvmManager.writeProfile')"
          >
            <n-switch v-model:value="writeProfile" />
          </n-form-item>
        </n-form>

        <n-space>
          <n-button :loading="detecting" @click="loadStatus">
            {{ t("nvmManager.refreshStatus") }}
          </n-button>
          <n-button
            type="primary"
            :disabled="!selectedVersion"
            :loading="installing"
            @click="confirmInstall"
          >
            {{ status?.installed ? t("nvmManager.upgradeOrReinstall") : t("nvmManager.installManager") }}
          </n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { NvmManagerStatus, NvmManagerVersionOption } from '@common/types'
import { useI18n } from '@render/i18n'
import {
  detectNvmManager,
  installNvmManager,
  listNvmManagerVersions,
} from '@render/api'
import { markNodeEnvDirty } from '@render/utils/nodeEnvDirty'

const status = ref<NvmManagerStatus | null>(null)
const versions = ref<NvmManagerVersionOption[]>([])
const selectedVersionKey = ref<string | null>(null)
const writeProfile = ref(false)
const detecting = ref(false)
const versionsLoading = ref(false)
const installing = ref(false)
const { t } = useI18n()

const versionSelectOptions = computed<SelectOption[]>(() => {
  return versions.value.map(item => ({
    label: `${item.label}${item.recommended ? ` ${t('nvmManager.recommended')}` : ''}`,
    value: optionKey(item),
  }))
})

const selectedVersion = computed(() => {
  return versions.value.find(item => optionKey(item) === selectedVersionKey.value)
})

const managerPath = computed(() => {
  const paths = status.value?.paths
  if (!paths)
    return '-'

  return paths.executable
    || paths.nvmHome
    || paths.nvmDir
    || paths.embeddedInstaller
    || '-'
})

onMounted(async () => {
  await Promise.all([loadStatus(), loadVersions()])
})

async function loadStatus() {
  detecting.value = true
  try {
    status.value = await detectNvmManager()
  }
  catch (error: any) {
    window.$message.error(t('nvmManager.detectFailed', { message: error.message || t('common.failedUnknown') }))
  }
  finally {
    detecting.value = false
  }
}

async function loadVersions() {
  versionsLoading.value = true
  try {
    versions.value = await listNvmManagerVersions()
    const recommended = versions.value.find(item => item.recommended) || versions.value[0]
    selectedVersionKey.value = recommended ? optionKey(recommended) : null
  }
  catch (error: any) {
    window.$message.error(t('nvmManager.loadVersionsFailed', { message: error.message || t('common.failedUnknown') }))
  }
  finally {
    versionsLoading.value = false
  }
}

function confirmInstall() {
  if (!selectedVersion.value)
    return

  if (!status.value?.installed) {
    installSelectedVersion()
    return
  }

  window.$dialog.warning({
    title: t('nvmManager.confirmTitle'),
    content: t('nvmManager.confirmContent'),
    positiveText: t('nvmManager.continue'),
    negativeText: t('common.cancel'),
    onPositiveClick: installSelectedVersion,
  })
}

async function installSelectedVersion() {
  const target = selectedVersion.value
  if (!target)
    return

  installing.value = true
  try {
    status.value = await installNvmManager({
      version: target.version,
      source: target.source,
      writeProfile: writeProfile.value,
    })
    markNodeEnvDirty()
    window.$message.success(t('nvmManager.installSuccess', { version: target.version }))
  }
  catch (error: any) {
    window.$message.error(t('nvmManager.installFailed', { message: error.message || t('common.failedUnknown') }))
  }
  finally {
    installing.value = false
  }
}

function optionKey(option: NvmManagerVersionOption) {
  return `${option.source}:${option.version}`
}
</script>

<style scoped>
.nvm-manager-settings {
  padding: 10px;
}
</style>

<template>
  <div class="nvm-manager-settings">
    <n-card :bordered="false" size="small" title="NVM 管理器">
      <n-space vertical size="large">
        <n-alert v-if="status && !status.installed" type="warning" :show-icon="true">
          当前未检测到 NVM 管理器，可在此安装后继续管理 Node.js 版本。
        </n-alert>

        <n-descriptions v-if="status" :column="1" bordered size="small">
          <n-descriptions-item label="平台">
            {{ status.platform }}
          </n-descriptions-item>
          <n-descriptions-item label="管理器">
            {{ status.provider }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="status.installed ? 'success' : 'warning'">
              {{ status.installed ? '已安装' : '未安装' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="当前版本">
            {{ status.version || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="安装路径">
            {{ managerPath }}
          </n-descriptions-item>
        </n-descriptions>

        <n-form label-placement="left" label-width="auto">
          <n-form-item label="安装版本">
            <n-select
              v-model:value="selectedVersionKey"
              :options="versionSelectOptions"
              :loading="versionsLoading"
              placeholder="选择 NVM 管理器版本"
            />
          </n-form-item>
          <n-form-item
            v-if="status?.provider === 'nvm-sh'"
            label="写入 shell profile"
          >
            <n-switch v-model:value="writeProfile" />
          </n-form-item>
        </n-form>

        <n-space>
          <n-button :loading="detecting" @click="loadStatus">
            刷新状态
          </n-button>
          <n-button
            type="primary"
            :disabled="!selectedVersion"
            :loading="installing"
            @click="confirmInstall"
          >
            {{ status?.installed ? '升级/重装管理器' : '安装管理器' }}
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

const versionSelectOptions = computed<SelectOption[]>(() => {
  return versions.value.map(item => ({
    label: `${item.label}${item.recommended ? ' · 推荐' : ''}`,
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
    window.$message.error(`检测 NVM 管理器失败: ${error.message || '未知错误'}`)
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
    window.$message.error(`加载 NVM 管理器版本失败: ${error.message || '未知错误'}`)
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
    title: '确认安装',
    content: '已检测到现有 NVM 管理器。继续操作会运行所选版本的安装/升级流程。',
    positiveText: '继续',
    negativeText: '取消',
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
    window.$message.success(`NVM 管理器 ${target.version} 安装完成`)
  }
  catch (error: any) {
    window.$message.error(`安装 NVM 管理器失败: ${error.message || '未知错误'}`)
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

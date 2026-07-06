<template>
  <div class="setting-page">
    <h2>设置</h2>
    <n-tabs type="line" animated>
      <n-tab-pane name="general" tab="通用">
        <GeneralSettings ref="generalSettingsRef" />
      </n-tab-pane>
      <n-tab-pane name="advanced" tab="高级">
        <AdvancedSettings ref="advancedSettingsRef" />
      </n-tab-pane>
      <n-tab-pane name="registry" tab="NPM 源管理">
        <RegistryManager />
      </n-tab-pane>
      <n-tab-pane name="migration" tab="全局包迁移">
        <MigrationHelper />
      </n-tab-pane>
      <n-tab-pane name="project" tab="项目检测">
        <ProjectDetector />
      </n-tab-pane>
      <n-tab-pane name="nvm-manager" tab="NVM 管理器">
        <NvmManager />
      </n-tab-pane>
    </n-tabs>
    <div class="footer">
      <n-button type="primary" @click="saveAllSettings">保存</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NTabPane, NTabs } from 'naive-ui'
import AdvancedSettings from './Setting/AdvancedSettings.vue'
import GeneralSettings from './Setting/GeneralSettings.vue'
import MigrationHelper from './Setting/MigrationHelper.vue'
import NvmManager from './Setting/NvmManager.vue'
import ProjectDetector from './Setting/ProjectDetector.vue'
import RegistryManager from './Setting/RegistryManager.vue'

interface SettingsExpose {
  saveSettings?: () => void
}

// Child settings panels expose optional save hooks that are invoked together.
const generalSettingsRef = ref<SettingsExpose | null>(null)
const advancedSettingsRef = ref<SettingsExpose | null>(null)

function saveAllSettings() {
  generalSettingsRef.value?.saveSettings?.()
  advancedSettingsRef.value?.saveSettings?.()
  window.$message.success('所有设置已保存')
}
</script>

<style scoped>
.setting-page {
  padding: 20px;
  position: relative;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.footer {
  position: absolute;
  bottom: 20px;
  right: 20px;
}
</style>

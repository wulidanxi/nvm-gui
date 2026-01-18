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
    </n-tabs>
    <div class="footer">
      <n-button type="primary" @click="saveAllSettings">保存</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane, NButton, NMessageProvider } from "naive-ui";
import GeneralSettings from "./Setting/GeneralSettings.vue";
import AdvancedSettings from "./Setting/AdvancedSettings.vue";
import RegistryManager from "./Setting/RegistryManager.vue";
import MigrationHelper from "./Setting/MigrationHelper.vue";
import ProjectDetector from "./Setting/ProjectDetector.vue";
import { ref, defineComponent } from "vue";

// Explicitly define component to ensure proper name registration
defineComponent({
  name: "Setting",
});

// 新增: 定义子组件的引用
const generalSettingsRef = ref(null);
const advancedSettingsRef = ref(null);

// 新增: 定义保存所有设置的方法
const saveAllSettings = () => {
  // 调用子组件的保存方法
  if (generalSettingsRef.value && generalSettingsRef.value.saveSettings) {
    generalSettingsRef.value.saveSettings();
  }
  if (advancedSettingsRef.value && advancedSettingsRef.value.saveSettings) {
    advancedSettingsRef.value.saveSettings();
  }

  // 显示保存成功的提示
  window.$message.success("所有设置已保存");
};
</script>

<style scoped>
.setting-page {
  padding: 20px;
  position: relative;
  min-height: 100vh;
}

.footer {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
</style>

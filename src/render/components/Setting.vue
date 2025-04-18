<template>
  <div class="setting-page">
    <h2>设置页面</h2>
    <n-tabs type="line" animated>
      <n-tab-pane name="general" tab="通用">
        <GeneralSettings />
      </n-tab-pane>
      <n-tab-pane name="advanced" tab="高级">
        <AdvancedSettings />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from "naive-ui";
import GeneralSettings from "./Setting/GeneralSettings.vue";
import AdvancedSettings from "./Setting/AdvancedSettings.vue";
</script>

<style scoped>
.setting-page {
  padding: 20px;
}
</style>
<script setup lang="ts">
import { computed, ref } from "vue";
import {
  BuildOutline,
  CodeSlashOutline,
  GitCompareOutline,
  GlobeOutline,
  SettingsOutline,
  TerminalOutline,
} from "@vicons/ionicons5";
import GeneralSettings from "./Setting/GeneralAppearanceSettings.vue";
import AdvancedSettings from "./Setting/AdvancedSettings.vue";
import NvmManager from "./Setting/NvmManager.vue";
import RegistryManager from "./Setting/RegistryManager.vue";
import MigrationHelper from "./Setting/MigrationHelper.vue";
import ProjectDetector from "./Setting/ProjectDetector.vue";

interface SettingsExpose {
  saveSettings?: () => void;
}

const activeKey = ref("general");
const generalSettingsRef = ref<SettingsExpose | null>(null);
const advancedSettingsRef = ref<SettingsExpose | null>(null);

const settingGroups = [
  {
    key: "general",
    label: "通用",
    description: "主题与基础偏好",
    icon: SettingsOutline,
  },
  {
    key: "advanced",
    label: "高级",
    description: "Node 数据源",
    icon: BuildOutline,
  },
  {
    key: "registry",
    label: "NPM 源管理",
    description: "测速与切换镜像源",
    icon: GlobeOutline,
  },
  {
    key: "migration",
    label: "全局包迁移",
    description: "迁移当前全局包",
    icon: GitCompareOutline,
  },
  {
    key: "project",
    label: "项目检测",
    description: "读取 .nvmrc",
    icon: CodeSlashOutline,
  },
  {
    key: "nvm-manager",
    label: "NVM 管理器",
    description: "检测、安装与升级",
    icon: TerminalOutline,
  },
];

const activeGroup = computed(() => {
  return settingGroups.find((item) => item.key === activeKey.value) || settingGroups[0];
});

function saveAllSettings() {
  generalSettingsRef.value?.saveSettings?.();
  advancedSettingsRef.value?.saveSettings?.();
  window.$message.success("设置已保存");
}
</script>

<template>
  <div class="app-page setting-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">Settings</div>
        <h1 class="page-title">设置中心</h1>
        <div class="page-description">
          把源管理、项目检测、全局包迁移和 NVM 管理器集中到一个工作区。
        </div>
      </div>
    </div>

    <section class="settings-workspace">
      <aside class="settings-nav panel-card">
        <button
          v-for="item in settingGroups"
          :key="item.key"
          class="settings-nav-item"
          :class="{ 'is-active': activeKey === item.key }"
          type="button"
          @click="activeKey = item.key"
        >
          <n-icon size="20"><component :is="item.icon" /></n-icon>
          <span>
            <span class="settings-nav-label">{{ item.label }}</span>
            <span class="settings-nav-description">{{ item.description }}</span>
          </span>
        </button>
      </aside>

      <main class="settings-panel panel-card">
        <header class="settings-panel-header">
          <div>
            <div class="settings-panel-kicker">配置项</div>
            <h2>{{ activeGroup.label }}</h2>
          </div>
          <n-tag round :bordered="false">{{ activeGroup.description }}</n-tag>
        </header>

        <div class="settings-panel-body">
          <GeneralSettings
            v-show="activeKey === 'general'"
            ref="generalSettingsRef"
          />
          <AdvancedSettings
            v-show="activeKey === 'advanced'"
            ref="advancedSettingsRef"
          />
          <RegistryManager v-show="activeKey === 'registry'" />
          <MigrationHelper v-show="activeKey === 'migration'" />
          <ProjectDetector v-show="activeKey === 'project'" />
          <NvmManager v-show="activeKey === 'nvm-manager'" />
        </div>

        <footer class="settings-footer">
          <span class="text-muted">通用和高级设置需要点击保存后生效。</span>
          <n-button type="primary" @click="saveAllSettings">保存设置</n-button>
        </footer>
      </main>
    </section>
  </div>
</template>

<style scoped>
.setting-page {
  gap: 0;
}

.settings-workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.settings-nav,
.settings-panel {
  border-radius: 8px;
  background: var(--app-surface);
}

.settings-nav {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  overscroll-behavior: contain;
}

.settings-nav-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 62px;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  color: var(--app-text-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.settings-nav-item:hover {
  background: var(--app-accent-soft);
}

.settings-nav-item.is-active {
  color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: inset 3px 0 0 var(--app-accent);
}

.settings-nav-label,
.settings-nav-description {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-nav-label {
  font-size: 14px;
  font-weight: 750;
}

.settings-nav-description {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.settings-panel-header,
.settings-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--app-border);
}

.settings-panel-header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 20px;
  font-weight: 800;
}

.settings-panel-kicker {
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
}

.settings-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 18px;
  overflow: auto;
  overscroll-behavior: contain;
}

.settings-footer {
  flex-wrap: wrap;
  border-top: 1px solid var(--app-border);
  border-bottom: 0;
  background:
    linear-gradient(90deg, var(--app-accent-soft), transparent 56%),
    var(--app-surface);
}

.settings-footer .text-muted {
  min-width: 0;
}

:deep(.n-card) {
  border-radius: 8px;
}

@media (max-width: 940px) {
  .settings-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(120px, 34%) minmax(0, 1fr);
  }

  .settings-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

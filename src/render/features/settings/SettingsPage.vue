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
import { useI18n } from "@render/i18n";
import { useAppMotion } from "@render/utils/motionPresets";
import GeneralSettings from "./components/GeneralAppearanceSettings.vue";
import AdvancedSettings from "./components/AdvancedSettings.vue";
import NvmManager from "./components/NvmManager.vue";
import RegistryManager from "./components/RegistryManager.vue";
import MigrationHelper from "./components/MigrationHelper.vue";
import ProjectDetector from "./components/ProjectDetector.vue";

interface SettingsExpose {
  saveSettings?: () => void;
}

const activeKey = ref("general");
const generalSettingsRef = ref<SettingsExpose | null>(null);
const advancedSettingsRef = ref<SettingsExpose | null>(null);
const { t } = useI18n();
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  headingMotion,
  navMotion,
} = useAppMotion();

const settingGroups = computed(() => [
  {
    key: "general",
    label: t("settings.general"),
    description: t("settings.generalDescription"),
    icon: SettingsOutline,
  },
  {
    key: "advanced",
    label: t("settings.advanced"),
    description: t("settings.advancedDescription"),
    icon: BuildOutline,
  },
  {
    key: "registry",
    label: t("settings.registry"),
    description: t("settings.registryDescription"),
    icon: GlobeOutline,
  },
  {
    key: "migration",
    label: t("settings.migration"),
    description: t("settings.migrationDescription"),
    icon: GitCompareOutline,
  },
  {
    key: "project",
    label: t("settings.project"),
    description: t("settings.projectDescription"),
    icon: CodeSlashOutline,
  },
  {
    key: "nvm-manager",
    label: t("settings.nvmManager"),
    description: t("settings.nvmManagerDescription"),
    icon: TerminalOutline,
  },
]);

const activeGroup = computed(() => {
  return settingGroups.value.find((item) => item.key === activeKey.value) || settingGroups.value[0];
});

function saveAllSettings() {
  generalSettingsRef.value?.saveSettings?.();
  advancedSettingsRef.value?.saveSettings?.();
  window.$message.success(t("common.settingsSaved"));
}
</script>

<template>
  <div class="app-page setting-page">
    <div class="page-heading" v-motion="headingMotion">
      <div>
        <div class="page-kicker">{{ t("settings.kicker") }}</div>
        <h1 class="page-title">{{ t("settings.title") }}</h1>
        <div class="page-description">
          {{ t("settings.description") }}
        </div>
      </div>
    </div>

    <section class="settings-workspace" v-auto-animate="autoAnimateOptions">
      <aside
        v-motion="cardMotion"
        v-auto-animate="autoAnimateOptions"
        class="settings-nav panel-card"
      >
        <button
          v-for="item in settingGroups"
          :key="item.key"
          v-motion="navMotion"
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

      <main v-motion="cardMotion" class="settings-panel panel-card">
        <header class="settings-panel-header" v-motion="headingMotion">
          <div>
            <div class="settings-panel-kicker">{{ t("settings.panelKicker") }}</div>
            <h2>{{ activeGroup.label }}</h2>
          </div>
          <n-tag round :bordered="false">{{ activeGroup.description }}</n-tag>
        </header>

        <div class="settings-panel-body" v-auto-animate="autoAnimateOptions">
          <Transition name="settings-section" appear>
            <GeneralSettings
              v-show="activeKey === 'general'"
              ref="generalSettingsRef"
            />
          </Transition>
          <Transition name="settings-section" appear>
            <AdvancedSettings
              v-show="activeKey === 'advanced'"
              ref="advancedSettingsRef"
            />
          </Transition>
          <Transition name="settings-section" appear>
            <RegistryManager v-show="activeKey === 'registry'" />
          </Transition>
          <Transition name="settings-section" appear>
            <MigrationHelper v-show="activeKey === 'migration'" />
          </Transition>
          <Transition name="settings-section" appear>
            <ProjectDetector v-show="activeKey === 'project'" />
          </Transition>
          <Transition name="settings-section" appear>
            <NvmManager v-show="activeKey === 'nvm-manager'" />
          </Transition>
        </div>

        <footer class="settings-footer" v-motion="cardMotion">
          <span class="text-muted">{{ t("settings.footerHint") }}</span>
          <n-button v-motion="controlMotion" type="primary" @click="saveAllSettings">
            {{ t("common.saveSettings") }}
          </n-button>
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

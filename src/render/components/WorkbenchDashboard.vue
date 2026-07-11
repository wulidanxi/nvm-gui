<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CloudDownloadOutline,
  CodeSlashOutline,
  SettingsOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import { currentNvmManagerVersion, nvmCurrent } from "@render/api";
import { useI18n } from "@render/i18n";
import { useAppMotion } from "@render/utils/motionPresets";
import { desktopApi } from "@render/api/desktop";

const router = useRouter();
const { t } = useI18n();
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  headingMotion,
  heroMotion,
  tileMotion,
} = useAppMotion();

const nodeStatus = ref<"loading" | "missing" | "ready">("loading");
const nvmStatus = ref<"loading" | "missing" | "ready">("loading");
const nodeVersion = ref("");
const nvmManagerVersion = ref("");
const electronVersion = ref("");

const nodeReady = computed(() => nodeStatus.value === "ready");
const nvmReady = computed(() => nvmStatus.value === "ready");
const nodeVersionLabel = computed(() => {
  if (nodeStatus.value === "loading") return t("common.loading");
  if (nodeStatus.value === "missing") return t("common.nvmMissing");
  return nodeVersion.value;
});
const nvmManagerVersionLabel = computed(() => {
  if (nvmStatus.value === "loading") return t("common.loading");
  if (nvmStatus.value === "missing") return t("common.unavailable");
  return nvmManagerVersion.value;
});

const healthItems = computed(() => [
  {
    label: t("dashboard.nodeRuntime"),
    value: nodeVersionLabel.value,
    ready: nodeReady.value,
  },
  {
    label: t("dashboard.nvmManager"),
    value: nvmManagerVersionLabel.value,
    ready: nvmReady.value,
  },
  {
    label: t("dashboard.desktopRuntime"),
    value: `Electron ${electronVersion.value || "-"}`,
    ready: Boolean(electronVersion.value),
  },
]);

const quickActions = computed(() => [
  {
    title: t("dashboard.manageLocalTitle"),
    description: t("dashboard.manageLocalDescription"),
    path: "/local",
    icon: SwapHorizontalOutline,
  },
  {
    title: t("dashboard.installNewTitle"),
    description: t("dashboard.installNewDescription"),
    path: "/available",
    icon: CloudDownloadOutline,
  },
  {
    title: t("dashboard.projectDetectorTitle"),
    description: t("dashboard.projectDetectorDescription"),
    path: "/setting",
    icon: CodeSlashOutline,
  },
  {
    title: t("dashboard.nvmManager"),
    description: t("dashboard.nvmManagerDescription"),
    path: "/setting",
    icon: SettingsOutline,
  },
]);

async function getCurrentNodeVersion() {
  try {
    nodeVersion.value = await nvmCurrent();
    nodeStatus.value = "ready";
  } catch {
    nodeStatus.value = "missing";
  }
}

async function getNvmManagerVersion() {
  try {
    nvmManagerVersion.value = await currentNvmManagerVersion();
    nvmStatus.value = "ready";
  } catch {
    nvmStatus.value = "missing";
  }
}

function openAction(path: string) {
  router.push(path);
}

getCurrentNodeVersion();
getNvmManagerVersion();

onMounted(() => {
  electronVersion.value = desktopApi.system.electronVersion;
});
</script>

<template>
  <div class="app-page dashboard-page">
    <div class="page-heading" v-motion="headingMotion">
      <div>
        <div class="page-kicker">{{ t("dashboard.kicker") }}</div>
        <h1 class="page-title">{{ t("dashboard.title") }}</h1>
        <div class="page-description">
          {{ t("dashboard.description") }}
        </div>
      </div>
      <n-button v-motion="controlMotion" type="primary" @click="openAction('/available')">
        <template #icon>
          <n-icon><CloudDownloadOutline /></n-icon>
        </template>
        {{ t("dashboard.installNode") }}
      </n-button>
    </div>

    <div v-auto-animate="autoAnimateOptions" class="page-scroll-body">
      <section class="hero-panel" v-motion="heroMotion">
      <div class="hero-copy">
        <div class="hero-eyebrow">{{ t("dashboard.currentRuntime") }}</div>
        <div class="hero-version">{{ nodeVersionLabel }}</div>
        <div class="hero-subtitle">
          {{ nodeReady ? t("dashboard.runtimeReady") : t("dashboard.runtimeNeedsNvm") }}
        </div>
      </div>
      <div class="hero-status">
        <n-tag :type="nodeReady ? 'success' : 'warning'" round :bordered="false">
          {{ nodeReady ? t("common.ready") : t("common.pending") }}
        </n-tag>
      </div>
      </section>

      <section class="dashboard-grid" v-auto-animate="autoAnimateOptions">
      <n-card
        v-motion="cardMotion"
        class="panel-card"
        :bordered="false"
        :title="t('dashboard.healthTitle')"
      >
        <div class="health-list" v-auto-animate="autoAnimateOptions">
          <div
            v-for="item in healthItems"
            :key="item.label"
            v-motion="tileMotion"
            class="health-row"
          >
            <div class="health-leading">
              <div class="status-dot" :class="{ 'is-warning': !item.ready }" />
              <div>
                <div class="health-label">{{ item.label }}</div>
                <div class="health-value">{{ item.value }}</div>
              </div>
            </div>
            <n-tag
              size="small"
              round
              :bordered="false"
              :type="item.ready ? 'success' : 'warning'"
            >
              {{ item.ready ? t("common.success") : t("common.pending") }}
            </n-tag>
          </div>
        </div>
      </n-card>

      <n-card
        v-motion="cardMotion"
        class="panel-card"
        :bordered="false"
        :title="t('dashboard.quickActionsTitle')"
      >
        <div class="action-grid" v-auto-animate="autoAnimateOptions">
          <button
            v-for="item in quickActions"
            :key="item.title"
            v-motion="tileMotion"
            class="action-tile"
            type="button"
            @click="openAction(item.path)"
          >
            <n-icon size="22"><component :is="item.icon" /></n-icon>
            <span>
              <span class="action-title">{{ item.title }}</span>
              <span class="action-description">{{ item.description }}</span>
            </span>
          </button>
        </div>
      </n-card>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  gap: 0;
}

.dashboard-page .page-scroll-body {
  gap: 14px;
}

.hero-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 118px;
  padding: 20px 22px;
  border: 1px solid var(--app-accent-strong);
  border-radius: 8px;
  background:
    linear-gradient(135deg, var(--app-accent-strong), transparent 42%),
    var(--app-surface);
  box-shadow: var(--app-shadow-strong);
}

.hero-eyebrow {
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.hero-version {
  margin-top: 4px;
  color: var(--app-text);
  font-size: 34px;
  font-weight: 850;
  line-height: 1.05;
}

.hero-subtitle {
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 14px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
  gap: 12px;
}

.health-list {
  display: grid;
  gap: 8px;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.health-leading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot.is-warning {
  background: var(--app-warning);
  box-shadow: 0 0 0 4px var(--app-warning-soft);
}

.health-label,
.action-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 750;
}

.health-value,
.action-description {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.action-tile {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  min-height: 68px;
  padding: 11px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-accent);
  background: var(--app-surface-raised);
  text-align: left;
  cursor: pointer;
}

.action-tile:hover {
  border-color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .hero-panel,
  .dashboard-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

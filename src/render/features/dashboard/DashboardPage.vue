<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import {
  CloudDownloadOutline,
  CodeSlashOutline,
  SettingsOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import { useI18n } from "@render/i18n";
import { useAppMotion } from "@render/utils/motionPresets";
import { useRuntimeStore } from "@render/stores/RuntimeStore";

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

const runtimeStore = useRuntimeStore();
const {
  currentNodeStatus: nodeStatus,
  nvmManagerStatus: nvmStatus,
  currentNodeVersion: nodeVersion,
} = storeToRefs(runtimeStore);

// 所有运行时卡片共用 RuntimeStore，避免仪表盘为每个指标重复执行命令。
const nodeReady = computed(() => nodeStatus.value === "ready");
const nvmReady = computed(() => nvmStatus.value === "ready");
const nodeVersionLabel = computed(() => {
  if (nodeStatus.value === "loading") return t("common.loading");
  if (nodeStatus.value === "missing") return t("common.unavailable");
  return nodeVersion.value;
});

const runtimeState = computed(() => {
  if (nodeStatus.value === "loading" || nvmStatus.value === "loading") {
    return {
      subtitle: t("dashboard.runtimeChecking"),
      tag: t("common.loading"),
      tagType: "default" as const,
      action: null,
    };
  }

  if (!nvmReady.value) {
    return {
      subtitle: t("dashboard.runtimeNeedsNvm"),
      tag: t("common.pending"),
      tagType: "warning" as const,
      action: {
        label: t("dashboard.configureNvmManager"),
        path: { path: "/setting", query: { section: "nvm-manager" } },
      },
    };
  }

  if (!nodeReady.value) {
    return {
      subtitle: t("dashboard.runtimeNeedsNode"),
      tag: t("common.pending"),
      tagType: "warning" as const,
      action: {
        label: t("dashboard.manageLocalTitle"),
        path: "/local",
      },
    };
  }

  return {
    subtitle: t("dashboard.runtimeReady"),
    tag: t("common.ready"),
    tagType: "success" as const,
    action: null,
  };
});

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
    path: { path: "/setting", query: { section: "project" } },
    icon: CodeSlashOutline,
  },
  {
    title: t("dashboard.nvmManager"),
    description: t("dashboard.nvmManagerDescription"),
    path: { path: "/setting", query: { section: "nvm-manager" } },
    icon: SettingsOutline,
  },
]);

/** 从快捷操作进入目标工作台页面。 */
function openAction(path: RouteLocationRaw) {
  router.push(path);
}

onMounted(() => {
  runtimeStore.refresh();
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
            {{ runtimeState.subtitle }}
          </div>
        </div>
        <div class="hero-status">
          <n-tag :type="runtimeState.tagType" round :bordered="false">
            {{ runtimeState.tag }}
          </n-tag>
          <n-button
            v-if="runtimeState.action"
            v-motion="controlMotion"
            size="small"
            type="primary"
            @click="openAction(runtimeState.action.path)"
          >
            {{ runtimeState.action.label }}
          </n-button>
        </div>
      </section>

      <n-card
        v-motion="cardMotion"
        class="panel-card quick-actions-card"
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

.hero-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.action-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 750;
}

.action-description {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .hero-panel,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-status {
    align-items: flex-start;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>

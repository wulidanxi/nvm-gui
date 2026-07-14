<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import type { RouteLocationRaw } from "vue-router";
import type { CommandLogStatistics } from "@common/types";
import {
  CloudDownloadOutline,
  CodeSlashOutline,
  SettingsOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import { useI18n } from "@render/i18n";
import { getCommandLogStatistics } from "@render/api";
import { useAppMotion } from "@render/utils/motionPresets";
import { useRuntimeStore } from "@render/stores/RuntimeStore";

const router = useRouter();
const { locale, t } = useI18n();
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

const statistics = ref<CommandLogStatistics | null>(null);
const statisticsLoading = ref(true);
const statisticsFailed = ref(false);

const statisticsMetrics = computed(() => {
  const data = statistics.value;
  if (!data) return [];
  return [
    { label: t("dashboard.statisticsTotal"), value: String(data.total) },
    {
      label: t("dashboard.statisticsSuccessRate"),
      value: data.successRate === null ? "—" : `${data.successRate}%`,
    },
    {
      label: t("dashboard.statisticsAverageDuration"),
      value: formatDuration(data.averageDurationMs),
    },
    { label: t("dashboard.statisticsSwitches"), value: String(data.switchCount) },
    {
      label: t("dashboard.statisticsMaintenance"),
      value: `${data.installCount} / ${data.uninstallCount}`,
      hint: t("dashboard.statisticsInstallUninstall"),
    },
  ];
});

const trendDataMaximum = computed(() => Math.max(
  0,
  ...(statistics.value?.daily.map(item => item.success + item.error) || []),
));

const trendScaleMaximum = computed(() => Math.max(1, trendDataMaximum.value));

const trendTicks = computed(() => {
  const maximum = trendDataMaximum.value;
  if (maximum === 0) return [0];
  if (maximum === 1) return [1, 0];
  return [maximum, Math.ceil(maximum / 2), 0];
});

function trendHeight(value: number) {
  return `${value / trendScaleMaximum.value * 100}%`;
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null) return "—";
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${Math.round(durationMs / 100) / 10} s`;
}

function formatTrendDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return {
    day: value.toLocaleDateString(locale.value, { weekday: "short" }),
    date: date.slice(5).replace("-", "/"),
  };
}

async function loadStatistics() {
  statisticsLoading.value = true;
  statisticsFailed.value = false;
  try {
    statistics.value = await getCommandLogStatistics();
  } catch {
    statisticsFailed.value = true;
  } finally {
    statisticsLoading.value = false;
  }
}

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
  loadStatistics();
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

      <n-card
        v-motion="cardMotion"
        class="panel-card statistics-card"
        :bordered="false"
        :title="t('dashboard.statisticsTitle')"
      >
        <template #header-extra>
          <div class="statistics-actions">
            <n-button text :loading="statisticsLoading" @click="loadStatistics">
              {{ t("common.refresh") }}
            </n-button>
            <n-button text type="primary" @click="openAction('/logs')">
              {{ t("dashboard.statisticsViewLogs") }}
            </n-button>
          </div>
        </template>

        <div v-if="statisticsLoading && !statistics" class="statistics-state">
          {{ t("common.loading") }}
        </div>
        <div v-else-if="statisticsFailed && !statistics" class="statistics-state statistics-error">
          <span>{{ t("dashboard.statisticsFailed") }}</span>
          <n-button size="small" @click="loadStatistics">
            {{ t("dashboard.statisticsRetry") }}
          </n-button>
        </div>
        <div v-else-if="statistics" class="statistics-content">
          <div v-if="statisticsFailed" class="statistics-refresh-error">
            {{ t("dashboard.statisticsFailed") }}
          </div>
          <div class="statistics-description">
            {{ t("dashboard.statisticsDescription") }}
          </div>
          <div class="statistics-grid">
            <div v-for="metric in statisticsMetrics" :key="metric.label" class="statistics-metric">
              <div class="statistics-metric-label">{{ metric.label }}</div>
              <div class="statistics-metric-value">{{ metric.value }}</div>
              <div v-if="metric.hint" class="statistics-metric-hint">{{ metric.hint }}</div>
            </div>
          </div>

          <div v-if="statistics.total === 0" class="statistics-empty">
            {{ t("dashboard.statisticsEmpty") }}
          </div>

          <div class="trend-heading">
            <span>
              {{ t("dashboard.statisticsTrend") }}
              <small>{{ t("dashboard.statisticsYAxis") }}</small>
            </span>
            <span class="trend-legend">
              <span><i class="legend-dot legend-success" />{{ t("dashboard.statisticsSuccess") }}</span>
              <span><i class="legend-dot legend-error" />{{ t("dashboard.statisticsError") }}</span>
            </span>
          </div>
          <div class="trend-plot">
            <div class="trend-y-axis" :class="{ 'is-empty': trendTicks.length === 1 }" aria-hidden="true">
              <span v-for="tick in trendTicks" :key="tick" class="trend-y-tick">{{ tick }}</span>
            </div>
            <div class="trend-chart">
              <div
                v-for="item in statistics.daily"
                :key="item.date"
                class="trend-column"
                :title="t('dashboard.statisticsTrendAria', { date: item.date, success: item.success, error: item.error })"
                :aria-label="t('dashboard.statisticsTrendAria', { date: item.date, success: item.success, error: item.error })"
              >
                <div class="trend-bar">
                  <div v-if="item.error" class="trend-segment trend-error" :style="{ height: trendHeight(item.error) }" />
                  <div v-if="item.success" class="trend-segment trend-success" :style="{ height: trendHeight(item.success) }" />
                </div>
                <div class="trend-day">{{ formatTrendDate(item.date).day }}</div>
                <div class="trend-date">{{ formatTrendDate(item.date).date }}</div>
              </div>
            </div>
          </div>
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

.statistics-content {
  display: grid;
  gap: 14px;
}

.statistics-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.statistics-refresh-error {
  color: var(--app-error);
  font-size: 12px;
}

.statistics-description,
.statistics-metric-hint,
.trend-date {
  color: var(--app-text-muted);
  font-size: 12px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.statistics-metric {
  min-height: 82px;
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-raised);
}

.statistics-metric-label {
  color: var(--app-text-muted);
  font-size: 12px;
}

.statistics-metric-value {
  margin-top: 4px;
  color: var(--app-text);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
}

.statistics-metric-hint {
  margin-top: 4px;
}

.statistics-state,
.statistics-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 126px;
  color: var(--app-text-muted);
}

.statistics-error {
  gap: 12px;
}

.statistics-empty {
  min-height: 34px;
  padding: 6px;
  border-radius: 6px;
  background: var(--app-surface-raised);
}

.trend-heading,
.trend-legend,
.trend-legend > span {
  display: flex;
  align-items: center;
}

.trend-heading {
  justify-content: space-between;
  gap: 12px;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
}

.trend-heading small {
  margin-left: 4px;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 500;
}

.trend-legend {
  gap: 12px;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 500;
}

.trend-legend > span {
  gap: 5px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-success,
.trend-success {
  background: var(--app-success);
}

.legend-error,
.trend-error {
  background: var(--app-error);
}

.trend-plot {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
}

.trend-y-axis {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-direction: column;
  height: 86px;
  color: var(--app-text-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.trend-y-axis.is-empty {
  justify-content: flex-end;
}

.trend-chart {
  position: relative;
  display: grid;
  grid-template-columns: repeat(7, minmax(34px, 1fr));
  gap: 8px;
  min-height: 126px;
}

.trend-chart::before {
  position: absolute;
  z-index: 0;
  top: 0;
  right: 0;
  left: 0;
  height: 86px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
  background: linear-gradient(
    to bottom,
    transparent calc(50% - 0.5px),
    var(--app-border) calc(50% - 0.5px),
    var(--app-border) calc(50% + 0.5px),
    transparent calc(50% + 0.5px)
  );
  content: "";
  pointer-events: none;
}

.trend-column {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: 86px auto auto;
  gap: 3px;
  min-width: 0;
  text-align: center;
}

.trend-bar {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-self: stretch;
  width: min(28px, 62%);
  margin: 0 auto;
  overflow: hidden;
  border-radius: 5px 5px 2px 2px;
  background: transparent;
}

.trend-segment {
  min-height: 2px;
}

.trend-day {
  overflow: hidden;
  color: var(--app-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .action-grid,
  .statistics-grid {
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

  .trend-chart {
    gap: 4px;
  }
}

@media (max-width: 520px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .trend-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .trend-date {
    display: none;
  }
}
</style>

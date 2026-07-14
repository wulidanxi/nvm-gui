<script setup lang="ts">
import { computed, h, onBeforeMount, ref, watch } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  FilterOutline,
  RefreshOutline,
  SearchOutline,
} from "@vicons/ionicons5";
import type { NodeReleaseSummary } from "@common/types";
import OperationFeedback from "./OperationFeedback.vue";
import { useI18n } from "@render/i18n";
import { useAvailableNodeReleases } from "./useAvailableNodeReleases";
import { useAppMotion } from "@render/utils/motionPresets";
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZES } from "@render/utils/tablePagination";
import { useNvmOperations } from "./useNvmOperations";

const {
  releases,
  filteredReleases,
  loading,
  nvmMissing,
  source,
  fetchedAt,
  warning,
  keyword,
  ltsOnly,
  refresh,
} = useAvailableNodeReleases();
const nvmOperations = useNvmOperations();
const { t } = useI18n();
const operationState = nvmOperations.operationState;
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  headingMotion,
} = useAppMotion();

const page = ref(1);
const pageSize = ref(DEFAULT_TABLE_PAGE_SIZE);

const tableScrollX = 1100;

// 发布记录已在主进程按主版本聚合，此处只负责筛选、分页和展示。
const summaryItems = computed(() => [
  {
    label: t("available.recommendedMajors"),
    value: String(releases.value.length),
  },
  {
    label: t("common.installed"),
    value: String(releases.value.filter((item) => item.installed).length),
  },
  {
    label: t("available.lts"),
    value: String(releases.value.filter((item) => item.status === "lts").length),
  },
]);

const pagedReleases = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredReleases.value.slice(start, start + pageSize.value);
});

watch([keyword, ltsOnly, pageSize], () => {
  page.value = 1;
});

watch(filteredReleases, (items) => {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize.value));
  if (page.value > lastPage) page.value = lastPage;
});

const availableColumns = computed<DataTableColumns<NodeReleaseSummary>>(() => [
  {
    title: t("local.nodeVersion"),
    key: "version",
    minWidth: 140,
    render(row) {
      return h("div", { class: "version-cell", title: row.version }, [
        h("span", { class: "version-name" }, row.version),
        row.installed
          ? h(
              NTag,
              { size: "small", type: "success", round: true, bordered: false },
              { default: () => t("common.installed") },
            )
          : null,
      ]);
    },
  },
  {
    title: t("available.major"),
    key: "major",
    width: 140,
    render(row) {
      return `Node.js ${row.major}`;
    },
  },
  {
    title: "npm",
    key: "npm",
    width: 120,
  },
  {
    title: t("available.firstReleased"),
    key: "firstReleased",
    width: 140,
  },
  {
    title: t("available.lastReleaseUpdate"),
    key: "lastUpdated",
    width: 140,
  },
  {
    title: t("available.status"),
    key: "status",
    width: 120,
    render(row) {
      const statusKey = row.status === "eol"
        ? "available.statusEol"
        : row.status === "lts"
          ? "available.statusLts"
          : "available.statusCurrent";
      return h(
        NTag,
        {
          type: row.status === "lts" ? "success" : row.status === "current" ? "info" : "error",
          bordered: false,
          round: true,
        },
        { default: () => t(statusKey) },
      );
    },
  },
  {
    title: t("common.action"),
    key: "action",
    width: 150,
    fixed: "right",
    render(row) {
      const busyVersion = nvmOperations.operatingVersion.value;
      return h(
        NButton,
        {
          size: "small",
          type: row.installed ? "default" : "primary",
          secondary: true,
          disabled:
            Boolean(busyVersion && busyVersion !== row.version) ||
            row.installed,
          loading: busyVersion === row.version,
          onClick: () => installNode(row),
        },
        { default: () => (!row.installed ? t("common.install") : t("common.installed")) },
      );
    },
  },
]);

/** 安装所选主版本的最新补丁版本并重新同步发布状态。 */
async function installNode(row: NodeReleaseSummary) {
  try {
    await nvmOperations.install(row.version);
    window.$message.success(t("available.installSuccess", { version: row.version }));
    await initData();
  } catch (error: any) {
    window.$message.error(t("available.installFailed", { message: error.message || t("common.failedUnknown") }));
  }
}

/** 首次进入或安装完成后刷新发布数据。 */
async function initData() {
  try {
    await refresh();
  } catch (error: any) {
    window.$message.error(
      t("available.loadFailed", { message: error.message || t("common.failedUnknown") }),
    );
  }
}

onBeforeMount(() => {
  initData();
});
</script>

<template>
  <div class="app-page available-page">
    <div class="page-heading" v-motion="headingMotion">
      <div>
        <div class="page-kicker">{{ t("available.kicker") }}</div>
        <h1 class="page-title">{{ t("available.title") }}</h1>
        <div class="page-description">
          {{ t("available.description") }}
        </div>
      </div>
      <n-button v-motion="controlMotion" :loading="loading" @click="initData">
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
        {{ t("common.refresh") }}
      </n-button>
    </div>

    <div v-auto-animate="autoAnimateOptions" class="page-scroll-body table-page-body">
      <OperationFeedback :state="operationState" />

      <n-alert v-if="nvmMissing" type="warning" class="page-alert">
        {{ t("local.nvmMissingAlert") }}
      </n-alert>

      <n-alert v-if="warning" type="warning" class="page-alert">
        {{ t("available.staleWarning", { message: warning }) }}
      </n-alert>

      <div v-if="source && fetchedAt" class="release-source-status">
        <n-tag size="small" :type="source === 'stale-cache' ? 'warning' : 'info'" :bordered="false" round>
          {{ t(`available.source.${source}`) }}
        </n-tag>
        <span>{{ t("available.lastUpdated", { time: new Date(fetchedAt).toLocaleString() }) }}</span>
      </div>

      <section class="summary-grid" v-auto-animate="autoAnimateOptions">
        <n-card
          v-for="item in summaryItems"
          :key="item.label"
          v-motion="cardMotion"
          class="panel-card summary-card"
          :bordered="false"
        >
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </n-card>
      </section>

      <n-card v-motion="cardMotion" class="panel-card table-panel-card" :bordered="false">
        <div class="table-panel-filters">
          <n-input
            v-model:value="keyword"
            class="table-panel-search"
            clearable
            :placeholder="t('available.searchPlaceholder')"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          <n-checkbox v-model:checked="ltsOnly">
            <n-icon><FilterOutline /></n-icon>
            {{ t("available.ltsOnly") }}
          </n-checkbox>
        </div>
        <n-data-table
          flex-height
          :columns="availableColumns"
          :data="pagedReleases"
          :loading="loading"
          :scroll-x="tableScrollX"
        />
        <div class="table-panel-pagination">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            show-size-picker
            :page-sizes="TABLE_PAGE_SIZES"
            :item-count="filteredReleases.length"
          />
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.available-page {
  gap: 0;
}

.page-alert {
  margin-bottom: 2px;
}

.release-source-status { display: flex; align-items: center; gap: 8px; color: var(--app-text-muted); font-size: 12px; }

:deep(.version-cell) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

:deep(.version-name) {
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

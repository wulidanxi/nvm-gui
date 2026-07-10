<script setup lang="ts">
import { computed, h, onBeforeMount } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  FilterOutline,
  RefreshOutline,
  SearchOutline,
} from "@vicons/ionicons5";
import type { NodeReleaseSummary } from "@common/types";
import OperationFeedback from "@render/components/OperationFeedback.vue";
import { useI18n } from "@render/i18n";
import { useAvailableNodeReleases } from "@render/utils/useAvailableNodeReleases";
import { useAppMotion } from "@render/utils/motionPresets";
import { useNvmOperations } from "@render/utils/useNvmOperations";

const {
  releases,
  filteredReleases,
  loading,
  nvmMissing,
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

const pagination = {
  pageSize: 4,
  picker: true,
};

const tableScrollX = 940;

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
    value: String(releases.value.filter((item) => item.lts !== false).length),
  },
]);

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
    title: t("available.lts"),
    key: "lts",
    width: 160,
    render(row) {
      return h(
        NTag,
        {
          type: row.lts !== false ? "success" : "default",
          bordered: false,
          round: true,
        },
        {
          default: () => (row.lts !== false ? row.lts : t("available.nonLts")),
        },
      );
    },
  },
  {
    title: t("available.releaseDate"),
    key: "date",
    width: 130,
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

async function installNode(row: NodeReleaseSummary) {
  try {
    await nvmOperations.install(row.version);
    window.$message.success(t("available.installSuccess", { version: row.version }));
    await initData();
  } catch (error: any) {
    window.$message.error(t("available.installFailed", { message: error.message || t("common.failedUnknown") }));
  }
}

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

    <div v-auto-animate="autoAnimateOptions" class="page-scroll-body">
      <OperationFeedback :state="operationState" />

      <n-alert v-if="nvmMissing" type="warning" class="page-alert">
        {{ t("local.nvmMissingAlert") }}
      </n-alert>

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

      <div class="toolbar-card" v-motion="cardMotion">
        <n-input
          v-model:value="keyword"
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

      <n-card v-motion="cardMotion" class="panel-card table-card" :bordered="false">
        <n-data-table
          :bordered="false"
          :single-line="false"
          :columns="availableColumns"
          :data="filteredReleases"
          :pagination="pagination"
          :loading="loading"
          :scroll-x="tableScrollX"
        />
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

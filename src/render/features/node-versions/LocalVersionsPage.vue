<script lang="ts" setup>
import { computed, h, onActivated, onMounted, ref, watch } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  RefreshOutline,
  SearchOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import type { InstalledNodeVersion } from "@common/types";
import OperationFeedback from "./OperationFeedback.vue";
import { useI18n } from "@render/i18n";
import { consumeNodeEnvDirty } from "@render/utils/nodeEnvDirty";
import { useInstalledNodeVersions } from "./useInstalledNodeVersions";
import { useAppMotion } from "@render/utils/motionPresets";
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZES } from "@render/utils/tablePagination";
import { useNvmOperations } from "./useNvmOperations";

const { versions, loading, nvmMissing, currentVersion, refresh } =
  useInstalledNodeVersions();
const nvmOperations = useNvmOperations();
const { t } = useI18n();
const operationState = nvmOperations.operationState;
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  headingMotion,
} = useAppMotion();

const keyword = ref("");
const checkedRowKeysRef = ref<string[]>([]);

const page = ref(1);
const pageSize = ref(DEFAULT_TABLE_PAGE_SIZE);

const tableScrollX = 760;

const currentVersionLabel = computed(() => currentVersion.value || t("local.inactive"));

const filteredData = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return versions.value;

  return versions.value.filter((item) =>
    item.version.toLowerCase().includes(query),
  );
});

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

watch([keyword, pageSize], () => {
  page.value = 1;
});

watch(filteredData, (items) => {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize.value));
  if (page.value > lastPage) page.value = lastPage;
});

const summaryItems = computed(() => [
  {
    label: t("local.installedVersions"),
    value: String(versions.value.length),
  },
  {
    label: t("local.activeVersion"),
    value: currentVersionLabel.value,
  },
  {
    label: t("local.removableVersions"),
    value: String(versions.value.filter((item) => !item.active).length),
  },
]);

const titleField = computed<DataTableColumns<InstalledNodeVersion>>(() => [
  {
    type: "selection",
    multiple: false,
    width: 56,
  },
  {
    title: t("local.nodeVersion"),
    key: "version",
    minWidth: 140,
    width: 150,
    render(row) {
      return h("div", { class: "version-cell", title: row.version }, [
        h("span", { class: "version-name" }, row.version),
        row.active
          ? h(
              NTag,
              {
                size: "small",
                type: "success",
                round: true,
                bordered: false,
              },
              { default: () => t("common.current") },
            )
          : null,
      ]);
    },
  },
  {
    title: t("common.status"),
    key: "active",
    width: 150,
    render(row) {
      return h(
        NTag,
        {
          type: row.active ? "success" : "default",
          round: true,
          bordered: false,
        },
        {
          default: () => (row.active ? t("common.currentEnvironment") : t("local.switchable")),
        },
      );
    },
  },
  {
    title: t("common.action"),
    key: "action",
    width: 100,
    render(row) {
      const busyVersion = nvmOperations.operatingVersion.value;
      return h(
        NButton,
        {
          size: "small",
          type: row.active ? "default" : "error",
          secondary: true,
          disabled:
            Boolean(busyVersion && busyVersion !== row.version) || row.active,
          loading: busyVersion === row.version,
          onClick: () => uninstallNode(row),
        },
        { default: () => (row.active ? t("local.inUse") : t("common.uninstall")) },
      );
    },
  },
]);

onMounted(() => {
  detail();
});

onActivated(() => {
  if (consumeNodeEnvDirty()) detail();
});

async function uninstallNode(row: InstalledNodeVersion) {
  try {
    await nvmOperations.uninstall(row.version);
    window.$message.success(t("local.uninstallSuccess", { version: row.version }));
    await detail();
  } catch (error: any) {
    window.$message.error(t("local.uninstallFailed", { message: error.message || t("common.failedUnknown") }));
  }
}

async function detail(showSuccess = false) {
  try {
    await refresh();
    checkedRowKeysRef.value = versions.value
      .filter((item) => item.active)
      .map((item) => item.version);

    if (showSuccess) window.$message.success(t("common.refreshSuccess"));
  } catch (error: any) {
    window.$message.error(
      t("local.listFailed", { message: error.message || t("common.failedUnknown") }),
    );
    console.error(error);
  }
}

async function handleCheck(rowKeys: string[]) {
  const targetVersion = Array.isArray(rowKeys) ? rowKeys[0] : rowKeys;
  if (!targetVersion) return;

  try {
    await nvmOperations.use(String(targetVersion));
    window.$message.success(t("local.switchSuccess", { version: String(targetVersion) }));
    await detail();
  } catch (error: any) {
    window.$message.error(t("local.switchFailed", { message: error.message || t("common.failedUnknown") }));
    await detail();
  }
}
</script>

<template>
  <div class="app-page local-page">
    <div class="page-heading" v-motion="headingMotion">
      <div>
        <div class="page-kicker">{{ t("local.kicker") }}</div>
        <h1 class="page-title">{{ t("local.title") }}</h1>
        <div class="page-description">
          {{ t("local.description") }}
        </div>
      </div>
      <n-button v-motion="controlMotion" :loading="loading" @click="detail(true)">
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
            :placeholder="t('local.searchPlaceholder')"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
          <n-tag round :bordered="false" type="success">
            <template #icon>
              <n-icon><SwapHorizontalOutline /></n-icon>
            </template>
            {{ t("local.currentLabel", { version: currentVersionLabel }) }}
          </n-tag>
        </div>
        <n-data-table
          v-model:checked-row-keys="checkedRowKeysRef"
          flex-height
          :columns="titleField"
          :data="pagedData"
          :loading="loading"
          :row-key="(row) => row.version"
          :scroll-x="tableScrollX"
          @update:checked-row-keys="handleCheck"
        />
        <div class="table-panel-pagination">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            show-size-picker
            :page-sizes="TABLE_PAGE_SIZES"
            :item-count="filteredData.length"
          />
        </div>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.local-page {
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

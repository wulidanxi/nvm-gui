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
import { useAvailableNodeReleases } from "@render/utils/useAvailableNodeReleases";
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

const pagination = {
  pageSize: 4,
  picker: true,
};

const tableScrollX = 940;

const summaryItems = computed(() => [
  {
    label: "推荐世代",
    value: String(releases.value.length),
  },
  {
    label: "已安装",
    value: String(releases.value.filter((item) => item.installed).length),
  },
  {
    label: "LTS",
    value: String(releases.value.filter((item) => item.lts !== false).length),
  },
]);

const availableColumns: DataTableColumns<NodeReleaseSummary> = [
  {
    title: "Node 版本",
    key: "version",
    minWidth: 140,
    render(row) {
      return h("div", { class: "version-cell", title: row.version }, [
        h("span", { class: "version-name" }, row.version),
        row.installed
          ? h(
              NTag,
              { size: "small", type: "success", round: true, bordered: false },
              { default: () => "已安装" },
            )
          : null,
      ]);
    },
  },
  {
    title: "世代",
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
    title: "LTS",
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
          default: () => (row.lts !== false ? row.lts : "非 LTS"),
        },
      );
    },
  },
  {
    title: "发布日期",
    key: "date",
    width: 130,
  },
  {
    title: "操作",
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
        { default: () => (!row.installed ? "安装" : "已安装") },
      );
    },
  },
];

async function installNode(row: NodeReleaseSummary) {
  try {
    await nvmOperations.install(row.version);
    window.$message.success(`Node.js ${row.version} 安装完成`);
    await initData();
  } catch (error: any) {
    window.$message.error(`安装失败：${error.message || "未知错误"}`);
  }
}

async function initData() {
  try {
    await refresh();
  } catch (error: any) {
    window.$message.error(
      `加载 Node.js 发行记录失败：${error.message || "未知错误"}`,
    );
  }
}

onBeforeMount(() => {
  initData();
});
</script>

<template>
  <div class="app-page available-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">Node 发行记录</div>
        <h1 class="page-title">可安装版本</h1>
        <div class="page-description">
          按主要世代展示最新版本，快速安装 LTS 或当前版本。
        </div>
      </div>
      <n-button :loading="loading" @click="initData">
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
        刷新
      </n-button>
    </div>

    <div class="page-scroll-body">
      <n-alert v-if="nvmMissing" type="warning" class="page-alert">
        未检测到 NVM 管理器，请先到设置中心的 NVM 管理器中安装。
      </n-alert>

      <section class="summary-grid">
        <n-card
          v-for="item in summaryItems"
          :key="item.label"
          class="panel-card summary-card"
          :bordered="false"
        >
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </n-card>
      </section>

      <div class="toolbar-card">
        <n-input
          v-model:value="keyword"
          clearable
          placeholder="搜索版本、世代或 LTS 代号"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-checkbox v-model:checked="ltsOnly">
          <n-icon><FilterOutline /></n-icon>
          仅看 LTS
        </n-checkbox>
      </div>

      <n-card class="panel-card table-card" :bordered="false">
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

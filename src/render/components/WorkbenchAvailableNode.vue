<script setup lang="ts">
import { computed, h, onBeforeMount, ref } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  CloudDownloadOutline,
  FilterOutline,
  RefreshOutline,
  SearchOutline,
} from "@vicons/ionicons5";
import dayjs from "dayjs";
import { nvmInstall, nvmList } from "@render/api";
import { getNodeReleaseRecord } from "@render/api/httpRequest";
import { markNodeEnvDirty } from "@render/utils/nodeEnvDirty";

interface AvailableNodeRow {
  version: string;
  class?: string;
  npm?: string;
  lts?: string | boolean;
  date?: string;
  installed?: boolean;
  loading?: boolean;
  installFlag?: boolean;
}

const availableData = ref<AvailableNodeRow[]>([]);
const tableLoading = ref(false);
const nvmMissing = ref(false);
const keyword = ref("");
const ltsOnly = ref(false);

const pagination = ref({
  pageSize: 4,
  picker: true,
});

const tableScrollX = 940;

const filteredData = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return availableData.value.filter((item) => {
    const matchesKeyword = !query
      || item.version.toLowerCase().includes(query)
      || String(item.class || "").toLowerCase().includes(query)
      || String(item.lts || "").toLowerCase().includes(query);
    const matchesLts = !ltsOnly.value || item.lts !== false;
    return matchesKeyword && matchesLts;
  });
});

const summaryItems = computed(() => [
  {
    label: "推荐世代",
    value: String(availableData.value.length),
  },
  {
    label: "已安装",
    value: String(availableData.value.filter((item) => item.installed).length),
  },
  {
    label: "LTS",
    value: String(availableData.value.filter((item) => item.lts !== false).length),
  },
]);

const availableColumns = (): DataTableColumns<AvailableNodeRow> => {
  return [
    {
      title: "Node 版本",
      key: "version",
      minWidth: 240,
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
      key: "class",
      width: 140,
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
      title: "发行日期",
      key: "date",
      width: 130,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      fixed: "right",
      render(row) {
        return h(
          NButton,
          {
            size: "small",
            type: row.installed ? "default" : "primary",
            secondary: true,
            disabled: row.installFlag ? true : row.installed,
            loading: row.loading || false,
            onClick: () => installNode(row),
          },
          { default: () => (!row.installed ? "安装" : "已安装") },
        );
      },
    },
  ];
};

const availableTitleField = ref(availableColumns());

async function installNode(row: AvailableNodeRow) {
  availableData.value = availableData.value.map((item) => ({
    ...item,
    loading: item === row,
    installFlag: item !== row,
  }));

  try {
    await nvmInstall(row.version.replace("v", ""));
    markNodeEnvDirty();
    window.$message.success(`Node.js ${row.version} 安装完成`);
    await initData();
  } catch (error: any) {
    window.$message.error(`安装失败: ${error.message || "未知错误"}`);
  } finally {
    availableData.value = availableData.value.map((item) => ({
      ...item,
      loading: false,
      installFlag: false,
    }));
  }
}

async function initData() {
  tableLoading.value = true;
  nvmMissing.value = false;
  try {
    const [releaseRecord, localVersions] = await Promise.all([
      getNodeReleaseRecord(),
      nvmList(),
    ]);
    const installedVersions = new Set(
      localVersions
        .split("\n")
        .map((line) => line.replace("*", "").split("(")[0].trim())
        .filter((line) => /^v?\d+\.\d+\.\d+$/.test(line))
        .map((line) => line.replace(/^v/, "")),
    );
    const groups: Record<string, AvailableNodeRow[]> = {};

    (releaseRecord as AvailableNodeRow[]).forEach((item) => {
      const version = item.version;
      item.installed = installedVersions.has(version.replace("v", ""));
      const classVersion = version.substring(0, version.indexOf("."));
      groups[classVersion] = groups[classVersion] || [];
      item.class = `Node.js ${classVersion.replace("v", "")}`;
      groups[classVersion].push(item);
    });

    const tempData: AvailableNodeRow[] = [];
    for (const key in groups) {
      const newGroups = groups[key].filter((item) => Object.keys(item).length > 0);
      newGroups.sort((a, b) => {
        const aDate = dayjs(a.date).valueOf();
        const bDate = dayjs(b.date).valueOf();
        return aDate > bDate ? -1 : 1;
      });
      tempData.push(newGroups[0]);
    }

    availableData.value = tempData;
  } catch (error: any) {
    nvmMissing.value = isNvmMissingError(error);
    window.$message.error(`加载 Node.js 发行记录失败: ${error.message || "未知错误"}`);
  } finally {
    tableLoading.value = false;
  }
}

function isNvmMissingError(error: any) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("nvm manager is not installed")
    || message.includes("not recognized")
    || message.includes("command not found");
}

onBeforeMount(() => {
  initData();
});
</script>

<template>
  <div class="app-page available-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">Node Releases</div>
        <h1 class="page-title">Node.js 发行记录</h1>
        <div class="page-description">
          按主要世代展示最新版本，快速安装 LTS 或当前版本。
        </div>
      </div>
      <n-button :loading="tableLoading" @click="initData">
        <template #icon>
          <n-icon><RefreshOutline /></n-icon>
        </template>
        刷新
      </n-button>
    </div>

    <div class="page-scroll-body">
      <n-alert v-if="nvmMissing" type="warning" class="page-alert">
      未检测到 NVM 管理器，请先到设置中心的 “NVM 管理器” 中安装。
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
        :columns="availableTitleField"
        :data="filteredData"
        :pagination="pagination"
        :loading="tableLoading"
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

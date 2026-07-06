<script lang="ts" setup>
import { computed, h, onActivated, onMounted, ref } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  RefreshOutline,
  SearchOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import type { InstalledNodeVersion } from "@common/types";
import { consumeNodeEnvDirty } from "@render/utils/nodeEnvDirty";
import { useInstalledNodeVersions } from "@render/utils/useInstalledNodeVersions";
import { useNvmOperations } from "@render/utils/useNvmOperations";

const { versions, loading, nvmMissing, currentVersion, refresh } =
  useInstalledNodeVersions();
const nvmOperations = useNvmOperations();

const keyword = ref("");
const checkedRowKeysRef = ref<string[]>([]);

const pagination = {
  pageSize: 4,
  picker: true,
};

const tableScrollX = 760;

const currentVersionLabel = computed(() => currentVersion.value || "未激活");

const filteredData = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return versions.value;

  return versions.value.filter((item) =>
    item.version.toLowerCase().includes(query),
  );
});

const summaryItems = computed(() => [
  {
    label: "已安装版本",
    value: String(versions.value.length),
  },
  {
    label: "当前激活",
    value: currentVersionLabel.value,
  },
  {
    label: "可清理版本",
    value: String(versions.value.filter((item) => !item.active).length),
  },
]);

const titleField: DataTableColumns<InstalledNodeVersion> = [
  {
    type: "selection",
    multiple: false,
    width: 56,
  },
  {
    title: "Node 版本",
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
              { default: () => "当前" },
            )
          : null,
      ]);
    },
  },
  {
    title: "状态",
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
          default: () => (row.active ? "当前环境" : "可切换"),
        },
      );
    },
  },
  {
    title: "操作",
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
        { default: () => (row.active ? "使用中" : "卸载") },
      );
    },
  },
];

onMounted(() => {
  detail();
});

onActivated(() => {
  if (consumeNodeEnvDirty()) detail();
});

async function uninstallNode(row: InstalledNodeVersion) {
  try {
    await nvmOperations.uninstall(row.version);
    window.$message.success(`成功卸载 Node.js ${row.version}`);
    await detail();
  } catch (error: any) {
    window.$message.error(`卸载失败：${error.message || "未知错误"}`);
  }
}

async function detail(showSuccess = false) {
  try {
    await refresh();
    checkedRowKeysRef.value = versions.value
      .filter((item) => item.active)
      .map((item) => item.version);

    if (showSuccess) window.$message.success("刷新成功");
  } catch (error: any) {
    window.$message.error(
      `获取 Node.js 列表失败：${error.message || "未知错误"}`,
    );
    console.error(error);
  }
}

async function handleCheck(rowKeys: string[]) {
  const targetVersion = Array.isArray(rowKeys) ? rowKeys[0] : rowKeys;
  if (!targetVersion) return;

  try {
    await nvmOperations.use(String(targetVersion));
    window.$message.success(`已切换到 Node.js ${targetVersion}`);
    await detail();
  } catch (error: any) {
    window.$message.error(`切换失败：${error.message || "未知错误"}`);
    await detail();
  }
}
</script>

<template>
  <div class="app-page local-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">本地运行时</div>
        <h1 class="page-title">本地 Node 环境</h1>
        <div class="page-description">
          管理已安装的 Node.js 版本，选择行即可切换当前运行时。
        </div>
      </div>
      <n-button :loading="loading" @click="detail(true)">
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
          placeholder="搜索版本号，例如 22 或 20.11"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        <n-tag round :bordered="false" type="success">
          <template #icon>
            <n-icon><SwapHorizontalOutline /></n-icon>
          </template>
          当前 {{ currentVersionLabel }}
        </n-tag>
      </div>

      <n-card class="panel-card table-card" :bordered="false">
        <n-data-table
          v-model:checked-row-keys="checkedRowKeysRef"
          :bordered="false"
          :single-line="false"
          :columns="titleField"
          :data="filteredData"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row) => row.version"
          :scroll-x="tableScrollX"
          @update:checked-row-keys="handleCheck"
        />
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

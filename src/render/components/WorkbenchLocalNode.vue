<script lang="ts" setup>
import { computed, h, onActivated, onMounted, ref } from "vue";
import type { DataTableColumns } from "naive-ui";
import { NButton, NTag } from "naive-ui";
import {
  RefreshOutline,
  SearchOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import dayjs from "dayjs";
import { nvmList, nvmUninstall, nvmUse } from "@render/api";
import { parseNvmList } from "@render/utils/nvmParser";
import {
  consumeNodeEnvDirty,
  markNodeEnvDirty,
} from "@render/utils/nodeEnvDirty";

interface RowData {
  key: number;
  value: string;
  isCurrent: boolean;
  loading?: boolean;
  uninstallFlag?: boolean;
}

const loading = ref(false);
const nvmMissing = ref(false);
const data = ref<RowData[]>([]);
const keyword = ref("");
const checkedRowKeysRef = ref<(string | number)[]>([]);

const pagination = ref({
  pageSize: 4,
  picker: true,
});

const tableScrollX = 760;

const currentVersion = computed(() => {
  return data.value.find((item) => item.isCurrent)?.value || "未激活";
});

const filteredData = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return data.value;
  return data.value.filter((item) => item.value.toLowerCase().includes(query));
});

const summaryItems = computed(() => [
  {
    label: "已安装版本",
    value: String(data.value.length),
  },
  {
    label: "当前激活",
    value: currentVersion.value,
  },
  {
    label: "可清理版本",
    value: String(data.value.filter((item) => !item.isCurrent).length),
  },
]);

function createColumns(): DataTableColumns<RowData> {
  return [
    {
      type: "selection",
      multiple: false,
      width: 56,
    },
    {
      title: "Node 版本",
      key: "value",
      minWidth: 320,
      render(row) {
        return h("div", { class: "version-cell", title: row.value }, [
          h("span", { class: "version-name" }, row.value),
          row.isCurrent
            ? h(
                NTag,
                {
                  size: "small",
                  type: "success",
                  round: true,
                  bordered: false,
                },
                { default: () => "Active" },
              )
            : null,
        ]);
      },
    },
    {
      title: "状态",
      key: "isCurrent",
      width: 150,
      render(row) {
        return h(
          NTag,
          {
            type: row.isCurrent ? "success" : "default",
            round: true,
            bordered: false,
          },
          {
            default: () => (row.isCurrent ? "当前环境" : "可切换"),
          },
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      render(row) {
        return h(
          NButton,
          {
            size: "small",
            type: row.isCurrent ? "default" : "error",
            secondary: true,
            disabled: row.uninstallFlag ? true : row.isCurrent,
            loading: row.loading || false,
            onClick: () => uninstallNode(row),
          },
          { default: () => (row.isCurrent ? "使用中" : "卸载") },
        );
      },
    },
  ];
}

const titleField = ref(createColumns());

onMounted(() => {
  detail("fnc");
});

onActivated(() => {
  if (consumeNodeEnvDirty()) {
    detail("fnc");
  }
});

async function uninstallNode(row: RowData) {
  data.value = data.value.map((item) => {
    if (item.key === row.key) {
      return { ...item, loading: true };
    }
    return { ...item, uninstallFlag: true };
  });

  try {
    await nvmUninstall(row.value);
    markNodeEnvDirty();
    window.$message.success(`成功卸载 Node.js ${row.value}`);
    await detail("fun");
  } catch (error: any) {
    window.$message.error(`卸载失败: ${error.message || "未知错误"}`);
  } finally {
    data.value = data.value.map((item) => ({
      ...item,
      loading: false,
      uninstallFlag: false,
    }));
  }
}

async function detail(action: string) {
  loading.value = true;
  nvmMissing.value = false;
  try {
    const result = await nvmList();
    const parsedVersions = parseNvmList(result);
    const newRowKeys: number[] = [];

    data.value = parsedVersions.map((v, index) => {
      if (v.isCurrent) {
        newRowKeys.push(index);
      }
      return {
        key: index,
        value: v.version,
        isCurrent: v.isCurrent,
        loading: false,
        uninstallFlag: false,
      };
    });

    checkedRowKeysRef.value = newRowKeys;

    if (action === "btn") {
      window.$message.success(`刷新成功: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`);
    }
  } catch (error: any) {
    nvmMissing.value = isNvmMissingError(error);
    window.$message.error(`获取 Node.js 列表失败: ${error.message || "未知错误"}`);
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function isNvmMissingError(error: any) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("nvm manager is not installed")
    || message.includes("not recognized")
    || message.includes("command not found");
}

async function changeVersion(version: string) {
  await nvmUse(version);
}

async function handleCheck(rowKeys: (string | number)[]) {
  const key = Array.isArray(rowKeys) ? rowKeys[0] : rowKeys;
  const normalizedKey = Number(key);
  const targetRow = data.value.find((item) => item.key === normalizedKey);
  if (!targetRow) return;

  try {
    await changeVersion(targetRow.value);
    markNodeEnvDirty();
    window.$message.success(`已切换到 Node.js ${targetRow.value}`);
    await detail("Function");
  } catch (error: any) {
    window.$message.error(`切换失败: ${error.message || "未知错误"}`);
    await detail("Function");
  }
}
</script>

<template>
  <div class="app-page local-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">Local Runtime</div>
        <h1 class="page-title">本地 Node 环境</h1>
        <div class="page-description">
          管理已安装的 Node.js 版本，选择行即可切换当前运行时。
        </div>
      </div>
      <n-button :loading="loading" @click="detail('btn')">
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
        当前 {{ currentVersion }}
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
        :row-key="(row) => row.key"
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

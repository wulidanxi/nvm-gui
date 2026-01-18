<template>
  <div class="migration-helper">
    <n-card title="全局包迁移助手" size="small">
      <template #header-extra>
        <n-button
          size="small"
          secondary
          type="info"
          @click="refreshPackages"
          :loading="loading"
        >
          <template #icon
            ><n-icon><RefreshOutline /></n-icon
          ></template>
          刷新
        </n-button>
      </template>

      <n-alert type="info" class="mb-2" :show-icon="true">
        此列表显示当前 Node
        版本下安装的全局包。勾选需要迁移的包，然后点击“重新安装”将其安装到当前环境（通常用于切换
        Node 版本后快速恢复环境）。
      </n-alert>

      <n-data-table
        :columns="columns"
        :data="packages"
        :loading="loading"
        :row-key="(row) => row.name"
        @update:checked-row-keys="handleCheck"
      />

      <n-flex justify="end" class="mt-4">
        <n-button
          type="primary"
          :disabled="checkedRowKeys.length === 0"
          :loading="installing"
          @click="migratePackages"
        >
          安装选中的包 ({{ checkedRowKeys.length }})
        </n-button>
      </n-flex>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import {
  NCard,
  NButton,
  NIcon,
  NDataTable,
  NAlert,
  NFlex,
  NTag,
  useMessage,
} from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { RefreshOutline } from "@vicons/ionicons5";
import { listGlobalPackages, installGlobalPackage } from "@render/api";

interface PackageInfo {
  name: string;
  version: string;
}

const message = useMessage();
const loading = ref(false);
const installing = ref(false);
const packages = ref<PackageInfo[]>([]);
const checkedRowKeys = ref<string[]>([]);

const columns: DataTableColumns<PackageInfo> = [
  { type: "selection" },
  { title: "包名", key: "name" },
  {
    title: "版本",
    key: "version",
    render(row: PackageInfo) {
      return h(
        NTag,
        { size: "small", bordered: false },
        { default: () => row.version },
      );
    },
  },
];

onMounted(() => {
  refreshPackages();
});

const refreshPackages = async () => {
  loading.value = true;
  try {
    const result = await listGlobalPackages();
    // Handle empty or error response gracefully
    if (!result) {
      packages.value = [];
      return;
    }

    let json;
    try {
      json = JSON.parse(result);
    } catch (e) {
      console.error("JSON parse error:", e);
      packages.value = [];
      return;
    }

    // Parse `npm list -g --json` output
    if (json && json.dependencies) {
      packages.value = Object.entries(json.dependencies).map(
        ([name, info]: [string, any]) => ({
          name,
          version: info.version || "unknown",
        }),
      );
    } else {
      packages.value = [];
    }
  } catch (error) {
    message.error("获取全局包列表失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleCheck = (rowKeys: string[]) => {
  checkedRowKeys.value = rowKeys;
};

const migratePackages = async () => {
  if (checkedRowKeys.value.length === 0) return;

  installing.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const pkgName of checkedRowKeys.value) {
    try {
      await installGlobalPackage(pkgName);
      successCount++;
    } catch (error) {
      console.error(`Failed to install ${pkgName}`, error);
      failCount++;
    }
  }

  installing.value = false;
  if (failCount === 0) {
    message.success(`成功安装 ${successCount} 个包`);
  } else {
    message.warning(`安装完成: ${successCount} 成功, ${failCount} 失败`);
  }
  await refreshPackages();
  checkedRowKeys.value = [];
};
</script>

<style scoped>
.mb-2 {
  margin-bottom: 8px;
}
.mt-4 {
  margin-top: 16px;
}
</style>

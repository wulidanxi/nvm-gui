<template>
  <div class="migration-helper">
    <n-card :title="t('migration.title')" size="small">
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
          {{ t("common.refresh") }}
        </n-button>
      </template>

      <n-alert type="info" class="mb-2" :show-icon="true">
        {{ t("migration.description") }}
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
          {{ t("migration.installSelected", { count: checkedRowKeys.length }) }}
        </n-button>
      </n-flex>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, h } from "vue";
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
import { useI18n } from "@render/i18n";

interface PackageInfo {
  name: string;
  version: string;
}

const message = useMessage();
const { t } = useI18n();
const loading = ref(false);
const installing = ref(false);
const packages = ref<PackageInfo[]>([]);
const checkedRowKeys = ref<(string | number)[]>([]);

const columns = computed<DataTableColumns<PackageInfo>>(() => [
  { type: "selection" },
  { title: t("migration.packageName"), key: "name" },
  {
    title: t("migration.version"),
    key: "version",
    render(row: PackageInfo) {
      return h(
        NTag,
        { size: "small", bordered: false },
        { default: () => row.version },
      );
    },
  },
]);

onMounted(() => {
  refreshPackages();
});

const refreshPackages = async () => {
  loading.value = true;
  try {
    const result = await listGlobalPackages();
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

    // npm returns global packages as a dependency map keyed by package name.
    if (json && json.dependencies) {
      packages.value = Object.entries(json.dependencies).map(
        ([name, info]: [string, any]) => ({
          name,
          version: info.version || t("migration.unknownVersion"),
        }),
      );
    } else {
      packages.value = [];
    }
  } catch (error) {
    message.error(t("migration.fetchFailed"));
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleCheck = (rowKeys: (string | number)[]) => {
  checkedRowKeys.value = rowKeys;
};

const migratePackages = async () => {
  if (checkedRowKeys.value.length === 0) return;

  installing.value = true;
  let successCount = 0;
  let failCount = 0;

  for (const pkgName of checkedRowKeys.value) {
    try {
      await installGlobalPackage(String(pkgName));
      successCount++;
    } catch (error) {
      console.error(`Failed to install ${pkgName}`, error);
      failCount++;
    }
  }

  installing.value = false;
  if (failCount === 0) {
    message.success(t("migration.installSuccess", { count: successCount }));
  } else {
    message.warning(t("migration.installPartial", { success: successCount, failed: failCount }));
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

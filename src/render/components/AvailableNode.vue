<script setup lang="ts">
import { onMounted, ref, onBeforeMount, h } from "vue";

import { nvmInstall, nvmList } from "@render/api";
import {
  NTag,
  NButton,
  NLayout,
  NLayoutHeader,
  NFlex,
  NDataTable,
  NAlert,
  DataTableColumns,
} from "naive-ui";
import dayjs from "dayjs";

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

const pagination = ref({
  pageSize: 10,
  picker: true,
});

const tableLoading = ref(false);
const nvmMissing = ref(false);

const availableColumns = (): DataTableColumns<any> => {
  return [
    {
      title: "Node版本",
      key: "version",
    },
    {
      title: "世代",
      key: "class",
    },
    {
      title: "npm版本",
      key: "npm",
    },
    {
      title: "是否LTS(代号)",
      key: "lts",
      render(row) {
        if (row.lts !== false) {
          return h(
            NTag,
            {
              style: {
                marginRight: "6px",
              },
              type: "success",
              bordered: false,
            },
            {
              default: () => row.lts,
            },
          );
        } else {
          return h(
            NTag,
            {
              style: {
                marginRight: "6px",
              },
              type: "error",
              bordered: false,
            },
            {
              default: () => "否",
            },
          );
        }
      },
    },
    {
      title: "发行日期",
      key: "date",
    },
    {
      title: "操作",
      key: "action",
      render(row) {
        return h(
          NButton,
          {
            size: "small",
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

const installNode = async (row: AvailableNodeRow) => {
  availableData.value = availableData.value.map((item) => ({
    ...item,
    loading: item === row,
    installFlag: item !== row,
  }));

  try {
    await nvmInstall(row.version.replace("v", ""));
    markNodeEnvDirty();
    window.$message.success(`Node.js ${row.version} installed`);
    await initData();
  } catch (error: any) {
    window.$message.error(`Install failed: ${error.message || "Unknown error"}`);
  } finally {
    availableData.value = availableData.value.map((item) => ({
      ...item,
      loading: false,
      installFlag: false,
    }));
  }
};

const availableTitleField = ref(availableColumns());
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
      item.class = "Node.js " + classVersion.replace("v", "");
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
    window.$message.error(`Failed to load Node.js releases: ${error.message || "Unknown error"}`);
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

onMounted(() => {
  // getAvailableNode();
});
</script>

<template>
  <div style="height: 100%; position: relative">
    <n-layout position="absolute">
      <n-layout-header style="height: 64px; padding: 24px" bordered>
        Node.js 发行记录
      </n-layout-header>
      <n-layout content-style="padding: 24px;">
        <n-alert v-if="nvmMissing" type="warning" style="margin-bottom: 16px">
          未检测到 NVM 管理器，请先到设置页的 “NVM 管理器” 中安装。
        </n-alert>
        <n-flex justify="center">
          <n-data-table
            :bordered="true"
            :single-line="false"
            :columns="availableTitleField"
            :data="availableData"
            :pagination="pagination"
            :max-height="400"
            :loading="tableLoading"
          />
        </n-flex>
      </n-layout>
    </n-layout>
  </div>
</template>

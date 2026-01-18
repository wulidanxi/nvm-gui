<template>
  <div style="height: 100%; position: relative">
    <n-layout position="absolute">
      <n-layout-header style="height: 64px; padding: 24px" bordered>
        本机 Node.js 环境
      </n-layout-header>
      <n-layout content-style="padding: 24px;">
        <n-flex size="large">
          <!--          <n-flex vertical>-->
          <!--            <n-button-->
          <!--              :loading="loading"-->
          <!--              tertiary-->
          <!--              type="primary"-->
          <!--              round-->
          <!--              @click="detail('btn')"-->
          <!--            >-->
          <!--              <template #icon>-->
          <!--                <n-icon>-->
          <!--                  <SearchOutline />-->
          <!--                </n-icon>-->
          <!--              </template>-->
          <!--              查询当前环境-->
          <!--            </n-button>-->
          <!--          </n-flex>-->

          <n-data-table
            v-model:checked-row-keys="checkedRowKeysRef"
            :bordered="true"
            :single-line="false"
            :columns="titleField"
            :data="data"
            :max-height="400"
            :loading="loading"
            :pagination="pagination"
            @update:checked-row-keys="handleCheck"
          />
        </n-flex>
      </n-layout>
    </n-layout>
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, ref } from "vue";
import { DataTableColumns } from "naive-ui";
import {
  NTag,
  NButton,
  NLayout,
  NLayoutHeader,
  NDataTable,
  NFlex,
  NIcon,
} from "naive-ui";
import { executeNvmSafely, nvmList, nvmUse, nvmUninstall } from "@render/api";
import { parseNvmList } from "@render/utils/nvmParser";
import { SearchOutline as SearchOutline } from "@vicons/ionicons5";
import dayjs from "dayjs";

interface RowData {
  key: number;
  value: string;
  isCurrent: boolean;
  loading?: boolean;
  uninstallFlag?: boolean;
}

const loading = ref(false);

// 设置表格值
const data = ref<RowData[]>([]);
const pagination = ref({
  pageSize: 10,
  picker: true,
});

const checkedRowKeysRef = ref<number[]>([]);

onMounted(() => {
  detail("fnc");
});

// 设定列
function createColumns(): DataTableColumns<RowData> {
  return [
    {
      type: "selection",
      multiple: false,
    },
    {
      title: "node版本",
      key: "value",
    },
    {
      title: "当前激活",
      key: "isCurrent",
      render(row) {
        if (row.isCurrent === true) {
          return h(
            NTag,
            {
              style: {
                marginRight: "6px",
              },
              type: "success",
              round: true,
              bordered: true,
            },
            {
              default: () => "激活",
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
              round: true,
              bordered: true,
            },
            {
              default: () => "未激活",
            },
          );
        }
      },
    },
    {
      title: "操作",
      key: "action",
      render(row) {
        return h(
          NButton,
          {
            size: "small",
            disabled: row.uninstallFlag ? true : row.isCurrent,
            loading: row.loading || false,
            onClick: () => uninstallNode(row),
          },
          { default: () => "卸载" },
        );
      },
    },
  ];
}

const uninstallNode = async (row: RowData) => {
  // 设置 loading 状态
  data.value = data.value.map((item) => {
    if (item.key === row.key) {
      return { ...item, loading: true };
    }
    return { ...item, uninstallFlag: true }; // 禁用其他按钮
  });

  try {
    await nvmUninstall(row.value);
    window.$message.success(`成功卸载 Node.js ${row.value}`);
    await detail("fun");
  } catch (error: any) {
    window.$message.error(`卸载失败: ${error.message || "未知错误"}`);
  } finally {
    // 恢复状态
    data.value = data.value.map((item) => ({
      ...item,
      loading: false,
      uninstallFlag: false,
    }));
  }
};

const titleField = ref(createColumns());

// 获取当前node版本信息
async function detail(action: string) {
  loading.value = true;
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
      const message = window.$message;
      message.success("查询成功:" + dayjs().format("YYYY-MM-DD HH:mm:ss"));
    }
  } catch (error: any) {
    window.$message.error(
      `获取 Node.js 列表失败: ${error.message || "未知错误"}`,
    );
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 切换node版本
async function changVersion(version: string) {
  await nvmUse(version);
}

// 表格行选中逻辑
async function handleCheck(rowKeys: number[]) {
  // 注意：单选模式下 rowKeys 应该是一个包含单个 key 的数组，或者直接是 key（取决于 Naive UI 版本和配置）
  // 这里假设是数组
  const key = Array.isArray(rowKeys) ? rowKeys[0] : rowKeys;

  // 找到对应的行数据
  const targetRow = data.value.find((item) => item.key === key);

  if (!targetRow) return;

  const nodeVersion = targetRow.value;
  const message = window.$message;

  try {
    await changVersion(nodeVersion);
    message.success(`切换node版本==>${nodeVersion}`);
    await detail("Function");
  } catch (error: any) {
    message.error(`切换失败: ${error.message || "未知错误"}`);
    // 刷新列表以恢复正确状态
    await detail("Function");
  }
}
</script>

<style lang="scss" scoped></style>

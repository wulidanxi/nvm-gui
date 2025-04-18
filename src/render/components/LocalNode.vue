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
            :pagination="pagination"
            @update:checked-row-keys="handleCheck"
          />
        </n-flex>
      </n-layout>
    </n-layout>
  </div>
</template>

<script lang="ts" setup>
import {h, onMounted, ref} from "vue";
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
import { executeCmd } from "@render/api";
import { SearchOutline as SearchOutline } from "@vicons/ionicons5";
import moment from "moment";

interface RowData {
  key: number;
  value: string;
  isCurrent: boolean;
}

const loading = ref(false);

// 设置表格值
const data = ref([]);
const pagination = ref({
  pageSize: 10,
  picker: true,
});

const checkedRowKeysRef = ref([]);

onMounted(() => {
  detail("fnc");
})

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
            }
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
            }
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
          { default: () => "卸载" }
        );
      },
    },
  ];
}

const uninstallNode = async (row: any) => {
  data.value.map((item, index) => {
    if (item === row) {
      data.value[index].loading = true;
    } else {
      data.value[index].uninstallFlag = true;
      data.value[index].loading = false;
    }
  });
  var uninstallCmd = `nvm uninstall ${row.value}`;
  await executeCmd(uninstallCmd);
  await detail("fun");
  data.value.map((item, index) => {
    if (item === row) {
      data.value[index].loading = false;
    }
    data.value[index].uninstallFlag = false;
  });
};

const titleField = ref(createColumns());
// 获取当前node版本信息
async function detail(action: string) {
  if (action === "btn") {
    loading.value = true;
  }
  const result = await executeCmd("nvm ls");
  const newVar = result.split("\n").filter((item) => {
    if (item.length > 0) return item;

    return null;
  });
  data.value = newVar.map((value, index) => {
    let isCurrent = false;
    let newValue;

    if (value.includes("*")) {
      checkedRowKeysRef.value = [index, 1];
      isCurrent = true;
      newValue = value
        .substring(value.indexOf("*") + 1, value.indexOf("("))
        .trim();
    } else {
      newValue = value.trim();
    }
    const ob = {
      key: index,
      value: newValue,
      isCurrent,
    };
    return ob;
  });
  if (action === "btn") {
    const message = window.$message;
    loading.value = false;
    message.success("查询成功:" + moment().format("YYYY-MM-DD HH:mm:ss"));
  }
  return result;
}
// 切换node版本
async function changVersion(version: string) {
  const commandStr = `nvm use ${version}`;
  await executeCmd(commandStr);
}
// 表格行选中逻辑
async function handleCheck(rowKeys) {
  const message = window.$message;
  const nodeVersion = data.value[rowKeys].value;
  await changVersion(nodeVersion);
  await detail("Function");
  message.success(`切换node版本==>${nodeVersion}`);
}
</script>

<style lang="scss" scoped></style>

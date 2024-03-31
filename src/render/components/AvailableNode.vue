<script setup lang="ts">
import { onMounted, ref, onBeforeMount, h } from "vue";

import { executeCmd } from "@render/api";
import {
  NTag,
  NButton,
  NLayout,
  NLayoutHeader,
  NFlex,
  NDataTable,
  DataTableColumns,
} from "naive-ui";
import moment from "moment";

import { getNodeReleaseRecord } from "@render/api/httpRequest";

const availableData = ref([]);

const pagination = ref({
  pageSize: 10,
  picker: true,
});

const installFlag = ref(false);

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
              bordered: false,
            },
            {
              default: () => "否",
            }
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
          { default: () => (!row.installed ? "安装" : "已安装") }
        );
      },
    },
  ];
};

const installNode = async (row: any) => {
  availableData.value.map((item, index) => {
    if (item === row) {
      availableData.value[index].loading = true;
    } else {
      availableData.value[index].installFlag = true;
      availableData.value[index].loading = false;
    }
  });
  var installCmd = `nvm install ${row.version.replace("v", "")}`;
  await executeCmd(installCmd);
  await initData();
  installFlag.value = false;
  availableData.value.map((item, index) => {
    if (item === row) {
      availableData.value[index].loading = false;
    }
    availableData.value[index].installFlag = false;
  });
};

const availableTitleField = ref(availableColumns());
// https://nodejs.org/dist/index.json
// async function getAvailableNode() {
//   const commandStr = "nvm list available";
//   const availableVer = await executeCmd(commandStr);
//   const arrayTemp = availableVer.split("\n").filter((item) => {
//     return item.length > 0 && item.indexOf("| ") !== -1 ? item : undefined;
//   });
//   arrayTemp.map((item, index) => {
//     if (index > 0) {
//       var itemArray = item
//         .split("|")
//         .map((item) => item.trim())
//         .filter((item) => item.length > 0);
//       const ob = {
//         current: undefined,
//         lts: undefined,
//         oldStable: undefined,
//         oldUnstable: undefined,
//       };
//       itemArray.map((value, i) => {
//         switch (i) {
//           case 0:
//             ob.current = value;
//             break;
//           case 1:
//             ob.lts = value;
//             break;
//           case 2:
//             ob.oldStable = value;
//             break;
//           case 3:
//             ob.oldUnstable = value;
//             break;
//           default:
//             break;
//         }
//       });
//       availableData.value[index] = ob;
//     }
//   });
// }

async function initData() {
  getNodeReleaseRecord().then((res) => {
    let data: Array<{}> = res;
    const groups: { [key: string]: [{}] } = {};
    const result = executeCmd("nvm ls");
    result.then((i) => {
      data.forEach((item: any) => {
        const version = item.version;
        if (i.indexOf(version.replace("v", "")) >= 0) {
          item.installed = true;
        } else {
          item.installed = false;
        }
        var classVersion: string = version.substring(0, version.indexOf("."));
        groups[classVersion] = groups[classVersion] || [{}];
        item.class = "Node.js " + classVersion.replace("v", "");
        groups[classVersion].push(item);
      });
      let tempData = [];
      for (const key in groups) {
        let newGroups = groups[key].filter((item) => {
          return Object.keys(item).length > 0;
        });
        newGroups.sort((a: any, b: any) => {
          var aDate = moment(a.date).toDate;
          var bDate = moment(b.date).toDate;
          return aDate > bDate ? -1 : 1;
        });
        tempData.push(newGroups[0]);
      }

      availableData.value = tempData;
    });
  });
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
        <n-flex justify="center">
          <n-data-table
            :bordered="true"
            :single-line="false"
            :columns="availableTitleField"
            :data="availableData"
            :pagination="pagination"
            :max-height="400"
          />
        </n-flex>
      </n-layout>
    </n-layout>
  </div>
</template>

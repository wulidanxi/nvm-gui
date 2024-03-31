<script setup lang="ts">
import useMessageComponents from "./useMessageComponents.vue";
import {
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NLayoutFooter,
  NMessageProvider,
} from "naive-ui";
import { h, ref, Component, onMounted } from "vue";
import {
  LogoNodejs as NodeIcon,
  LogoElectron as ElectronIcon,
  SettingsOutline as SettingIcon,
} from "@vicons/ionicons5";
import { useRouter } from "vue-router";
import { executeCmd } from "@render/api";

const inverted = ref(false);

// @ts-ignore
const version = __Admin_VERSION__ as string;

const nvmVersion = ref("");

const router = useRouter();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions = [
  {
    label: "Dashboard",
    key: "",
    icon: renderIcon(ElectronIcon),
  },
  {
    label: "本机Node环境",
    key: "local",
    icon: renderIcon(NodeIcon),
  },
  {
    label: "Node发行记录",
    key: "available",
    icon: renderIcon(NodeIcon),
  },
];

// const selectedKey = ref(["localNodeEnv"]);

const handleUpdateValue = (key: string) => {
  router.push(`/${key}`);
};

async function getNvmVersion() {
  const commandStr = "nvm -v";
  const ver = await executeCmd(commandStr);
  nvmVersion.value = ver;
}

onMounted(() => {
  getNvmVersion();
});
</script>

<template>
  <n-layout>
    <n-layout-header style="height: 5vh" bordered>
      <!-- <div>NVM GUI</div> -->
      <n-icon
        size="20"
        color="#18a058"
        style="padding-left: 1vh; padding-top: 1vh"
      >
        <!-- <NodeIcon /> -->
        <img
          style="max-width: 80px; max-height: 80px"
          src="../assets/nodejsDark.svg"
        />
      </n-icon>

      <n-icon
        size="20"
        color="#18a058"
        style="padding-right: 5vh; padding-top: 1vh; float: right"
      >
        <SettingIcon />
      </n-icon>
    </n-layout-header>
    <n-layout has-sider>
      <n-layout-sider
        bordered
        show-trigger
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :native-scrollbar="false"
        :inverted="inverted"
        style="height: 90vh"
      >
        <n-menu
          :inverted="inverted"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          default-value=""
          @update:value="handleUpdateValue"
        />
      </n-layout-sider>
      <n-layout style="height: 90vh">
        <RouterView />
      </n-layout>
    </n-layout>
    <n-layout-footer :inverted="inverted" bordered style="height: 5vh">
      <div>软件版本:{{ version }} nvm 版本:{{ nvmVersion }}</div>
    </n-layout-footer>
  </n-layout>
  <n-message-provider>
    <useMessageComponents />
  </n-message-provider>
</template>

<style>
.n-layout-footer {
  background-color: #18a058;
  padding: 1vh;
}
</style>

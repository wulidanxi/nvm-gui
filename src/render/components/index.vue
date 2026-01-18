<script setup lang="ts">
import useMessageComponents from "./useMessageComponents.vue";
import {
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NDropdown,
  NMenu,
  NMessageProvider,
  NDialogProvider,
  NModal,
  NSpace,
  NText,
  NDivider,
  NAvatar,
  NConfigProvider,
  darkTheme,
  NImage,
} from "naive-ui";
import type { GlobalTheme } from "naive-ui";
import { h, ref, onMounted, computed, type Component } from "vue";
import {
  LogoNodejs as NodeIcon,
  LogoElectron as ElectronIcon,
  SettingsOutline as SettingIcon,
} from "@vicons/ionicons5";
import { useRouter } from "vue-router";
import { executeCmd, openUrl } from "@render/api";
import logoIconBlack from "@render/assets/nvm-logo-color-avatar.png";
import logoIconWhite from "@render/assets/nvm-logo-white.svg";
import config from "../../../package.json";
import { useThemeStore } from "@render/stores/ThemeStore";
import nodeIconBlack from "@render/assets/nodejsDark.svg";
import nodeIconWhite from "@render/assets/nodejsWhite.svg";

const inverted = ref(false);
const showModal = ref(false);

const version = config.version;

const nvmVersion = ref("");

const router = useRouter();

const store = useThemeStore();
//const globalTheme = ref<GlobalTheme| null>(null);
const globalTheme = computed(() => {
  if (store.theme === "dark") {
    logoIcon.value = logoIconWhite;
    nodeIcon.value = nodeIconWhite;
    return darkTheme;
  } else {
    logoIcon.value = logoIconBlack;
    nodeIcon.value = nodeIconBlack;
    return null;
  }
});

const logoIcon = ref(logoIconBlack);
const nodeIcon = ref(nodeIconBlack);

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const setOptions = [
  {
    label: "关于",
    key: "about",
  },
];

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
  {
    label: "设置", // 新增设置页面入口
    key: "setting",
    icon: renderIcon(SettingIcon),
  },
];

const handleUpdateValue = (key: string) => {
  router.push(`/${key}`);
};

const onOpenSource = () => {
  openUrl("https://github.com/wulidanxi/nvm-gui");
};

const onOpenPlugin = () => {
  openUrl("https://github.com/coreybutler/nvm-windows");
};

const onOpenOffice = () => {
  const message = window.$message;
  message.info("等待开发");
};

async function getNvmVersion() {
  const commandStr = "nvm -v";
  const ver = await executeCmd(commandStr);
  nvmVersion.value = ver;
}

const dropDownMenuClick = (key) => {
  if (key === "about") {
    showModal.value = true;
  }
};

onMounted(() => {
  getNvmVersion();
});
</script>

<template>
  <n-config-provider :theme="globalTheme">
    <n-layout>
      <n-layout-header style="height: 5vh" bordered>
        <!-- <div>NVM GUI</div> -->
        <n-icon
          size="20"
          color="#18a058"
          style="padding-left: 1vh; padding-top: 1vh"
        >
          <!--        <n-image :src="nodeIcon"></n-image>-->
          <!-- <NodeIcon /> -->
          <n-image :object-fit="'cover'" :height="'20px'" :src="nodeIcon" />
        </n-icon>

        <n-dropdown
          trigger="click"
          placement="left"
          :options="setOptions"
          :show-arrow="true"
          @select="dropDownMenuClick"
        >
          <n-icon
            size="20"
            style="padding-right: 5vh; padding-top: 1vh; float: right"
          >
            <SettingIcon />
          </n-icon>
        </n-dropdown>
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
          style="height: 95vh"
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
        <n-layout style="height: 95vh">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </n-layout>
      </n-layout>
    </n-layout>
    <n-message-provider>
      <n-dialog-provider>
        <useMessageComponents />
      </n-dialog-provider>
    </n-message-provider>
    <n-modal
      v-model:show="showModal"
      :show-icon="false"
      preset="dialog"
      transform-origin="center"
    >
      <n-space
        :size="10"
        :wrap="false"
        :wrap-item="false"
        align="center"
        vertical
      >
        <n-avatar :size="120" :src="logoIcon" color="#0000"></n-avatar>
        <div class="about-app-title">Node Version Manager GUI</div>
        <n-space
          :size="5"
          :wrap="false"
          :wrap-item="false"
          justify="space-between"
        >
          <n-text>插件版本:</n-text>
          <n-text class="about-link" @click="onOpenPlugin()"
            >{{ nvmVersion }}
          </n-text>
        </n-space>
        <n-space
          :size="5"
          :wrap="false"
          :wrap-item="false"
          justify="space-between"
        >
          <n-text>软件版本:</n-text>
          <n-text>{{ version }}</n-text>
        </n-space>
        <n-space :size="5" :wrap="false" :wrap-item="false" justify="center">
          <n-text class="about-link" @click="onOpenSource()">源码地址</n-text>
          <n-divider vertical />
          <n-text class="about-link" @click="onOpenOffice()">官方网站</n-text>
        </n-space>
        <div class="about-copyright">
          Copyright © 2025 Wulidanxi All rights reserved
        </div>
      </n-space>
    </n-modal>
  </n-config-provider>
</template>

<style>
.n-layout-footer {
  background-color: #18a058;
  padding: 1vh;
}

.about-app-title {
  font-weight: bold;
  font-size: 18px;
  margin: 5px;
}

.about-link {
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.about-copyright {
  font-size: 12px;
}
</style>

<template>
  <div style="height: 100%; position: relative">
    <n-layout position="absolute">
      <n-layout-header style="height: 64px; padding: 24px" bordered>
        Dashboard
      </n-layout-header>
      <n-flex justify="start" size="large" style="margin-top: 5vh">
        <n-card title="系统版本" hoverable style="width: 50vh; margin-left: 10px">
          <n-flex>
            <n-icon v-if="platform == 'darwin'" size="20" color="#0067b8"
              ><AppleLogo
            /></n-icon>
            <n-icon v-if="platform == 'win32'" size="20" color="#0067b8"
              ><WindowsLogo
            /></n-icon>
            <n-icon v-if="platform == 'linux'" size="20" color="#0067b8"
              ><LinuxLogo
            /></n-icon>
            <div>{{ systemVersion }}</div>
          </n-flex>
        </n-card>
        <n-card title="Node.js 版本" hoverable style="width: 50vh">
          <n-flex>
            <n-icon size="20" color="#18a058"><NodeIcon /></n-icon>
            <div>{{ nodeVersion }}</div>
          </n-flex>
        </n-card>
        <n-card title="Electron 版本" hoverable style="width: 50vh; margin-left: 10px">
          <n-flex>
            <n-icon size="20" color="#18a058"><ElectronIcon /></n-icon>
            <div>{{ electronVersion }}</div>
          </n-flex>
        </n-card>
      </n-flex>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import {
  LogoWindows as WindowsLogo,
  LogoNodejs as NodeIcon,
  LogoApple as AppleLogo,
  LogoElectron as ElectronIcon
} from "@vicons/ionicons5";
import { Linux as LinuxLogo } from "@vicons/fa";
import { executeCmd } from "@render/api";
import {onBeforeMount, onMounted, ref} from "vue";
import { NLayout, NFlex, NCard, NIcon, NLayoutHeader } from "naive-ui";

const platform = window.versions.system().platform;
const systemVersion = ref("");
if (platform == "darwin") {
  systemVersion.value = `MacOS ${window.versions.system().getSystemVersion()}`;
}
if (platform == "win32") {
  systemVersion.value = `Windows ${window.versions
    .system()
    .getSystemVersion()}`;
}
if (platform == "linux") {
  systemVersion.value = `Linux ${window.versions.system().getSystemVersion()}`;
}

const nodeVersion = ref("");
const electronVersion = ref("");

async function getCurrentNodeVersion() {
  nodeVersion.value = await executeCmd("nvm current");
}
getCurrentNodeVersion();
onBeforeMount(() => {
  // getCurrentNodeVersion();
});

onMounted(() => {
  electronVersion.value = window.versions.electron();
})
</script>

<style scoped></style>

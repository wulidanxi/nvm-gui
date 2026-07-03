<template>
  <div class="dashboard-page">
    <n-layout position="absolute">
      <n-layout-header style="height: 64px; padding: 24px" bordered>
        Dashboard
      </n-layout-header>
      <div class="dashboard-grid">
        <n-card title="系统版本" hoverable>
          <n-flex align="center">
            <n-icon v-if="platform === 'darwin'" size="20" color="#0067b8">
              <AppleLogo />
            </n-icon>
            <n-icon v-if="platform === 'win32'" size="20" color="#0067b8">
              <WindowsLogo />
            </n-icon>
            <n-icon v-if="platform === 'linux'" size="20" color="#0067b8">
              <LinuxLogo />
            </n-icon>
            <div>{{ systemVersion }}</div>
          </n-flex>
        </n-card>
        <n-card title="Node.js 版本" hoverable>
          <n-flex align="center">
            <n-icon size="20" color="#18a058">
              <NodeIcon />
            </n-icon>
            <div>{{ nodeVersion }}</div>
          </n-flex>
        </n-card>
        <n-card title="NVM 管理器" hoverable>
          <n-flex align="center">
            <n-icon size="20" color="#18a058">
              <NodeIcon />
            </n-icon>
            <div>{{ nvmManagerVersion }}</div>
          </n-flex>
        </n-card>
        <n-card title="Electron 版本" hoverable>
          <n-flex align="center">
            <n-icon size="20" color="#18a058">
              <ElectronIcon />
            </n-icon>
            <div>{{ electronVersion }}</div>
          </n-flex>
        </n-card>
      </div>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import {
  LogoApple as AppleLogo,
  LogoElectron as ElectronIcon,
  LogoNodejs as NodeIcon,
  LogoWindows as WindowsLogo,
} from '@vicons/ionicons5'
import { Linux as LinuxLogo } from '@vicons/fa'
import { onMounted, ref } from 'vue'
import { NCard, NFlex, NIcon, NLayout, NLayoutHeader } from 'naive-ui'
import { currentNvmManagerVersion, nvmCurrent } from '@render/api'

const platform = window.nvmGui.system.platform
const systemVersion = ref('')
const nodeVersion = ref('')
const nvmManagerVersion = ref('')
const electronVersion = ref('')

if (platform === 'darwin')
  systemVersion.value = `MacOS ${window.nvmGui.system.systemVersion}`

if (platform === 'win32')
  systemVersion.value = `Windows ${window.nvmGui.system.systemVersion}`

if (platform === 'linux')
  systemVersion.value = `Linux ${window.nvmGui.system.systemVersion}`

async function getCurrentNodeVersion() {
  try {
    nodeVersion.value = await nvmCurrent()
  }
  catch {
    nodeVersion.value = 'NVM 未安装'
  }
}

async function getNvmManagerVersion() {
  try {
    nvmManagerVersion.value = await currentNvmManagerVersion()
  }
  catch {
    nvmManagerVersion.value = '未安装'
  }
}

getCurrentNodeVersion()
getNvmManagerVersion()

onMounted(() => {
  electronVersion.value = window.nvmGui.system.electronVersion
})
</script>

<style scoped>
.dashboard-page {
  height: 100%;
  position: relative;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 16px 20px;
  padding: 44px 22px 0;
  box-sizing: border-box;
}

.dashboard-grid :deep(.n-card) {
  min-height: 140px;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>

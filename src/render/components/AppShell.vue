<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AlbumsOutline,
  CloudDownloadOutline,
  GridOutline,
  InformationCircleOutline,
  LogoGithub,
  LogoNodejs,
  MoonOutline,
  SettingsOutline,
  SunnyOutline,
} from "@vicons/ionicons5";
import {
  currentNvmManagerVersion,
  nvmCurrent,
  nvmVersion as getNvmCliVersion,
  openUrl,
} from "@render/api";
import { useThemeStore } from "@render/stores/ThemeStore";
import logoIconBlack from "@render/assets/nvm-logo-color-avatar.png";
import logoIconWhite from "@render/assets/nvm-logo-white.svg";
import config from "../../../package.json";

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();

const showModal = ref(false);
const currentNodeVersion = ref("检测中");
const nvmManagerVersion = ref("检测中");
const nvmCliVersion = ref("");

const version = config.version;

const isDark = computed({
  get: () => themeStore.theme === "dark",
  set: (value: boolean) => themeStore.toggleTheme(value ? "dark" : "light"),
});

const logoIcon = computed(() => (isDark.value ? logoIconWhite : logoIconBlack));

const platformLabel = computed(() => {
  const platform = window.nvmGui.system.platform;
  if (platform === "darwin") return "macOS";
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  return platform;
});

const systemVersionLabel = computed(() => {
  return `${platformLabel.value} ${window.nvmGui.system.systemVersion}`;
});

const electronVersionLabel = computed(() => {
  return `Electron ${window.nvmGui.system.electronVersion}`;
});

const navItems = [
  {
    label: "工作台",
    description: "环境总览",
    path: "/dashboard",
    icon: GridOutline,
  },
  {
    label: "本地版本",
    description: "切换与卸载",
    path: "/local",
    icon: AlbumsOutline,
  },
  {
    label: "可安装版本",
    description: "发行记录",
    path: "/available",
    icon: CloudDownloadOutline,
  },
  {
    label: "设置中心",
    description: "源、迁移、NVM",
    path: "/setting",
    icon: SettingsOutline,
  },
];

const activePath = computed(() => {
  const current = navItems.find((item) => route.path.startsWith(item.path));
  return current?.path || "/dashboard";
});

function go(path: string) {
  if (route.path !== path) {
    router.push(path);
  }
}

function onOpenSource() {
  openUrl("https://github.com/wulidanxi/nvm-gui");
}

function onOpenPlugin() {
  openUrl("https://github.com/coreybutler/nvm-windows");
}

function onOpenOffice() {
  window.$message.info("官方网站暂未配置");
}

async function refreshRuntimeStatus() {
  try {
    currentNodeVersion.value = await nvmCurrent();
  } catch {
    currentNodeVersion.value = "NVM 未安装";
  }

  try {
    nvmManagerVersion.value = await currentNvmManagerVersion();
  } catch {
    nvmManagerVersion.value = "未安装";
  }

  try {
    nvmCliVersion.value = await getNvmCliVersion();
  } catch {
    nvmCliVersion.value = "未检测到";
  }
}

onMounted(() => {
  refreshRuntimeStatus();
});
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand-block">
        <img class="brand-logo" :src="logoIcon" alt="NVM GUI" />
        <div>
          <div class="brand-title">NVM GUI</div>
          <div class="brand-subtitle">Node 环境工作台</div>
        </div>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <button
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ 'is-active': activePath === item.path }"
          type="button"
          @click="go(item.path)"
        >
          <n-icon class="nav-icon" size="20">
            <component :is="item.icon" />
          </n-icon>
          <span class="nav-copy">
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-description">{{ item.description }}</span>
          </span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="runtime-mini">
          <div class="status-dot" />
          <div>
            <div class="runtime-mini-label">当前 Node</div>
            <div class="runtime-mini-value">{{ currentNodeVersion }}</div>
          </div>
        </div>
      </div>
    </aside>

    <main class="app-main">
      <header class="topbar">
        <div class="topbar-left">
          <n-tag class="runtime-tag" round :bordered="false">
            {{ systemVersionLabel }}
          </n-tag>
          <n-tag class="runtime-tag" round :bordered="false">
            NVM {{ nvmManagerVersion }}
          </n-tag>
          <n-tag class="runtime-tag" round :bordered="false">
            {{ electronVersionLabel }}
          </n-tag>
        </div>

        <div class="topbar-right">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary circle @click="onOpenSource">
                <template #icon>
                  <n-icon><LogoGithub /></n-icon>
                </template>
              </n-button>
            </template>
            源码仓库
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary circle @click="showModal = true">
                <template #icon>
                  <n-icon><InformationCircleOutline /></n-icon>
                </template>
              </n-button>
            </template>
            关于
          </n-tooltip>

          <div class="theme-switch">
            <n-icon size="16">
              <SunnyOutline v-if="!isDark" />
              <MoonOutline v-else />
            </n-icon>
            <n-switch v-model:value="isDark" size="small" />
          </div>
        </div>
      </header>

      <section class="content-frame">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </section>
    </main>

    <n-modal
      v-model:show="showModal"
      :show-icon="false"
      preset="dialog"
      transform-origin="center"
    >
      <n-space :size="12" :wrap="false" align="center" vertical>
        <n-avatar :size="116" :src="logoIcon" color="#0000" />
        <div class="about-app-title">Node Version Manager GUI</div>
        <n-space :size="6" align="center">
          <n-icon color="var(--app-accent)"><LogoNodejs /></n-icon>
          <n-text depth="3">让 Node 版本管理更像一个顺手的桌面工具</n-text>
        </n-space>
        <n-space :size="6" justify="space-between">
          <n-text>管理器版本:</n-text>
          <n-text class="about-link" @click="onOpenPlugin">
            {{ nvmCliVersion || nvmManagerVersion }}
          </n-text>
        </n-space>
        <n-space :size="6" justify="space-between">
          <n-text>软件版本:</n-text>
          <n-text>{{ version }}</n-text>
        </n-space>
        <n-space :size="6" justify="center">
          <n-text class="about-link" @click="onOpenSource">源码地址</n-text>
          <n-divider vertical />
          <n-text class="about-link" @click="onOpenOffice">官方网站</n-text>
          <n-divider vertical />
          <n-text class="about-link" @click="onOpenPlugin">NVM Windows</n-text>
        </n-space>
        <div class="about-copyright">
          Copyright 2025 Wulidanxi. All rights reserved.
        </div>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, var(--app-accent-soft), transparent 34%),
    var(--app-bg);
}

.app-sidebar {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 18px 14px;
  border-right: 1px solid var(--app-border);
  background: var(--app-surface);
  backdrop-filter: blur(18px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 8px 10px 18px;
}

.brand-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.brand-title {
  color: var(--app-text);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.nav-list {
  display: grid;
  gap: 8px;
}

.nav-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 58px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  color: var(--app-text-muted);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.nav-item:hover {
  background: var(--app-accent-soft);
}

.nav-item.is-active {
  color: var(--app-accent);
  background: var(--app-accent-soft);
  box-shadow: inset 3px 0 0 var(--app-accent);
}

.nav-icon {
  justify-self: center;
}

.nav-copy {
  min-width: 0;
}

.nav-label,
.nav-description {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-label {
  font-size: 14px;
  font-weight: 700;
}

.nav-description {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 14px;
}

.runtime-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-raised);
}

.runtime-mini-label {
  color: var(--app-text-muted);
  font-size: 12px;
}

.runtime-mini-value {
  color: var(--app-text);
  font-size: 13px;
  font-weight: 750;
}

.app-main {
  display: grid;
  grid-template-rows: 64px minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 22px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface);
  backdrop-filter: blur(18px);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.runtime-tag {
  --n-font-size: 11px;
  --n-height: 24px;
  --n-color: var(--app-accent-soft);
  --n-text-color: var(--app-accent);
  --n-border: 1px solid var(--app-accent-strong);
  font-weight: 650;
}

.theme-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
}

.content-frame {
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: contain;
}

.about-app-title {
  font-size: 18px;
  font-weight: 800;
}

.about-link {
  cursor: pointer;
}

.about-link:hover {
  text-decoration: underline;
}

.about-copyright {
  color: var(--app-text-muted);
  font-size: 12px;
}

@media (max-width: 920px) {
  .app-shell {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .brand-block {
    justify-content: center;
    padding-inline: 0;
  }

  .brand-block > div,
  .nav-copy,
  .sidebar-footer {
    display: none;
  }

  .nav-item {
    grid-template-columns: 1fr;
  }
}
</style>

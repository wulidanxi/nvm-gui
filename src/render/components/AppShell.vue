<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  AlbumsOutline,
  CloudDownloadOutline,
  GridOutline,
  InformationCircleOutline,
  ListOutline,
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
  checkForAppUpdate,
  downloadAppUpdate,
  getAppUpdateStatus,
  onAppUpdateStatus,
  quitAndInstallAppUpdate,
} from "@render/api";
import { useI18n } from "@render/i18n";
import { useThemeStore } from "@render/stores/ThemeStore";
import { useUpdateStore } from "@render/stores/UpdateStore";
import type { AppUpdateStatus } from "@common/types";
import { useAppMotion } from "@render/utils/motionPresets";
import logoIconBlack from "@render/assets/nvm-logo-color-avatar.png";
import logoIconWhite from "@render/assets/nvm-logo-white.svg";
import config from "../../../package.json";
import { desktopApi } from "@render/api/desktop";

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();
const updateStore = useUpdateStore();
const { t } = useI18n();
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  navMotion,
  pageMotion,
} = useAppMotion();

const showModal = ref(false);
const themeSwitchRef = ref<HTMLElement | null>(null);
const themeTransitionOrigin = ref({ x: 0, y: 0 });
const currentNodeStatus = ref<"loading" | "missing" | "ready">("loading");
const nvmManagerStatus = ref<"loading" | "missing" | "ready">("loading");
const nvmCliStatus = ref<"loading" | "missing" | "ready">("loading");
const currentNodeVersion = ref("");
const nvmManagerVersion = ref("");
const nvmCliVersion = ref("");
const updateStatus = ref<AppUpdateStatus>({ phase: "idle" });
let removeUpdateListener: (() => void) | undefined;

const version = config.version;

const isDark = computed(() => themeStore.theme === "dark");

const logoIcon = computed(() => (isDark.value ? logoIconWhite : logoIconBlack));

const platformLabel = computed(() => {
  const platform = desktopApi.system.platform;
  if (platform === "darwin") return "macOS";
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  return platform;
});

const systemVersionLabel = computed(() => {
  return `${platformLabel.value} ${desktopApi.system.systemVersion}`;
});

const electronVersionLabel = computed(() => {
  return `Electron ${desktopApi.system.electronVersion}`;
});

const currentNodeVersionLabel = computed(() => {
  if (currentNodeStatus.value === "loading") return t("common.loading");
  if (currentNodeStatus.value === "missing") return t("common.nvmMissing");
  return currentNodeVersion.value;
});

const nvmManagerVersionLabel = computed(() => {
  if (nvmManagerStatus.value === "loading") return t("common.loading");
  if (nvmManagerStatus.value === "missing") return t("common.unavailable");
  return nvmManagerVersion.value;
});

const nvmCliVersionLabel = computed(() => {
  if (nvmCliStatus.value === "loading") return t("common.loading");
  if (nvmCliStatus.value === "missing") return t("common.unavailable");
  return nvmCliVersion.value;
});

const navItems = computed(() => [
  {
    label: t("nav.dashboard"),
    description: t("nav.dashboardDescription"),
    path: "/dashboard",
    icon: GridOutline,
  },
  {
    label: t("nav.local"),
    description: t("nav.localDescription"),
    path: "/local",
    icon: AlbumsOutline,
  },
  {
    label: t("nav.available"),
    description: t("nav.availableDescription"),
    path: "/available",
    icon: CloudDownloadOutline,
  },
  {
    label: t("nav.commandLog"),
    description: t("nav.commandLogDescription"),
    path: "/logs",
    icon: ListOutline,
  },
  {
    label: t("nav.settings"),
    description: t("nav.settingsDescription"),
    path: "/setting",
    icon: SettingsOutline,
  },
]);

const activePath = computed(() => {
  const current = navItems.value.find((item) => route.path.startsWith(item.path));
  return current?.path || "/dashboard";
});

type ViewTransitionLike = {
  ready: Promise<void>;
};

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function rememberThemeTransitionOrigin(event: PointerEvent) {
  themeTransitionOrigin.value = {
    x: event.clientX,
    y: event.clientY,
  };
}

function resolveThemeTransitionOrigin() {
  if (themeTransitionOrigin.value.x || themeTransitionOrigin.value.y) {
    return themeTransitionOrigin.value;
  }

  const switchRect = themeSwitchRef.value?.getBoundingClientRect();
  if (switchRect) {
    return {
      x: switchRect.left + switchRect.width / 2,
      y: switchRect.top + switchRect.height / 2,
    };
  }

  return {
    x: window.innerWidth - 48,
    y: 32,
  };
}

function updateThemeMode(value: boolean) {
  const nextTheme = value ? "dark" : "light";
  if (themeStore.theme === nextTheme) return;

  const transitionDocument = document as ViewTransitionDocument;
  if (!transitionDocument.startViewTransition || reduceMotionQuery.matches) {
    themeStore.toggleTheme(nextTheme);
    return;
  }

  const { x, y } = resolveThemeTransitionOrigin();
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = transitionDocument.startViewTransition(() => {
    themeStore.toggleTheme(nextTheme);
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 820,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
}

function go(path: string) {
  if (route.path !== path) {
    router.push(path);
  }
}

function onOpenSource() {
  openUrl("project");
}

function onOpenPlugin() {
  openUrl("nvmWindows");
}

function onOpenOffice() {
  window.$message.info(t("shell.officialSiteUnavailable"));
}

async function checkUpdate() {
  updateStatus.value = await checkForAppUpdate(updateStore.includePrerelease);
  if (updateStatus.value.phase === "up-to-date")
    window.$message.success(t("update.upToDate"));
  if (updateStatus.value.phase === "error")
    window.$message.error(t("update.failed", { message: updateStatus.value.error || "-" }));
}

async function handleUpdate() {
  if (updateStatus.value.phase === "available" && updateStatus.value.manualDownload) {
    await openUrl("projectReleases");
    return;
  }
  if (updateStatus.value.phase === "available") {
    if (updateStatus.value.unsignedWarning) {
      window.$dialog.warning({
        title: t("update.download"), content: t("update.unsignedWarning"), closable: false, maskClosable: false,
        positiveText: t("update.download"), negativeText: t("common.cancel"),
        onPositiveClick: async () => { updateStatus.value = await downloadAppUpdate(); },
      });
      return;
    }
    updateStatus.value = await downloadAppUpdate();
    return;
  }
  if (updateStatus.value.phase === "downloaded") {
    quitAndInstallAppUpdate();
    return;
  }
  await checkUpdate();
}

const updateButtonLabel = computed(() => {
  if (updateStatus.value.phase === "checking") return t("update.checking");
  if (updateStatus.value.phase === "available") return updateStatus.value.manualDownload ? t("update.manualDownload") : t("update.download");
  if (updateStatus.value.phase === "downloading") return t("update.downloading", { progress: updateStatus.value.progress || 0 });
  if (updateStatus.value.phase === "downloaded") return t("update.restart");
  return t("update.check");
});

async function refreshRuntimeStatus() {
  try {
    currentNodeVersion.value = await nvmCurrent();
    currentNodeStatus.value = "ready";
  } catch {
    currentNodeStatus.value = "missing";
  }

  try {
    nvmManagerVersion.value = await currentNvmManagerVersion();
    nvmManagerStatus.value = "ready";
  } catch {
    nvmManagerStatus.value = "missing";
  }

  try {
    nvmCliVersion.value = await getNvmCliVersion();
    nvmCliStatus.value = "ready";
  } catch {
    nvmCliStatus.value = "missing";
  }
}

onMounted(() => {
  refreshRuntimeStatus();
  removeUpdateListener = onAppUpdateStatus((status) => {
    updateStatus.value = status;
  });
  getAppUpdateStatus().then((status) => {
    updateStatus.value = status;
  });
  if (updateStore.autoCheck) {
    setTimeout(() => {
      checkUpdate().catch(() => {});
    }, 800);
  }
});

onUnmounted(() => {
  removeUpdateListener?.();
});
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand-block">
        <img class="brand-logo" :src="logoIcon" alt="NVM GUI" />
        <div>
          <div class="brand-title">NVM GUI</div>
          <div class="brand-subtitle">{{ t("shell.brandSubtitle") }}</div>
        </div>
      </div>

      <nav
        v-auto-animate="autoAnimateOptions"
        class="nav-list"
        :aria-label="t('shell.navLabel')"
      >
        <button
          v-for="item in navItems"
          :key="item.path"
          v-motion="navMotion"
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
        <div class="runtime-mini" v-motion="cardMotion">
          <div class="status-dot" />
          <div>
            <div class="runtime-mini-label">{{ t("common.currentNode") }}</div>
            <div class="runtime-mini-value">{{ currentNodeVersionLabel }}</div>
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
            NVM {{ nvmManagerVersionLabel }}
          </n-tag>
          <n-tag class="runtime-tag" round :bordered="false">
            {{ electronVersionLabel }}
          </n-tag>
        </div>

        <div class="topbar-right">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button v-motion="controlMotion" quaternary :loading="updateStatus.phase === 'checking' || updateStatus.phase === 'downloading'" @click="handleUpdate">
                <template #icon><n-icon><CloudDownloadOutline /></n-icon></template>
                {{ updateButtonLabel }}
              </n-button>
            </template>
            {{ updateStatus.phase === 'available' ? t('update.available', { version: updateStatus.version || '-' }) : t('update.check') }}
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button v-motion="controlMotion" quaternary circle @click="onOpenSource">
                <template #icon>
                  <n-icon><LogoGithub /></n-icon>
                </template>
              </n-button>
            </template>
            {{ t("shell.sourceRepo") }}
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button v-motion="controlMotion" quaternary circle @click="showModal = true">
                <template #icon>
                  <n-icon><InformationCircleOutline /></n-icon>
                </template>
              </n-button>
            </template>
            {{ t("shell.about") }}
          </n-tooltip>

          <div
            ref="themeSwitchRef"
            class="theme-switch"
            @pointerdown="rememberThemeTransitionOrigin"
          >
            <n-icon size="16">
              <SunnyOutline v-if="!isDark" />
              <MoonOutline v-else />
            </n-icon>
            <n-switch
              :value="isDark"
              size="small"
              @update:value="updateThemeMode"
            />
          </div>
        </div>
      </header>

      <section class="content-frame">
        <router-view v-slot="{ Component, route }">
          <keep-alive>
            <component
              :is="Component"
              :key="route.path"
              v-motion="pageMotion"
            />
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
          <n-text depth="3">{{ t("shell.tagline") }}</n-text>
        </n-space>
        <n-space :size="6" justify="space-between">
          <n-text>{{ t("shell.managerVersion") }}</n-text>
          <n-text class="about-link" @click="onOpenPlugin">
            {{ nvmCliVersionLabel || nvmManagerVersionLabel }}
          </n-text>
        </n-space>
        <n-space :size="6" justify="space-between">
          <n-text>{{ t("shell.appVersion") }}</n-text>
          <n-text>{{ version }}</n-text>
        </n-space>
        <n-space :size="6" justify="center">
          <n-text class="about-link" @click="onOpenSource">{{ t("shell.sourceAddress") }}</n-text>
          <n-divider vertical />
          <n-text class="about-link" @click="onOpenOffice">{{ t("shell.officialSite") }}</n-text>
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

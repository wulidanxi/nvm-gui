<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
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
import { openUrl } from "@render/api";
import { useI18n } from "@render/i18n";
import { useThemeStore } from "@render/stores/ThemeStore";
import { useRuntimeStore } from "@render/stores/RuntimeStore";
import { useAppUpdate } from "@render/features/updates/useAppUpdate";
import { useAppMotion } from "@render/utils/motionPresets";
import logoIconBlack from "@render/assets/nvm-logo-color-avatar.png";
import logoIconWhite from "@render/assets/nvm-logo-white.svg";
import config from "../../../package.json";
import { desktopApi } from "@render/api/desktop";

const router = useRouter();
const route = useRoute();
const themeStore = useThemeStore();
const runtimeStore = useRuntimeStore();
const {
  currentNodeStatus, nvmManagerStatus, nvmCliStatus,
  currentNodeVersion, nvmManagerVersion, nvmCliVersion,
} = storeToRefs(runtimeStore);
const {
  status: updateStatus,
  dialogVisible: updateDialogVisible,
  installing: updateInstalling,
  buttonLabel: updateButtonLabel,
  handle: handleUpdate,
  downloadAndInstall,
} = useAppUpdate();
const { t } = useI18n();
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
  navMotion,
} = useAppMotion();

const showModal = ref(false);
const themeSwitchRef = ref<HTMLElement | null>(null);
const themeTransitionOrigin = ref({ x: 0, y: 0 });

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
  finished: Promise<void>;
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

  const root = document.documentElement;
  root.style.setProperty("--theme-transition-x", `${x}px`);
  root.style.setProperty("--theme-transition-y", `${y}px`);
  root.style.setProperty("--theme-transition-radius", `${endRadius}px`);
  root.classList.add("is-theme-transitioning");

  const transition = transitionDocument.startViewTransition(() => {
    themeStore.toggleTheme(nextTheme);
  });

  const finishTransition = () => {
    root.classList.remove("is-theme-transitioning");
    root.style.removeProperty("--theme-transition-x");
    root.style.removeProperty("--theme-transition-y");
    root.style.removeProperty("--theme-transition-radius");
  };
  transition.finished.then(finishTransition, finishTransition);
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

onMounted(() => {
  runtimeStore.refresh();
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
          <Transition name="route-page" mode="out-in" appear>
            <keep-alive>
              <component
                :is="Component"
                :key="route.path"
              />
            </keep-alive>
          </Transition>
        </router-view>
      </section>
    </main>

    <n-modal
      v-model:show="updateDialogVisible"
      preset="card"
      style="width: min(620px, calc(100vw - 32px))"
      :closable="updateStatus.phase !== 'downloading'"
      :mask-closable="updateStatus.phase !== 'downloading'"
      transform-origin="center"
    >
      <template #header>
        <div class="update-heading">
          <div class="update-heading-icon">
            <n-icon :size="22"><CloudDownloadOutline /></n-icon>
          </div>
          <div>
            <div class="update-heading-title">{{ t("update.title") }}</div>
            <n-text depth="3">{{ t("update.available", { version: updateStatus.version || "-" }) }}</n-text>
          </div>
        </div>
      </template>

      <n-space vertical :size="16">
        <div class="update-version-row">
          <div>
            <n-text depth="3">{{ t("update.currentVersion") }}</n-text>
            <div class="update-version">{{ version }}</div>
          </div>
          <div class="update-version-arrow">→</div>
          <div>
            <n-text depth="3">{{ t("update.newVersion") }}</n-text>
            <div class="update-version update-version-new">{{ updateStatus.version || "-" }}</div>
          </div>
        </div>

        <div>
          <n-text strong>{{ t("update.releaseNotes") }}</n-text>
          <div class="update-release-notes">{{ updateStatus.releaseNotes || t("update.noReleaseNotes") }}</div>
        </div>

        <n-alert v-if="updateStatus.unsignedWarning" type="warning" :show-icon="true">
          {{ t("update.unsignedWarning") }}
        </n-alert>

        <div v-if="updateStatus.phase === 'downloading'" class="update-progress">
          <n-progress type="line" :percentage="updateStatus.progress || 0" :processing="true" />
          <n-text depth="3">{{ t("update.installHint") }}</n-text>
        </div>

        <n-alert v-if="updateStatus.error" type="error" :show-icon="true">
          {{ t("update.failed", { message: updateStatus.error || "-" }) }}
        </n-alert>
      </n-space>

      <template #footer>
        <n-space justify="end">
          <n-button
            v-if="updateStatus.phase !== 'downloading'"
            @click="updateDialogVisible = false"
          >
            {{ t("common.cancel") }}
          </n-button>
          <n-button
            type="primary"
            :loading="updateInstalling || updateStatus.phase === 'downloading'"
            :disabled="updateStatus.phase === 'downloading'"
            @click="downloadAndInstall"
          >
            {{ updateStatus.manualDownload ? t("update.manualDownload") : t("update.download") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

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

.route-page-enter-active {
  transition:
    opacity 280ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.route-page-leave-active {
  transition:
    opacity 160ms ease,
    transform 180ms ease;
  will-change: opacity, transform;
}

.route-page-enter-from {
  opacity: 0;
  transform: translate3d(0, 12px, 0) scale(0.995);
}

.route-page-leave-to {
  opacity: 0;
  transform: translate3d(0, -6px, 0) scale(0.998);
}

.route-page-enter-to,
.route-page-leave-from {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

.about-app-title {
  font-size: 18px;
  font-weight: 800;
}

.update-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-heading-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
}

.update-heading-title {
  margin-bottom: 2px;
  font-size: 18px;
  font-weight: 800;
}

.update-version-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
}

.update-version {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 750;
}

.update-version-new,
.update-version-arrow {
  color: var(--app-accent);
}

.update-version-arrow {
  font-size: 22px;
}

.update-release-notes {
  max-height: 210px;
  margin-top: 8px;
  padding: 12px 14px;
  overflow: auto;
  border-radius: 10px;
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.update-progress {
  display: grid;
  gap: 8px;
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

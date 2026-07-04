<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CloudDownloadOutline,
  CodeSlashOutline,
  SettingsOutline,
  SwapHorizontalOutline,
} from "@vicons/ionicons5";
import { currentNvmManagerVersion, nvmCurrent } from "@render/api";

const router = useRouter();
const nodeVersion = ref("检测中");
const nvmManagerVersion = ref("检测中");
const electronVersion = ref("");

const nodeReady = computed(() => !["检测中", "NVM 未安装"].includes(nodeVersion.value));
const nvmReady = computed(() => !["检测中", "未安装"].includes(nvmManagerVersion.value));

const healthItems = computed(() => [
  {
    label: "Node 运行时",
    value: nodeVersion.value,
    ready: nodeReady.value,
  },
  {
    label: "NVM 管理器",
    value: nvmManagerVersion.value,
    ready: nvmReady.value,
  },
  {
    label: "桌面运行壳",
    value: `Electron ${electronVersion.value || "-"}`,
    ready: Boolean(electronVersion.value),
  },
]);

const quickActions = [
  {
    title: "管理本地版本",
    description: "切换当前 Node，清理不再使用的版本。",
    path: "/local",
    icon: SwapHorizontalOutline,
  },
  {
    title: "安装新版本",
    description: "查看 Node 发行记录并安装推荐版本。",
    path: "/available",
    icon: CloudDownloadOutline,
  },
  {
    title: "项目版本检测",
    description: "读取项目 .nvmrc，快速切换到匹配版本。",
    path: "/setting",
    icon: CodeSlashOutline,
  },
  {
    title: "NVM 管理器",
    description: "检测、安装或升级底层 NVM 管理器。",
    path: "/setting",
    icon: SettingsOutline,
  },
];

async function getCurrentNodeVersion() {
  try {
    nodeVersion.value = await nvmCurrent();
  } catch {
    nodeVersion.value = "NVM 未安装";
  }
}

async function getNvmManagerVersion() {
  try {
    nvmManagerVersion.value = await currentNvmManagerVersion();
  } catch {
    nvmManagerVersion.value = "未安装";
  }
}

function openAction(path: string) {
  router.push(path);
}

getCurrentNodeVersion();
getNvmManagerVersion();

onMounted(() => {
  electronVersion.value = window.nvmGui.system.electronVersion;
});
</script>

<template>
  <div class="app-page dashboard-page">
    <div class="page-heading">
      <div>
        <div class="page-kicker">Dashboard</div>
        <h1 class="page-title">Node 环境工作台</h1>
        <div class="page-description">
          汇总当前 Node、NVM 和桌面运行状态，把常用操作放在第一屏。
        </div>
      </div>
      <n-button type="primary" @click="openAction('/available')">
        <template #icon>
          <n-icon><CloudDownloadOutline /></n-icon>
        </template>
        安装 Node 版本
      </n-button>
    </div>

    <div class="page-scroll-body">
      <section class="hero-panel">
      <div class="hero-copy">
        <div class="hero-eyebrow">CURRENT RUNTIME</div>
        <div class="hero-version">{{ nodeVersion }}</div>
        <div class="hero-subtitle">
          {{ nodeReady ? "当前 Node 环境已就绪" : "需要先安装或配置 NVM 管理器" }}
        </div>
      </div>
      <div class="hero-status">
        <n-tag :type="nodeReady ? 'success' : 'warning'" round :bordered="false">
          {{ nodeReady ? "Active" : "Action required" }}
        </n-tag>
      </div>
      </section>

      <section class="dashboard-grid">
      <n-card class="panel-card" :bordered="false" title="环境健康">
        <div class="health-list">
          <div
            v-for="item in healthItems"
            :key="item.label"
            class="health-row"
          >
            <div class="health-leading">
              <div class="status-dot" :class="{ 'is-warning': !item.ready }" />
              <div>
                <div class="health-label">{{ item.label }}</div>
                <div class="health-value">{{ item.value }}</div>
              </div>
            </div>
            <n-tag
              size="small"
              round
              :bordered="false"
              :type="item.ready ? 'success' : 'warning'"
            >
              {{ item.ready ? "正常" : "待处理" }}
            </n-tag>
          </div>
        </div>
      </n-card>

      <n-card class="panel-card" :bordered="false" title="快捷操作">
        <div class="action-grid">
          <button
            v-for="item in quickActions"
            :key="item.title"
            class="action-tile"
            type="button"
            @click="openAction(item.path)"
          >
            <n-icon size="22"><component :is="item.icon" /></n-icon>
            <span>
              <span class="action-title">{{ item.title }}</span>
              <span class="action-description">{{ item.description }}</span>
            </span>
          </button>
        </div>
      </n-card>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  gap: 0;
}

.dashboard-page .page-scroll-body {
  gap: 14px;
}

.hero-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 118px;
  padding: 20px 22px;
  border: 1px solid var(--app-accent-strong);
  border-radius: 8px;
  background:
    linear-gradient(135deg, var(--app-accent-strong), transparent 42%),
    var(--app-surface);
  box-shadow: var(--app-shadow-strong);
}

.hero-eyebrow {
  color: var(--app-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.hero-version {
  margin-top: 4px;
  color: var(--app-text);
  font-size: 34px;
  font-weight: 850;
  line-height: 1.05;
}

.hero-subtitle {
  margin-top: 6px;
  color: var(--app-text-muted);
  font-size: 14px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
  gap: 12px;
}

.health-list {
  display: grid;
  gap: 8px;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.health-leading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot.is-warning {
  background: var(--app-warning);
  box-shadow: 0 0 0 4px var(--app-warning-soft);
}

.health-label,
.action-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 750;
}

.health-value,
.action-description {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.action-tile {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  min-height: 68px;
  padding: 11px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-accent);
  background: var(--app-surface-raised);
  text-align: left;
  cursor: pointer;
}

.action-tile:hover {
  border-color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .hero-panel,
  .dashboard-grid,
  .action-grid {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

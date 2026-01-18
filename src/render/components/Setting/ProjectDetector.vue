<template>
  <div class="project-detector">
    <n-card title="项目版本检测" size="small">
      <template #header-extra>
        <n-button size="small" type="primary" dashed @click="selectProject">
          <template #icon
            ><n-icon><FolderOpenOutline /></n-icon
          ></template>
          选择项目文件夹
        </n-button>
      </template>

      <div v-if="!currentProject" class="empty-state">
        <n-text depth="3">请选择一个包含 .nvmrc 文件的项目</n-text>
      </div>

      <div v-else>
        <n-list>
          <n-list-item>
            <n-flex justify="space-between" align="center">
              <n-flex vertical>
                <n-text strong>{{ currentProject.name }}</n-text>
                <n-text depth="3" class="path-text">{{
                  currentProject.path
                }}</n-text>
              </n-flex>
              <n-tag :type="currentProject.match ? 'success' : 'warning'">
                需求: {{ currentProject.version }}
              </n-tag>
            </n-flex>
          </n-list-item>
        </n-list>

        <n-flex justify="end" class="mt-4" v-if="!currentProject.match">
          <n-button
            type="primary"
            @click="switchToVersion(currentProject.version)"
          >
            切换到 {{ currentProject.version }}
          </n-button>
        </n-flex>
        <n-flex justify="end" class="mt-4" v-else>
          <n-button type="success" secondary disabled> 当前已匹配 </n-button>
        </n-flex>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent } from "vue";
import {
  NButton,
  NCard,
  NFlex,
  NIcon,
  NList,
  NListItem,
  NTag,
  NText,
  useMessage,
} from "naive-ui";
import { FolderOpenOutline } from "@vicons/ionicons5";
import {
  checkNvmrc,
  nvmInstall,
  nvmList,
  nvmUse,
  openDirectoryDialog,
} from "@render/api";
import { parseNvmList } from "@render/utils/nvmParser";

const message = useMessage();

interface ProjectInfo {
  name: string;
  path: string;
  version: string;
  match: boolean;
}

const currentProject = ref<ProjectInfo | null>(null);

const selectProject = async () => {
  try {
    const path = await openDirectoryDialog();
    if (path) {
      await analyzeProject(path);
    }
  } catch (error) {
    message.error("无法打开文件选择器");
    console.error(error);
  }
};

const analyzeProject = async (path: string) => {
  try {
    const version = await checkNvmrc(path);
    if (!version) {
      message.warning("该目录没有 .nvmrc 文件");
      currentProject.value = null;
      return;
    }

    const requiredVersion = version.trim();
    const installedVersions = await nvmList();
    const parsed = parseNvmList(installedVersions);

    // Check if required version is installed
    // Note: .nvmrc might contain "14" or "lts/fermium" or "14.17.0"
    // For simplicity, we check exact match or if installed version starts with it
    // Or we rely on nvm install/use which handles aliases better usually.

    // But nvm-windows 'nvm list' returns specific versions like 14.17.0
    // If .nvmrc has '14', we need to check if we have any 14.*
    // For this MVP, let's just show what's in .nvmrc and let user try to switch.

    // Check if currently active version matches
    const currentActive = parsed.find((v) => v.isCurrent);
    const match = currentActive
      ? currentActive.version === requiredVersion
      : false; // Naive check

    currentProject.value = {
      name: path.split("\\").pop() || "Project",
      path: path,
      version: requiredVersion,
      match: match,
    };
  } catch (error) {
    message.error("解析项目失败");
    console.error(error);
  }
};

const switchToVersion = async (version: string) => {
  try {
    await nvmUse(version);
    message.success(`已切换到 ${version}`);
    if (currentProject.value) {
      currentProject.value.match = true;
    }
  } catch (error: any) {
    // If fail, maybe not installed
    if (
      (error.message && error.message.includes("not installed")) ||
      error.toString().includes("exit code")
    ) {
      // Try install?
      // Ask user or just error
      message.error(`切换失败，尝试安装 ${version}...`);
      try {
        await nvmInstall(version);
        await nvmUse(version);
        message.success(`安装并切换到 ${version} 成功`);
        if (currentProject.value) {
          currentProject.value.match = true;
        }
      } catch (installError) {
        message.error(`安装失败: ${installError}`);
      }
    } else {
      message.error(`切换失败: ${error}`);
    }
  }
};
</script>

<style scoped>
.empty-state {
  padding: 20px;
  text-align: center;
}
.path-text {
  font-size: 12px;
}
.mt-4 {
  margin-top: 16px;
}
</style>

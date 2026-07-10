<template>
  <div class="project-detector" v-auto-animate="autoAnimateOptions">
    <OperationFeedback :state="operationState" />

    <n-card v-motion="cardMotion" :title="t('project.title')" size="small">
      <template #header-extra>
        <n-button
          v-motion="controlMotion"
          size="small"
          type="primary"
          dashed
          @click="selectProject"
        >
          <template #icon
            ><n-icon><FolderOpenOutline /></n-icon
          ></template>
          {{ t("project.selectFolder") }}
        </n-button>
      </template>

      <div v-if="!currentProject" class="empty-state">
        <n-text depth="3">{{ t("project.empty") }}</n-text>
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
                {{ t("project.requiredVersion", { version: currentProject.version }) }}
              </n-tag>
            </n-flex>
          </n-list-item>
        </n-list>

        <n-flex justify="end" class="mt-4" v-if="!currentProject.match">
          <n-button
            v-motion="controlMotion"
            type="primary"
            :loading="operatingVersion === currentProject.version"
            @click="switchToVersion(currentProject.version)"
          >
            {{ t("project.switchTo", { version: currentProject.version }) }}
          </n-button>
        </n-flex>
        <n-flex justify="end" class="mt-4" v-else>
          <n-button v-motion="controlMotion" type="success" secondary disabled>
            {{ t("project.matched") }}
          </n-button>
        </n-flex>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
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
  listInstalledNodeVersions,
  openDirectoryDialog,
} from "@render/api";
import OperationFeedback from "@render/components/OperationFeedback.vue";
import { useI18n } from "@render/i18n";
import { useAppMotion } from "@render/utils/motionPresets";
import { useNvmOperations } from "@render/utils/useNvmOperations";

const message = useMessage();
const nvmOperations = useNvmOperations();
const { t } = useI18n();
const operatingVersion = nvmOperations.operatingVersion;
const operationState = nvmOperations.operationState;
const {
  autoAnimateOptions,
  cardMotion,
  controlMotion,
} = useAppMotion();

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
    message.error(t("project.openFailed"));
    console.error(error);
  }
};

const analyzeProject = async (path: string) => {
  try {
    const version = await checkNvmrc(path);
    if (!version) {
      message.warning(t("project.noNvmrc"));
      currentProject.value = null;
      return;
    }

    const requiredVersion = version.trim();
    const installedVersions = await listInstalledNodeVersions();

    // Current matching is exact because nvm-windows lists concrete versions.
    // Broader .nvmrc aliases such as `20` or `lts/iron` should be normalized
    // in a dedicated parser before changing this comparison.
    const currentActive = installedVersions.find((v) => v.active);
    const match = currentActive
      ? currentActive.version === requiredVersion
      : false;

    currentProject.value = {
      name: path.split("\\").pop() || t("project.defaultName"),
      path: path,
      version: requiredVersion,
      match: match,
    };
  } catch (error) {
    message.error(t("project.parseFailed"));
    console.error(error);
  }
};

const switchToVersion = async (version: string) => {
  try {
    await nvmOperations.use(version);
    message.success(t("project.switchSuccess", { version }));
    if (currentProject.value) {
      currentProject.value.match = true;
    }
  } catch (error: any) {
    if (
      (error.message && error.message.includes("not installed")) ||
      error.toString().includes("exit code")
    ) {
      // If switching fails because the version is missing, install it and retry once.
      message.error(t("project.switchFailedTryInstall", { version }));
      try {
        await nvmOperations.install(version);
        await nvmOperations.use(version);
        message.success(t("project.installSwitchSuccess", { version }));
        if (currentProject.value) {
          currentProject.value.match = true;
        }
      } catch (installError) {
        message.error(t("project.installFailed", { message: String(installError) }));
      }
    } else {
      message.error(t("project.switchFailed", { message: String(error) }));
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

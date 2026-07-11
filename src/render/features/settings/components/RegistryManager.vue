<template>
  <div class="registry-manager">
    <n-card :title="t('registry.title')" size="small">
      <template #header-extra>
        <n-button
          size="small"
          type="primary"
          @click="testAllSpeeds"
          :loading="testingAll"
        >
          <template #icon
            ><n-icon><SpeedometerOutline /></n-icon
          ></template>
          {{ t("registry.testAll") }}
        </n-button>
      </template>

      <n-spin :show="loading">
        <n-list hoverable clickable>
          <n-list-item
            v-for="item in registries"
            :key="item.url"
            @click="handleRegistrySelect(item)"
          >
            <n-flex justify="space-between" align="center">
              <n-flex align="center">
                <n-radio
                  :checked="currentRegistry === item.url"
                  :value="item.url"
                  @change="() => handleRegistrySelect(item)"
                />
                <n-text strong>{{ item.name }}</n-text>
                <n-text depth="3" class="registry-url">{{ item.url }}</n-text>
              </n-flex>

              <n-flex align="center">
                <n-tag
                  v-if="item.speed !== undefined"
                  :type="getSpeedType(item.speed)"
                  size="small"
                  round
                >
                  {{ item.speed }} ms
                </n-tag>
                <n-button
                  size="tiny"
                  circle
                  tertiary
                  @click.stop="testSpeed(item)"
                >
                  <template #icon
                    ><n-icon><RefreshOutline /></n-icon
                  ></template>
                </n-button>
              </n-flex>
            </n-flex>
          </n-list-item>
        </n-list>
      </n-spin>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  NCard,
  NList,
  NListItem,
  NRadio,
  NText,
  NTag,
  NButton,
  NIcon,
  NFlex,
  NSpin,
  useMessage,
} from "naive-ui";
import { SpeedometerOutline, RefreshOutline } from "@vicons/ionicons5";
import { getNpmRegistry, setNpmRegistry, testRegistrySpeed } from "@render/api";
import { useI18n } from "@render/i18n";

export interface Registry {
  name: string;
  url: string;
  speed?: number;
}

const message = useMessage();
const { t } = useI18n();
const loading = ref(false);
const testingAll = ref(false);
const currentRegistry = ref("");

const registries = ref<Registry[]>([
  { name: "npm", url: "https://registry.npmjs.org/" },
  { name: "yarn", url: "https://registry.yarnpkg.com/" },
  { name: "tencent", url: "https://mirrors.cloud.tencent.com/npm/" },
  { name: "npmmirror", url: "https://registry.npmmirror.com/" },
  // Kept for users with old npm configurations, although npmmirror is preferred.
  { name: "taobao", url: "https://registry.npm.taobao.org/" },
]);

onMounted(async () => {
  await fetchCurrentRegistry();
});

const fetchCurrentRegistry = async () => {
  loading.value = true;
  try {
    const registry = await getNpmRegistry();
    if (registry) {
      currentRegistry.value = registry.trim();
    }
  } catch (error) {
    message.error(t("registry.fetchFailed"));
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleRegistrySelect = async (item: Registry) => {
  if (currentRegistry.value === item.url) return;

  loading.value = true;
  try {
    await setNpmRegistry(item.url);
    currentRegistry.value = item.url;
    message.success(t("registry.switchSuccess", { name: item.name }));
  } catch (error) {
    message.error(t("registry.switchFailed", { message: String(error) }));
  } finally {
    loading.value = false;
  }
};

const testSpeed = async (item: Registry) => {
  try {
    item.speed = await testRegistrySpeed(item.url);
  } catch (error) {
    item.speed = -1;
  }
};

const testAllSpeeds = async () => {
  testingAll.value = true;
  const promises = registries.value.map((item) => testSpeed(item));
  await Promise.all(promises);
  testingAll.value = false;
};

const getSpeedType = (speed: number) => {
  if (speed < 0) return "error";
  if (speed < 200) return "success";
  if (speed < 500) return "warning";
  return "error";
};
</script>

<style scoped>
.registry-url {
  font-size: 12px;
  margin-left: 8px;
}
</style>

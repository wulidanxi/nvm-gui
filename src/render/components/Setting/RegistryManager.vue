<template>
  <div class="registry-manager">
    <n-card title="NPM 源管理" size="small">
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
          全量测速
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
import { ref, onMounted, defineComponent } from "vue";
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
import { getNpmRegistry, setNpmRegistry } from "@render/api";
import axios from "axios";

export interface Registry {
  name: string;
  url: string;
  speed?: number;
}

const message = useMessage();
const loading = ref(false);
const testingAll = ref(false);
const currentRegistry = ref("");

const registries = ref<Registry[]>([
  { name: "npm", url: "https://registry.npmjs.org/" },
  { name: "yarn", url: "https://registry.yarnpkg.com/" },
  { name: "tencent", url: "https://mirrors.cloud.tencent.com/npm/" },
  { name: "npmmirror", url: "https://registry.npmmirror.com/" },
  { name: "taobao", url: "https://registry.npm.taobao.org/" }, // Deprecated but common
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
    message.error("无法获取当前 NPM 源");
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
    message.success(`已切换至 ${item.name} 源`);
  } catch (error) {
    message.error(`切换源失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

const testSpeed = async (item: Registry) => {
  const start = Date.now();
  try {
    // Try to fetch a small package info or just head request
    await axios.get(`${item.url}react`, { timeout: 5000 });
    const end = Date.now();
    item.speed = end - start;
  } catch (error) {
    item.speed = -1; // Error
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

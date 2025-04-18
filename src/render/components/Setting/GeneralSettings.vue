<template>
  <div class="general-settings">
    <!-- 新增主题色切换功能 -->
    <n-flex vertical>
      <n-select
          v-model:value="selectedTheme"
          :options="themeOptions"
          placeholder="选择主题色"
          @update:value="handleThemeChange"
      />
    </n-flex>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import { NFlex, NSelect} from "naive-ui";
import {useThemeStore} from "@render/stores/ThemeStore";

// 定义主题选项
const themeOptions = [
  {label: "亮色", value: "light"},
  {label: "暗色", value: "dark"},
];

const store = useThemeStore();

// 获取当前主题色
const selectedTheme = ref<string>(localStorage.getItem("theme") || "light");

// 主题切换事件处理
const handleThemeChange = (value: string) => {
  localStorage.setItem("theme", value); // 将主题色存储到本地存储
  document.documentElement.setAttribute("data-theme", value); // 动态应用主题色
  window.$message.success(`已切换到 ${value === "light" ? "亮色" : "暗色"} 主题`);
  store.toggleTheme(value)
};
</script>

<style scoped>
.general-settings {
  padding: 10px;
}
</style>
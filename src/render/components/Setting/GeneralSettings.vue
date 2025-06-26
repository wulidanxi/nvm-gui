<template>
  <div class="general-settings">
    <!-- 新增主题色切换功能 -->
    <n-card :bordered="false" size="small">
      <n-form
          label-placement="left"
          label-width="auto"
      >
        <n-form-item label="主题色：">
          <n-select
              v-model:value="selectedTheme"
              :options="themeOptions"
              placeholder="选择主题色"
              @update:value="handleThemeChange"
          />
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {NCard, NFlex, NForm, NFormItem, NSelect} from "naive-ui";
import {useThemeStore} from "@render/stores/ThemeStore";
import {formToJSON} from "axios";

// 定义主题选项
const themeOptions = [
  {label: "亮色", value: "light"},
  {label: "暗色", value: "dark"},
];

const store = useThemeStore();

// 获取当前主题色
const selectedTheme = ref<string>(JSON.parse(localStorage.getItem("theme")).theme || "light");

// 主题切换事件处理
const handleThemeChange = (value: string) => {
  selectedTheme.value = value;
};

const saveSettings = () => {
  // 这里可以添加保存逻辑，例如将当前设置保存到服务器或本地存储
  store.toggleTheme(selectedTheme.value);
};

defineExpose({
  saveSettings
})

</script>

<style scoped>
.general-settings {
  padding: 10px;
}
</style>
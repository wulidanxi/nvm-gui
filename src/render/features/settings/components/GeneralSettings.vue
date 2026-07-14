<template>
  <div class="general-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="left" label-width="auto">
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
import { ref } from 'vue'
import { NCard, NForm, NFormItem, NSelect } from 'naive-ui'
import { useThemeStore } from '@render/stores/ThemeStore'

const store = useThemeStore()
const themeOptions = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
]
const selectedTheme = ref<string>(store.theme || 'light')

/** 预览主题选择，并在保存时持久化最终值。 */
function handleThemeChange(value: string) {
  selectedTheme.value = value
}

function saveSettings() {
  store.toggleTheme(selectedTheme.value)
}

// Parent settings containers call this when the user clicks Save.
defineExpose({
  saveSettings,
})
</script>

<style scoped>
.general-settings {
  padding: 10px;
}
</style>

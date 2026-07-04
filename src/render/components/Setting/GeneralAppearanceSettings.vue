<template>
  <div class="general-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="left" label-width="auto">
        <n-form-item label="外观模式：">
          <n-select
            v-model:value="selectedTheme"
            :options="themeOptions"
            placeholder="选择外观模式"
          />
        </n-form-item>
        <n-form-item label="主题色：">
          <div class="accent-grid">
            <button
              v-for="item in themeAccentOptions"
              :key="item.key"
              class="accent-option"
              :class="{ 'is-active': selectedAccent === item.key }"
              type="button"
              @click="selectedAccent = item.key"
            >
              <span
                class="accent-swatch"
                :style="{ backgroundColor: item.primary }"
              />
              <span class="accent-copy">
                <span class="accent-label">{{ item.label }}</span>
                <span class="accent-value">{{ item.primary }}</span>
              </span>
            </button>
          </div>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NCard, NForm, NFormItem, NSelect } from "naive-ui";
import {
  themeAccentOptions,
  type ThemeAccentKey,
  type ThemeMode,
  useThemeStore,
} from "@render/stores/ThemeStore";

const themeOptions = [
  { label: "亮色", value: "light" },
  { label: "暗色", value: "dark" },
];

const store = useThemeStore();

const selectedTheme = ref<ThemeMode>(store.theme || "light");
const selectedAccent = ref<ThemeAccentKey>(store.accent || "node-green");

watch(() => store.theme, (value) => {
  selectedTheme.value = value;
});

watch(() => store.accent, (value) => {
  selectedAccent.value = value;
});

const saveSettings = () => {
  store.setThemeMode(selectedTheme.value);
  store.setAccent(selectedAccent.value);
};

defineExpose({
  saveSettings,
});
</script>

<style scoped>
.general-settings {
  padding: 10px;
  min-width: 0;
}

.general-settings :deep(.n-form-item-blank) {
  min-width: 0;
}

.accent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.accent-option {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 58px;
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  background: var(--app-surface-raised);
  text-align: left;
  cursor: pointer;
}

.accent-option:hover,
.accent-option.is-active {
  border-color: var(--app-accent-strong);
  background: var(--app-accent-soft);
}

.accent-option.is-active {
  box-shadow: inset 3px 0 0 var(--app-accent);
}

.accent-swatch {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.36),
    0 0 0 4px var(--app-accent-soft);
}

.accent-copy {
  min-width: 0;
}

.accent-label,
.accent-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accent-label {
  font-size: 13px;
  font-weight: 750;
}

.accent-value {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
}

@media (max-width: 760px) {
  .accent-grid {
    grid-template-columns: 1fr;
  }
}
</style>

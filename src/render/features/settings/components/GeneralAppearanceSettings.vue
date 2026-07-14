<template>
  <div class="general-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="top" label-width="auto">
        <n-form-item :label="t('common.language')">
          <n-select
            v-model:value="selectedLocale"
            :options="localeOptions"
          />
        </n-form-item>
        <n-form-item :label="t('appearance.accent')">
          <div class="accent-grid" v-auto-animate="autoAnimateOptions">
            <button
              v-for="item in themeAccentOptions"
              :key="item.key"
              v-motion="tileMotion"
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
        <n-form-item :label="t('appearance.autoUpdate')">
          <n-switch v-model:value="autoCheck" />
        </n-form-item>
        <n-form-item :label="t('appearance.prereleaseUpdate')">
          <n-switch v-model:value="includePrerelease" />
          <span class="setting-hint">{{ t('appearance.prereleaseUpdateHint') }}</span>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NCard, NForm, NFormItem, NSelect, NSwitch } from "naive-ui";
import { localeOptions, useI18n } from "@render/i18n";
import { type AppLocale, useLocaleStore } from "@render/stores/LocaleStore";
import {
  themeAccentOptions,
  type ThemeAccentKey,
  useThemeStore,
} from "@render/stores/ThemeStore";
import { useAppMotion } from "@render/utils/motionPresets";
import { useUpdateStore } from "@render/features/updates/UpdateStore";

const store = useThemeStore();
const localeStore = useLocaleStore();
const updateStore = useUpdateStore();
const { t } = useI18n();
const { autoAnimateOptions, tileMotion } = useAppMotion();

// 表单使用本地草稿，只有点击保存后才写入持久化 Store。
const selectedAccent = ref<ThemeAccentKey>(store.accent || "node-green");
const selectedLocale = ref<AppLocale>(localeStore.locale);
const autoCheck = ref(updateStore.autoCheck);
const includePrerelease = ref(updateStore.includePrerelease);

watch(() => store.accent, (value) => {
  selectedAccent.value = value;
});

watch(() => localeStore.locale, (value) => {
  selectedLocale.value = value;
});

/** 将外观、语言和更新偏好作为一个设置单元提交。 */
const saveSettings = () => {
  store.setAccent(selectedAccent.value);
  localeStore.setLocale(selectedLocale.value);
  updateStore.setAutoCheck(autoCheck.value);
  updateStore.setIncludePrerelease(includePrerelease.value);
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

.general-settings :deep(.n-form-item-label) {
  min-width: 0;
  line-height: 1.35;
  white-space: normal;
}

.setting-hint {
  margin-left: 10px;
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.accent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
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
}

.accent-label {
  font-size: 13px;
  font-weight: 750;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.accent-value {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .accent-grid {
    grid-template-columns: 1fr;
  }
}
</style>

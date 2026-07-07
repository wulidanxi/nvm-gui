<template>
  <div class="general-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="top" label-width="auto">
        <n-form-item :label="t('appearance.mode')">
          <n-select
            v-model:value="selectedTheme"
            :options="themeOptions"
            :placeholder="t('appearance.modePlaceholder')"
          />
        </n-form-item>
        <n-form-item :label="t('common.language')">
          <n-select
            v-model:value="selectedLocale"
            :options="localeOptions"
          />
        </n-form-item>
        <n-form-item :label="t('appearance.accent')">
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
import { computed, ref, watch } from "vue";
import { NCard, NForm, NFormItem, NSelect } from "naive-ui";
import { localeOptions, useI18n } from "@render/i18n";
import { type AppLocale, useLocaleStore } from "@render/stores/LocaleStore";
import {
  themeAccentOptions,
  type ThemeAccentKey,
  type ThemeMode,
  useThemeStore,
} from "@render/stores/ThemeStore";

const store = useThemeStore();
const localeStore = useLocaleStore();
const { t } = useI18n();

const themeOptions = computed(() => [
  { label: t("appearance.light"), value: "light" },
  { label: t("appearance.dark"), value: "dark" },
]);

const selectedTheme = ref<ThemeMode>(store.theme || "light");
const selectedAccent = ref<ThemeAccentKey>(store.accent || "node-green");
const selectedLocale = ref<AppLocale>(localeStore.locale);

watch(() => store.theme, (value) => {
  selectedTheme.value = value;
});

watch(() => store.accent, (value) => {
  selectedAccent.value = value;
});

watch(() => localeStore.locale, (value) => {
  selectedLocale.value = value;
});

const saveSettings = () => {
  store.setThemeMode(selectedTheme.value);
  store.setAccent(selectedAccent.value);
  localeStore.setLocale(selectedLocale.value);
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

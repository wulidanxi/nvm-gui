<template>
  <div class="advanced-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="left" :label-width="140">
        <n-form-item :label="t('advanced.nodeSource')">
          <n-input
            v-model:value="nodejsUrl"
            :placeholder="t('advanced.nodeSourcePlaceholder')"
            @blur="validateUrl"
          />
        </n-form-item>
        <n-form-item :label="t('advanced.cacheHours')">
          <div class="cache-setting">
            <n-input-number
              v-model:value="cacheHours"
              class="cache-hours-input"
              :min="0"
              :max="168"
              :step="1"
            />
            <span class="setting-hint">{{ t('advanced.cacheHoursHint') }}</span>
          </div>
        </n-form-item>
        <n-message-provider>
          <n-dialog-provider>
            <useMessageComponents />
          </n-dialog-provider>
        </n-message-provider>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NDialogProvider, NForm, NFormItem, NInput, NInputNumber, NMessageProvider } from 'naive-ui'
import useMessageComponents from '@render/components/useMessageComponents.vue'
import { useI18n } from '@render/i18n'
import { useNodeURLStore } from '@render/stores/NodeURLStore'

const store = useNodeURLStore()
const nodejsUrl = ref<string>(store.nodeUrl)
const cacheHours = ref<number>(store.cacheHours)
const message = window.$message
const { t } = useI18n()

// Keep invalid release sources out of the persisted store.
/** 验证发布索引必须是可解析的 HTTP(S) 地址。 */
function validateUrl() {
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

  if (urlPattern.test(nodejsUrl.value))
    return

  message.error(t('advanced.invalidUrl'))
  nodejsUrl.value = store.nodeUrl
}

/** 验证通过后一次性保存数据源和缓存时长。 */
function saveSettings() {
  store.toggleNodeUrl(nodejsUrl.value)
  store.setCacheHours(Math.min(168, Math.max(0, Math.round(cacheHours.value ?? 24))))
}

// Parent settings containers call this when the user clicks Save.
defineExpose({
  saveSettings,
})
</script>

<style scoped>
.advanced-settings {
  padding: 10px;
  min-width: 0;
}

.advanced-settings :deep(.n-form-item-blank) {
  min-width: 0;
}

.cache-setting {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.cache-hours-input {
  width: 140px;
  max-width: 100%;
}

.setting-hint {
  color: var(--app-text-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>

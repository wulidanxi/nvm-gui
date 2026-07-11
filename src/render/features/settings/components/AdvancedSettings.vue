<template>
  <div class="advanced-settings">
    <n-card :bordered="false" size="small">
      <n-form label-placement="left" label-width="auto">
        <n-form-item :label="t('advanced.nodeSource')">
          <n-input
            v-model:value="nodejsUrl"
            :placeholder="t('advanced.nodeSourcePlaceholder')"
            @blur="validateUrl"
          />
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
import { NCard, NDialogProvider, NForm, NFormItem, NInput, NMessageProvider } from 'naive-ui'
import useMessageComponents from '@render/components/useMessageComponents.vue'
import { useI18n } from '@render/i18n'
import { useNodeURLStore } from '@render/stores/NodeURLStore'

const store = useNodeURLStore()
const nodejsUrl = ref<string>(store.nodeUrl)
const message = window.$message
const { t } = useI18n()

// Keep invalid release sources out of the persisted store.
function validateUrl() {
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

  if (urlPattern.test(nodejsUrl.value))
    return

  message.error(t('advanced.invalidUrl'))
  nodejsUrl.value = store.nodeUrl
}

function saveSettings() {
  store.toggleNodeUrl(nodejsUrl.value)
}

// Parent settings containers call this when the user clicks Save.
defineExpose({
  saveSettings,
})
</script>

<style scoped>
.advanced-settings {
  padding: 10px;
}
</style>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { useDialog, useMessage } from 'naive-ui'
import type { CommandLogCategory, CommandLogEntry, CommandLogStatus } from '@common/types'
import { clearCommandLogs, exportCommandLogs, listCommandLogs, removeCommandLog } from '@render/api'
import { useI18n } from '@render/i18n'
import { useAppMotion } from '@render/utils/motionPresets'
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZES } from '@render/utils/tablePagination'

const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()
const { autoAnimateOptions, cardMotion, controlMotion, headingMotion } = useAppMotion()
const entries = ref<CommandLogEntry[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_TABLE_PAGE_SIZE)
const loading = ref(false)
const search = ref('')
const status = ref<CommandLogStatus | undefined>()
const category = ref<CommandLogCategory | undefined>()
const selected = ref<CommandLogEntry | null>(null)
const categoryOptions = computed(() => [
  { label: t('commandLog.categoryNvm'), value: 'nvm' },
  { label: t('commandLog.categoryNpm'), value: 'npm' },
  { label: t('commandLog.categoryManager'), value: 'nvm-manager' },
  { label: t('commandLog.categoryRelease'), value: 'release' },
  { label: t('commandLog.categorySystem'), value: 'system' },
])
const drawerVisible = computed({
  get: () => Boolean(selected.value),
  set: (value) => {
    if (!value)
      selected.value = null
  },
})

const columns = computed<DataTableColumns<CommandLogEntry>>(() => [
  { title: t('commandLog.time'), key: 'timestamp', width: 176, render: row => new Date(row.timestamp).toLocaleString() },
  { title: t('commandLog.operation'), key: 'operation', minWidth: 130 },
  { title: t('commandLog.category'), key: 'category', width: 120, render: row => categoryOptions.value.find(item => item.value === row.category)?.label || row.category },
  { title: t('commandLog.command'), key: 'command', minWidth: 170, render: row => [row.command, ...row.args].join(' ') },
  { title: t('commandLog.result'), key: 'status', width: 92, render: row => h('span', { class: row.status === 'success' ? 'result-success' : 'result-error' }, row.status === 'success' ? t('common.success') : t('commandLog.failed')) },
  { title: t('commandLog.duration'), key: 'durationMs', width: 92, render: row => `${row.durationMs} ms` },
  { title: t('common.action'), key: 'action', width: 92, render: row => h('button', { class: 'log-link', onClick: () => selected.value = row }, t('commandLog.details')) },
])

async function load() {
  loading.value = true
  try {
    const data = await listCommandLogs({ page: page.value, pageSize: pageSize.value, status: status.value, category: category.value, search: search.value })
    entries.value = data.items
    total.value = data.total
  } catch (error) {
    message.error(String(error))
  } finally {
    loading.value = false
  }
}

async function clearLogs() {
  dialog.warning({
    title: t('commandLog.clearTitle'), content: t('commandLog.clearConfirm'),
    positiveText: t('commandLog.clear'), negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await clearCommandLogs()
      page.value = 1
      await load()
    },
  })
}

async function exportLogs() {
  const path = await exportCommandLogs()
  if (path) message.success(t('commandLog.exported'))
}

async function changePageSize() {
  page.value = 1
  await load()
}

async function deleteSelected() {
  if (!selected.value) return
  await removeCommandLog(selected.value.id)
  selected.value = null
  await load()
}

function copyOutput() {
  if (selected.value) navigator.clipboard.writeText(selected.value.output).then(() => message.success(t('commandLog.copied')))
}

onMounted(load)
</script>

<template>
  <div class="app-page command-log-page">
    <div class="page-heading" v-motion="headingMotion">
      <div>
        <div class="page-kicker">{{ t('commandLog.kicker') }}</div>
        <h1 class="page-title">{{ t('commandLog.title') }}</h1>
        <div class="page-description">{{ t('commandLog.description') }}</div>
      </div>
      <n-space>
        <n-button v-motion="controlMotion" @click="exportLogs">{{ t('commandLog.export') }}</n-button>
        <n-button v-motion="controlMotion" type="error" secondary @click="clearLogs">{{ t('commandLog.clear') }}</n-button>
      </n-space>
    </div>
    <div class="page-scroll-body table-page-body" v-auto-animate="autoAnimateOptions">
      <n-card v-motion="cardMotion" class="panel-card table-panel-card" :bordered="false">
        <div class="table-panel-filters command-log-filters">
          <n-input class="table-panel-search" v-model:value="search" clearable :placeholder="t('commandLog.search')" @keyup.enter="page = 1; load()" />
          <n-select class="filter-status" v-model:value="status" clearable :options="[{ label: t('common.success'), value: 'success' }, { label: t('commandLog.failed'), value: 'error' }]" :placeholder="t('commandLog.allResults')" @update:value="page = 1; load()" />
          <n-select class="filter-category" v-model:value="category" clearable :options="categoryOptions" :placeholder="t('commandLog.allCategories')" @update:value="page = 1; load()" />
          <n-button @click="page = 1; load()">{{ t('common.refresh') }}</n-button>
        </div>
        <n-data-table flex-height :columns="columns" :data="entries" :loading="loading" :row-key="row => row.id" />
        <div class="table-panel-pagination">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            show-size-picker
            :page-sizes="TABLE_PAGE_SIZES"
            :item-count="total"
            @update:page="load"
            @update:page-size="changePageSize"
          />
        </div>
      </n-card>
    </div>
    <n-drawer v-model:show="drawerVisible" :width="620" placement="right">
      <n-drawer-content :title="selected?.operation">
        <n-space vertical>
          <n-descriptions v-if="selected" :column="1" bordered size="small">
            <n-descriptions-item :label="t('commandLog.time')">{{ new Date(selected.timestamp).toLocaleString() }}</n-descriptions-item>
            <n-descriptions-item :label="t('commandLog.command')">{{ [selected.command, ...selected.args].join(' ') }}</n-descriptions-item>
            <n-descriptions-item :label="t('commandLog.category')">{{ categoryOptions.find(item => item.value === selected?.category)?.label }}</n-descriptions-item>
            <n-descriptions-item :label="t('commandLog.duration')">{{ selected.durationMs }} ms</n-descriptions-item>
          </n-descriptions>
          <pre v-if="selected" class="log-output">{{ selected.output || '-' }}</pre>
          <n-space justify="end"><n-button @click="copyOutput">{{ t('commandLog.copy') }}</n-button><n-button type="error" secondary @click="deleteSelected">{{ t('commandLog.remove') }}</n-button></n-space>
        </n-space>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.command-log-page { gap: 0; }
.command-log-filters { grid-template-columns: minmax(200px, 1fr) 150px 160px max-content; }
.filter-status { width: 100%; min-width: 0; }
.result-success { color: var(--app-success); }.result-error { color: var(--app-error); }
.log-link { border: 0; color: var(--app-accent); background: transparent; cursor: pointer; }
.log-output { max-height: 62vh; margin: 0; padding: 12px; overflow: auto; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface-raised); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }

@media (max-width: 760px) {
  .command-log-filters { grid-template-columns: minmax(0, 1fr) 150px; }
  .command-log-filters > :deep(.n-button) { grid-column: 1 / -1; justify-self: start; }
}

@media (max-width: 520px) {
  .command-log-filters { grid-template-columns: minmax(0, 1fr); }
  .command-log-filters > :deep(.n-button) { grid-column: auto; }
}
</style>

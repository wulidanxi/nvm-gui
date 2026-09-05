<script setup lang="ts">
import { createTimeline } from 'animejs'
import { computed, nextTick, ref, watch } from 'vue'
import type { Component } from 'vue'
import {
  CheckmarkCircleOutline,
  CloseCircleOutline,
  CloudDownloadOutline,
  SwapHorizontalOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { useI18n } from '@render/i18n'
import type { I18nKey } from '@render/i18n'
import type {
  NvmOperationKind,
  NvmOperationPhase,
  NvmOperationState,
} from './useNvmOperations'
import { useAppMotion } from '@render/utils/motionPresets'
import { useAnimeScope } from '@render/utils/useAnimeScope'

const props = defineProps<{
  state: NvmOperationState | null
}>()

const { t } = useI18n()
const {
  autoAnimateOptions,
  feedbackMotion,
} = useAppMotion()

// 操作种类和阶段共同决定文案，映射由类型系统保证完整。
const titleKeys = {
  install: {
    running: 'operation.installRunning',
    success: 'operation.installSuccess',
    error: 'operation.installError',
  },
  use: {
    running: 'operation.useRunning',
    success: 'operation.useSuccess',
    error: 'operation.useError',
  },
  uninstall: {
    running: 'operation.uninstallRunning',
    success: 'operation.uninstallSuccess',
    error: 'operation.uninstallError',
  },
} as const satisfies Record<NvmOperationKind, Record<NvmOperationPhase, I18nKey>>

const runningIcons = {
  install: CloudDownloadOutline,
  use: SwapHorizontalOutline,
  uninstall: TrashOutline,
} as const satisfies Record<NvmOperationKind, Component>

const operation = computed(() => props.state)
const feedbackRoot = ref<HTMLElement | null>(null)
const feedbackAnimation = useAnimeScope(feedbackRoot)

/** 每次操作阶段变化时重建短时间线，确保连续操作不会遗留旧动画状态。 */
function playFeedbackAnimation() {
  const current = operation.value
  if (!current) {
    feedbackAnimation.revert()
    return
  }

  feedbackAnimation.play(() => {
    const root = feedbackRoot.value
    if (!root) return

    const timeline = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(root, { opacity: [0, 1], y: [8, 0], duration: 380 })
      .add('.operation-feedback-icon', { opacity: [0, 1], scale: [0.88, 1], duration: 420 }, '-=250')
      .add('.operation-feedback-title', { opacity: [0, 1], x: [-6, 0], duration: 360 }, '-=310')
      .add('.operation-feedback-description', { opacity: [0, 1], x: [-5, 0], duration: 390 }, '-=300')

    if (current.phase === 'success') {
      timeline.add(
        '.operation-feedback-icon',
        { scale: [1, 1.08, 1], duration: 520, ease: 'out(4)' },
        '-=180',
      )
    } else if (current.phase === 'error') {
      timeline.add(
        '.operation-feedback-icon',
        { x: [0, -3, 3, -2, 0], duration: 420, ease: 'inOut(2)' },
        '-=190',
      )
    }
  })
}

watch(
  () => props.state ? `${props.state.kind}:${props.state.phase}:${props.state.version}` : '',
  () => nextTick(playFeedbackAnimation),
  { immediate: true, flush: 'post' },
)

/** 根据阶段选择业务图标或结果图标。 */
const statusIcon = computed<Component>(() => {
  const current = operation.value
  if (!current) return CloudDownloadOutline
  if (current.phase === 'success') return CheckmarkCircleOutline
  if (current.phase === 'error') return CloseCircleOutline
  return runningIcons[current.kind]
})

const title = computed(() => {
  const current = operation.value
  if (!current) return ''

  return t(titleKeys[current.kind][current.phase], {
    version: current.version,
  })
})

/** 失败时展示主进程返回的具体原因，其余阶段使用简短提示。 */
const description = computed(() => {
  const current = operation.value
  if (!current) return ''
  if (current.phase === 'running') return t('operation.runningHint')
  if (current.phase === 'success') return t('operation.successHint')

  return t('operation.errorDetail', {
    message: current.message || t('common.failedUnknown'),
  })
})
</script>

<template>
  <aside
    v-if="operation"
    ref="feedbackRoot"
    v-motion="feedbackMotion"
    class="operation-feedback"
    :class="`is-${operation.phase}`"
    role="status"
    aria-live="polite"
  >
    <div class="operation-feedback-icon">
      <n-icon size="22">
        <component :is="statusIcon" />
      </n-icon>
    </div>

    <div class="operation-feedback-copy" v-auto-animate="autoAnimateOptions">
      <div class="operation-feedback-title">
        {{ title }}
      </div>
      <div class="operation-feedback-description">
        {{ description }}
      </div>

      <div
        v-if="operation.phase === 'running'"
        class="operation-feedback-progress"
        aria-hidden="true"
      >
        <span />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.operation-feedback {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 72px;
  max-height: 180px;
  margin-bottom: 14px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid var(--app-accent-strong);
  border-radius: 8px;
  color: var(--app-text);
  background:
    linear-gradient(120deg, var(--app-accent-soft), transparent 64%),
    var(--app-surface);
  box-shadow: var(--app-shadow);
}

.operation-feedback::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--app-accent);
  content: "";
}

.operation-feedback.is-error {
  border-color: rgba(224, 49, 49, 0.28);
  background:
    linear-gradient(120deg, rgba(224, 49, 49, 0.12), transparent 64%),
    var(--app-surface);
}

.operation-feedback.is-error::before {
  background: #e03131;
}

.operation-feedback-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  color: var(--app-accent);
  background: var(--app-accent-soft);
}

.operation-feedback.is-error .operation-feedback-icon {
  color: #e03131;
  background: rgba(224, 49, 49, 0.12);
}

.operation-feedback-title {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 800;
}

.operation-feedback-description {
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.operation-feedback-progress {
  position: relative;
  height: 3px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-accent-soft);
}

.operation-feedback-progress span {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--app-accent);
  width: 42%;
  animation: operation-progress-slide 1150ms var(--motion-ease-standard) infinite;
}

@keyframes operation-progress-slide {
  from {
    transform: translateX(-120%);
  }

  to {
    transform: translateX(260%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .operation-feedback-progress span {
    animation: none !important;
  }

  .operation-feedback-progress span {
    width: 100%;
  }
}
</style>

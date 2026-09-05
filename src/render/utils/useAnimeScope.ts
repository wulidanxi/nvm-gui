import { createScope } from 'animejs'
import type { Scope } from 'animejs'
import { onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

type AnimeScopeSetup = (scope: Scope) => void

/**
 * 将 Anime.js 实例限制在组件根节点内，并在重复播放或组件卸载时恢复内联样式。
 */
export function useAnimeScope(root: Ref<HTMLElement | null>) {
  let scope: Scope | null = null

  function play(setup: AnimeScopeSetup) {
    scope?.revert()
    scope = null

    if (!root.value) return

    const nextScope = createScope({
      root: root.value,
      mediaQueries: {
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
    })
    scope = nextScope
    nextScope.add(() => {
      if (!nextScope.matches.reduceMotion) setup(nextScope)
    })
  }

  function revert() {
    scope?.revert()
    scope = null
  }

  onBeforeUnmount(revert)

  return { play, revert }
}

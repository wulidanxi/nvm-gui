// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { useLocaleStore } from '@render/stores/LocaleStore'
import SettingsPage from './SettingsPage.vue'

const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
})
const SlotStub = defineComponent({ template: '<span><slot /></span>' })

describe('SettingsPage section routing', () => {
  beforeEach(() => {
    window.matchMedia = createMatchMediaStub()
  })

  it('opens a valid section directly and follows browser navigation', async () => {
    const { wrapper, router } = await mountSettings('/setting?section=project')

    expect(activeSectionText(wrapper)).toContain('项目检测')

    await router.push('/setting?section=nvm-manager')
    await nextTick()
    expect(activeSectionText(wrapper)).toContain('NVM 管理器')

    await router.push('/setting?section=unknown')
    await nextTick()
    expect(activeSectionText(wrapper)).toContain('通用')
  })

  it('updates the route query when a settings category is selected', async () => {
    const { wrapper, router } = await mountSettings('/setting')
    const advanced = wrapper.findAll('.settings-nav-item')
      .find(item => item.text().includes('高级'))

    expect(advanced).toBeDefined()
    await advanced!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.section).toBe('advanced')
    expect(activeSectionText(wrapper)).toContain('高级')
  })
})

async function mountSettings(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useLocaleStore().setLocale('zh-CN')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/setting', component: SettingsPage }],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = shallowMount(SettingsPage, {
    global: {
      plugins: [pinia, router],
      directives: {
        motion: () => undefined,
        'auto-animate': () => undefined,
      },
      stubs: {
        NButton: ButtonStub,
        NIcon: SlotStub,
        NTag: SlotStub,
      },
    },
  })

  return { wrapper, router }
}

function activeSectionText(wrapper: ReturnType<typeof shallowMount>) {
  return wrapper.find('.settings-nav-item.is-active').text()
}

function createMatchMediaStub(): typeof window.matchMedia {
  return vi.fn((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  }))
}

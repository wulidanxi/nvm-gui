// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useLocaleStore } from '@render/stores/LocaleStore'
import DashboardPage from './DashboardPage.vue'

const apiMocks = vi.hoisted(() => ({
  currentNvmManagerVersion: vi.fn(),
  nvmCurrent: vi.fn(),
  nvmVersion: vi.fn(),
}))
const routerPush = vi.hoisted(() => vi.fn())

vi.mock('@render/api', () => apiMocks)
vi.mock('@render/api/desktop', () => ({ desktopApi: { system: {} } }))
vi.mock('vue-router', async importOriginal => ({
  ...await importOriginal<typeof import('vue-router')>(),
  useRouter: () => ({ push: routerPush }),
}))

const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot name="icon" /><slot /></button>',
})
const CardStub = defineComponent({
  props: { title: String },
  template: '<section><h2>{{ title }}</h2><slot /></section>',
})
const SlotStub = defineComponent({ template: '<span><slot /></span>' })

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.matchMedia = createMatchMediaStub()
    apiMocks.nvmVersion.mockResolvedValue('1.2.1')
  })

  it('shows a checking state without a recovery action while runtime detection is pending', () => {
    apiMocks.nvmCurrent.mockReturnValue(new Promise(() => {}))
    apiMocks.currentNvmManagerVersion.mockReturnValue(new Promise(() => {}))

    const wrapper = mountDashboard()

    expect(wrapper.text()).toContain('正在检测 Node 与 NVM 环境')
    expect(wrapper.find('.hero-status button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('prioritizes the NVM recovery action when the manager is not detected', async () => {
    apiMocks.nvmCurrent.mockResolvedValue('v24.18.0')
    apiMocks.currentNvmManagerVersion.mockRejectedValue(new Error('missing'))

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('需要先安装或配置 NVM 管理器')
    const action = wrapper.find('.hero-status button')
    expect(action.text()).toBe('配置 NVM 管理器')
    await action.trigger('click')
    expect(routerPush).toHaveBeenCalledWith({
      path: '/setting',
      query: { section: 'nvm-manager' },
    })
  })

  it('guides users to local versions when NVM is ready but no Node is active', async () => {
    apiMocks.nvmCurrent.mockRejectedValue(new Error('inactive'))
    apiMocks.currentNvmManagerVersion.mockResolvedValue('1.2.1')

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('当前没有激活的 Node 版本')
    const action = wrapper.find('.hero-status button')
    expect(action.text()).toBe('管理本地版本')
    await action.trigger('click')
    expect(routerPush).toHaveBeenCalledWith('/local')
  })

  it('keeps the ready state focused and routes all quick actions correctly', async () => {
    apiMocks.nvmCurrent.mockResolvedValue('v24.18.0')
    apiMocks.currentNvmManagerVersion.mockResolvedValue('1.2.1')

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('当前 Node 环境已就绪')
    expect(wrapper.text()).not.toContain('环境健康')
    expect(wrapper.find('.hero-status button').exists()).toBe(false)

    const actions = wrapper.findAll('.action-tile')
    expect(actions).toHaveLength(4)
    for (const action of actions) await action.trigger('click')

    expect(routerPush.mock.calls.map(call => call[0])).toEqual([
      '/local',
      '/available',
      { path: '/setting', query: { section: 'project' } },
      { path: '/setting', query: { section: 'nvm-manager' } },
    ])
  })
})

function mountDashboard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useLocaleStore().setLocale('zh-CN')

  return mount(DashboardPage, {
    global: {
      plugins: [pinia],
      directives: {
        motion: () => undefined,
        'auto-animate': () => undefined,
      },
      stubs: {
        NButton: ButtonStub,
        NCard: CardStub,
        NIcon: SlotStub,
        NTag: SlotStub,
      },
    },
  })
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

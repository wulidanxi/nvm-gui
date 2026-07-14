// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useLocaleStore } from '@render/stores/LocaleStore'
import DashboardPage from './DashboardPage.vue'

const apiMocks = vi.hoisted(() => ({
  currentNvmManagerVersion: vi.fn(),
  getCommandLogStatistics: vi.fn(),
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
  template: '<section><h2>{{ title }}</h2><slot name="header-extra" /><slot /></section>',
})
const SlotStub = defineComponent({ template: '<span><slot /></span>' })

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.matchMedia = createMatchMediaStub()
    apiMocks.nvmVersion.mockResolvedValue('1.2.1')
    apiMocks.getCommandLogStatistics.mockResolvedValue(emptyStatistics())
  })

  it('shows a checking state without a recovery action while runtime detection is pending', () => {
    apiMocks.nvmCurrent.mockReturnValue(new Promise(() => {}))
    apiMocks.currentNvmManagerVersion.mockReturnValue(new Promise(() => {}))

    const wrapper = mountDashboard()

    expect(wrapper.text()).toContain('正在检测 Node 与 NVM 环境')
    expect(wrapper.find('.hero-status button').exists()).toBe(false)
    expect(wrapper.find('.statistics-state').text()).toContain('检测中')
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

  it('renders five metrics, a seven-day trend, and routes to command logs', async () => {
    apiMocks.nvmCurrent.mockResolvedValue('v24.18.0')
    apiMocks.currentNvmManagerVersion.mockResolvedValue('1.2.1')
    apiMocks.getCommandLogStatistics.mockResolvedValue({
      ...emptyStatistics(),
      total: 8,
      successRate: 87.5,
      averageDurationMs: 1250,
      switchCount: 3,
      installCount: 2,
      uninstallCount: 1,
      daily: emptyStatistics().daily.map((day, index) => index === 6 ? { ...day, success: 6, error: 1 } : day),
    })

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.findAll('.statistics-metric')).toHaveLength(5)
    expect(wrapper.text()).toContain('87.5%')
    expect(wrapper.text()).toContain('1.3 s')
    expect(wrapper.text()).toContain('2 / 1')
    expect(wrapper.findAll('.trend-column')).toHaveLength(7)
    expect(wrapper.findAll('.trend-y-tick').map(tick => tick.text())).toEqual(['7', '4', '0'])
    const refreshButton = wrapper.findAll('button').find(button => button.text() === '刷新')
    const logsButton = wrapper.findAll('button').find(button => button.text() === '查看日志')
    expect(refreshButton).toBeDefined()
    expect(logsButton).toBeDefined()
    await refreshButton!.trigger('click')
    await flushPromises()
    expect(apiMocks.getCommandLogStatistics).toHaveBeenCalledTimes(2)
    await logsButton!.trigger('click')
    expect(routerPush).toHaveBeenCalledWith('/logs')
  })

  it('shows an empty baseline when no operations were recorded', async () => {
    apiMocks.nvmCurrent.mockResolvedValue('v24.18.0')
    apiMocks.currentNvmManagerVersion.mockResolvedValue('1.2.1')

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('近 7 天还没有操作记录')
    expect(wrapper.findAll('.trend-column')).toHaveLength(7)
    expect(wrapper.findAll('.trend-y-tick').map(tick => tick.text())).toEqual(['0'])
  })

  it('keeps the dashboard usable when statistics fail and retries independently', async () => {
    apiMocks.nvmCurrent.mockResolvedValue('v24.18.0')
    apiMocks.currentNvmManagerVersion.mockResolvedValue('1.2.1')
    apiMocks.getCommandLogStatistics
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce(emptyStatistics())

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('统计数据暂时无法读取')
    expect(wrapper.text()).toContain('当前 Node 环境已就绪')
    await wrapper.find('.statistics-error button').trigger('click')
    await flushPromises()
    expect(apiMocks.getCommandLogStatistics).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('近 7 天还没有操作记录')
  })
})

function emptyStatistics() {
  return {
    from: '2026-07-08',
    to: '2026-07-14',
    total: 0,
    successRate: null,
    averageDurationMs: null,
    switchCount: 0,
    installCount: 0,
    uninstallCount: 0,
    daily: Array.from({ length: 7 }, (_, index) => ({
      date: `2026-07-${String(index + 8).padStart(2, '0')}`,
      success: 0,
      error: 0,
    })),
  }
}

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

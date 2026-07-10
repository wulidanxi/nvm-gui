import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const requireConfig = createRequire(import.meta.url)
const configPath = requireConfig.resolve('../../electron-builder.config.js')

describe('electron-builder config', () => {
  it('includes the embedded nvm-windows installer only for Windows builds', () => {
    expect(loadConfigForTarget('win').extraResources).toEqual([
      {
        from: 'resources/nvm-windows/nvm-setup.exe',
        to: 'nvm-manager/nvm-setup.exe',
        filter: ['**/*'],
      },
    ])

    expect(loadConfigForTarget('mac').extraResources).toEqual([])
    expect(loadConfigForTarget('linux').extraResources).toEqual([])
  })

  it('declares macOS and Linux package targets', () => {
    const config = loadConfigForTarget('linux')
    expect(config.mac).toMatchObject({
      target: ['dmg', 'zip'],
      category: 'public.app-category.developer-tools',
      identity: null,
    })
    expect(config.linux).toMatchObject({
      target: ['AppImage', 'deb'],
      category: 'Development',
      maintainer: 'wulidanxi <wulidanxi@gmail.com>',
    })
  })

  it('runs the Windows application as the invoking user', () => {
    expect(loadConfigForTarget('win').win.requestedExecutionLevel).toBe('asInvoker')
    expect(loadConfigForTarget('win').buildVersion).toBe('0.0.13.0')
  })
})

function loadConfigForTarget(target: string): any {
  const previousTarget = process.env.NVM_GUI_BUILD_TARGET
  process.env.NVM_GUI_BUILD_TARGET = target
  delete requireConfig.cache[configPath]

  try {
    return requireConfig(configPath)
  }
  finally {
    delete requireConfig.cache[configPath]
    if (previousTarget === undefined)
      delete process.env.NVM_GUI_BUILD_TARGET
    else
      process.env.NVM_GUI_BUILD_TARGET = previousTarget
  }
}

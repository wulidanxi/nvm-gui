import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const requireConfig = createRequire(import.meta.url)
const configPath = requireConfig.resolve('../../electron-builder.config.js')

describe('electron-builder config', () => {
  it('includes legal notices in every package and the NVM installer only for Windows builds', () => {
    expect(loadConfigForTarget('win').extraResources).toEqual([
      {
        from: 'LICENSE',
        to: 'licenses/LICENSE',
        filter: ['**/*'],
      },
      {
        from: 'THIRD_PARTY_NOTICES.md',
        to: 'licenses/THIRD_PARTY_NOTICES.md',
        filter: ['**/*'],
      },
      {
        from: 'resources/nvm-windows/nvm-setup.exe',
        to: 'nvm-manager/nvm-setup.exe',
        filter: ['**/*'],
      },
    ])

    const legalNoticeResources = [
      {
        from: 'LICENSE',
        to: 'licenses/LICENSE',
        filter: ['**/*'],
      },
      {
        from: 'THIRD_PARTY_NOTICES.md',
        to: 'licenses/THIRD_PARTY_NOTICES.md',
        filter: ['**/*'],
      },
    ]
    expect(loadConfigForTarget('mac').extraResources).toEqual(legalNoticeResources)
    expect(loadConfigForTarget('linux').extraResources).toEqual(legalNoticeResources)
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
    const config = loadConfigForTarget('win')
    expect(config.win.requestedExecutionLevel).toBe('asInvoker')
    expect(config.buildVersion).toBe('0.0.18.4')
    // eslint-disable-next-line no-template-curly-in-string
    expect(config.nsis.artifactName).toBe('${productName}-Setup-${version}.${ext}')
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

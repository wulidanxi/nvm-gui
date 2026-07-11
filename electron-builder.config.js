/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const buildTarget = process.env.NVM_GUI_BUILD_TARGET || platformToTarget(process.platform)

const windowsExtraResources = [
  {
    from: 'resources/nvm-windows/nvm-setup.exe',
    to: 'nvm-manager/nvm-setup.exe',
    filter: ['**/*'],
  },
]

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

const config = {
  directories: {
    output: 'dist/electron',
  },
  appId: 'com.nvm-sh.cn',
  buildVersion: '0.0.15.0',
  win: {
    icon: './nvm-logo-color-avatar.png',
    requestedExecutionLevel: 'asInvoker',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.developer-tools',
    identity: null,
  },
  linux: {
    icon: './nvm-logo-color-avatar.png',
    target: ['AppImage', 'deb'],
    category: 'Development',
    maintainer: 'wulidanxi <wulidanxi@gmail.com>',
  },
  publish: [
    {
      provider: 'github',
      owner: 'wulidanxi',
      repo: 'nvm-gui',
      releaseType: 'release',
    },
  ],
  npmRebuild: false,

  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/render/**/*'],
  extraResources: buildTarget === 'win'
    ? [...legalNoticeResources, ...windowsExtraResources]
    : legalNoticeResources,
}

module.exports = config

function platformToTarget(platform) {
  if (platform === 'win32')
    return 'win'
  if (platform === 'darwin')
    return 'mac'
  if (platform === 'linux')
    return 'linux'
  return platform
}

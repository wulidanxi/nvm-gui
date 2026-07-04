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

const config = {
  directories: {
    output: 'dist/electron',
  },
  appId: 'com.nvm-sh.cn',
  win: {
    icon: './nvm-logo-color-avatar.png',
    requestedExecutionLevel: 'requireAdministrator',
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
  },
  publish: null,
  npmRebuild: false,

  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/render/**/*'],
  extraResources: buildTarget === 'win' ? windowsExtraResources : [],
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

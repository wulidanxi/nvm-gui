/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  directories: {
    output: "dist/electron",
  },
  appId: "com.nvm-sh.cn",
  win: {
    icon: "./nvm-logo-color-avatar.png", //"./nvm-logo-color.ico",
    requestedExecutionLevel: "requireAdministrator",
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  publish: null,
  npmRebuild: false,

  files: ["dist/main/**/*", "dist/preload/**/*", "dist/render/**/*"],
};

module.exports = config;

import { ipcInstance } from '@render/plugins';

export function sendMsgToMainProcess(msg: string) {
  return ipcInstance.send<string>('send-msg', msg);
}

/**
 * @deprecated Use specific nvm* methods instead
 */
export function executeCmd(cmd: string) {
  // 增加命令校验逻辑
  if (!cmd.startsWith('nvm ')) {
    throw new Error('仅允许执行nvm相关的命令');
  }
  return ipcInstance.send<string>('runCmd', cmd);
}

export function nvmList() {
  return ipcInstance.send<string>('nvm-list');
}

export function nvmUse(version: string) {
  return ipcInstance.send<string>('nvm-use', version);
}

export function nvmInstall(version: string) {
  return ipcInstance.send<string>('nvm-install', version);
}

export function nvmUninstall(version: string) {
  return ipcInstance.send<string>('nvm-uninstall', version);
}

export function getNpmRegistry() {
  return ipcInstance.send<string>('npm-get-registry');
}

export function setNpmRegistry(registry: string) {
  return ipcInstance.send<string>('npm-set-registry', registry);
}

export function listGlobalPackages() {
  return ipcInstance.send<string>('npm-list-global');
}

export function installGlobalPackage(pkg: string) {
  return ipcInstance.send<string>('npm-install-global', pkg);
}

export function openDirectoryDialog() {
  return ipcInstance.send<string | null>('open-directory-dialog');
}

export function checkNvmrc(path: string) {
  return ipcInstance.send<string | null>('check-nvmrc', path);
}


export function openUrl(url: string) { 
  return ipcInstance.send('openUrl', url);
}

// 安全执行封装 - 重构为使用新的 IPC 接口
export async function executeNvmSafely(
    command: string,
    version: string
): Promise<string> {
  // 版本号简单校验
  if (!version || !/^v?\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`非法输入: ${version}`);
  }

  switch (command) {
    case 'install':
      return nvmInstall(version);
    case 'use':
      return nvmUse(version);
    case 'uninstall':
      return nvmUninstall(version);
    default:
      throw new Error(`禁止执行的操作: ${command}`);
  }
}

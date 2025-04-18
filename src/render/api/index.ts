import { ipcInstance } from '@render/plugins';
import util from "node:util";

export function sendMsgToMainProcess(msg: string) {
  return ipcInstance.send<string>('send-msg', msg);
}

export function executeCmd(cmd: string) {
  // 增加命令校验逻辑
  if (!cmd.startsWith('nvm ')) {
    throw new Error('仅允许执行nvm相关的命令');
  }
  return ipcInstance.send<string>('runCmd', cmd);
}

// 版本号格式校验（正则表达式）
const VERSION_REGEX = /^[v]?\d+\.\d+\.\d+$/;

function validateVersion(input: string): boolean {
  return VERSION_REGEX.test(input);
}

// 允许的命令列表
const ALLOWED_COMMANDS = ['install', 'use', 'uninstall'];

function validateCommand(cmd: string): void {
  if (!ALLOWED_COMMANDS.includes(cmd)) {
    throw new Error(`禁止执行的操作: ${cmd}`);
  }
}

// 安全执行封装
export async function executeNvmSafely(
    command: string,
    version: string
): Promise<string> {
  // 双重校验
  validateCommand(command);
  if (!validateVersion(version)) {
    throw new Error(`非法输入: ${version}`);
  }

  try {
    // 通过 IPC 与主进程通信执行命令
    return await ipcInstance.send<string>('runCmd', `${command} ${version}`);
  } catch (error) {
    throw error;
  }
}

export function openUrl(url: string) { 
  return ipcInstance.send('openUrl', url);
}

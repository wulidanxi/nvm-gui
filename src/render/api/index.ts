import { ipcInstance } from '@render/plugins'

export function sendMsgToMainProcess(msg: string) {
  return ipcInstance.send<string>('send-msg', msg)
}

export function executeCmd(cmd: string) {
  return ipcInstance.send<string>('runCmd', cmd)
}

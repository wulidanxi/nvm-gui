/** 已停用的旧通用 IPC 接口，仅为兼容历史导入保留类型。 */
interface IpcInstance {
  send: <T = any>(target: string, ...args: any[]) => Promise<T>
  on: (event: string, callback: (...args: any[]) => void) => void
}

/** 明确阻止新代码绕过类型安全的 @render/api。 */
export const ipcInstance: IpcInstance = {
  send: async () => {
    throw new Error('The generic IPC plugin has been disabled. Use @render/api instead.')
  },
  on: () => {
    throw new Error('The generic IPC plugin has been disabled. Use @render/api instead.')
  },
}

/** @deprecated 请直接使用 @render/api 中的业务方法。 */
export function useIpc() {
  return ipcInstance
}

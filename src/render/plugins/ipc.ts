interface IpcInstance {
  send: <T = any>(target: string, ...args: any[]) => Promise<T>
  on: (event: string, callback: (...args: any[]) => void) => void
}

export const ipcInstance: IpcInstance = {
  send: async () => {
    throw new Error('The generic IPC plugin has been disabled. Use @render/api instead.')
  },
  on: () => {
    throw new Error('The generic IPC plugin has been disabled. Use @render/api instead.')
  },
}

export function useIpc() {
  return ipcInstance
}
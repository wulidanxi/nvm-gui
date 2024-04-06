import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  'ipcRenderer',
  {
    invoke: ipcRenderer.invoke.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer),
  },
)

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  system: () => process
  // 除函数之外，我们也可以暴露变量
})

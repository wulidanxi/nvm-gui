import { app } from 'electron'
import { createEinf } from 'einf'
import { NpmController } from '../npm.controller'
import { NvmController } from '../nvm.controller'
import { ProjectController } from '../project.controller'
import { SystemController } from '../system.controller'
import { CommandLogController } from '../command-log.controller'
import { AppUpdateController } from '../features/updates/update.controller'
import { createWindow } from '../main.window'
import { registerCustomProtocol } from '../custom-protocol'
import { installIpcSecurityGuard } from '../ipc-security'

if (!app.isPackaged)
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

registerCustomProtocol()
installIpcSecurityGuard()

/** 安装平台生命周期和开发工具退出钩子。 */
async function electronAppInit() {
  const isDev = !app.isPackaged

  app.on('window-all-closed', () => {
    // 遵循 macOS 关闭全部窗口但不退出应用的惯例。
    if (process.platform !== 'darwin')
      app.exit()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        // Vite/Electron 开发工具通过此消息请求干净重启。
        if (data === 'graceful-exit')
          app.exit()
      })
    }
    else {
      process.on('SIGTERM', () => {
        app.exit()
      })
    }
  }
}

/** 启动 Electron 生命周期并注册完整的主进程 IPC 控制器。 */
async function bootstrap() {
  try {
    await electronAppInit()

    // 控制器集合定义了 preload 可触达的全部主进程 IPC 面。
    await createEinf({
      window: createWindow,
      controllers: [NvmController, NpmController, ProjectController, SystemController, CommandLogController, AppUpdateController],
      injects: [{
        name: 'IS_DEV',
        inject: !app.isPackaged,
      }],
    })
  }
  catch (error) {
    console.error(error)
    app.quit()
  }
}

bootstrap()

import { app } from 'electron'
import { createEinf } from 'einf'
import { NpmController } from './npm.controller'
import { NvmController } from './nvm.controller'
import { ProjectController } from './project.controller'
import { SystemController } from './system.controller'
import { createWindow } from './main.window'
import { registerCustomProtocol } from './custom-protocol'
import { installIpcSecurityGuard } from './ipc-security'

if (!app.isPackaged)
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

registerCustomProtocol()
installIpcSecurityGuard()

async function electronAppInit() {
  const isDev = !app.isPackaged

  app.on('window-all-closed', () => {
    // Keep the macOS convention where closing all windows does not quit the app.
    if (process.platform !== 'darwin')
      app.exit()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        // Vite/electron dev tooling sends this message for a clean restart.
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

async function bootstrap() {
  try {
    await electronAppInit()

    // Controllers define the complete main-process IPC surface exposed through preload.
    await createEinf({
      window: createWindow,
      controllers: [NvmController, NpmController, ProjectController, SystemController],
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

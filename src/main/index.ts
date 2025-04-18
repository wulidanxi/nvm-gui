import { app } from 'electron'
import { createEinf } from 'einf'
import { AppController } from './app.controller'
import { createWindow } from './main.window'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 异步函数，用于初始化electron应用
async function electronAppInit() {
  // 判断是否为开发环境
  const isDev = !app.isPackaged
  // 监听所有窗口关闭事件
  app.on('window-all-closed', () => {
    // 如果不是macOS平台，则退出应用
    if (process.platform !== 'darwin')
      app.exit()
  })

  // 如果是开发环境
  if (isDev) {
    // 如果是Windows平台
    if (process.platform === 'win32') {
      // 监听消息事件
      process.on('message', (data) => {
        // 如果消息为'graceful-exit'，则退出应用
        if (data === 'graceful-exit')
          app.exit()
      })
    }
    // 如果不是Windows平台
    else {
      // 监听SIGTERM信号
      process.on('SIGTERM', () => {
        // 退出应用
        app.exit()
      })
    }
  }
}

// 异步函数，用于初始化应用程序
async function bootstrap() {
  try {
    // 初始化electron应用程序
    await electronAppInit()

    // 创建Einf实例，传入窗口、控制器和注入对象
    await createEinf({
      window: createWindow,
      controllers: [AppController],
      injects: [{
        name: 'IS_DEV',
        inject: !app.isPackaged,
      }],
    })
  }
  catch (error) {
    // 捕获错误并打印错误信息，退出应用程序
    console.error(error)
    app.quit()
  }
}

bootstrap()

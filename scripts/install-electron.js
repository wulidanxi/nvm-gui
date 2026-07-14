// 本地安装默认使用国内镜像，同时允许调用方通过环境变量覆盖。
// 本地安装默认使用国内镜像，同时允许调用方通过环境变量覆盖。
process.env.ELECTRON_MIRROR ||= 'https://npmmirror.com/mirrors/electron/'

require('electron/install')

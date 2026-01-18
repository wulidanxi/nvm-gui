<p align="center">
    <img width="400" src="https://github.com/wulidanxi/nvm-gui/blob/main/nvm-logo-color-avatar.png" alt="logo">
</p>

![GitHub License](https://img.shields.io/github/license/wulidanxi/nvm-gui) ![GitHub Release](https://img.shields.io/github/v/release/wulidanxi/nvm-gui)
![CI](https://github.com/wulidanxi/nvm-gui/actions/workflows/ci.yml/badge.svg?branch=main)

# ⚡ NVM GUI（Vite + Vue + Electron）

一个专注于 Node.js 版本管理的桌面图形工具。集成 NVM 常用操作，并提供更贴近开发者工作流的能力。

## 功能特性

- NPM 源管理：内置常用源、全量测速、一键切换
- 全局包迁移助手：读取当前版本的全局包，批量安装到目标版本
- 项目版本检测：识别 `.nvmrc`，检测是否匹配，一键安装/切换
- 主题与基础布局：基于 Naive UI，支持暗色与浅色主题

## 环境要求

- Node.js 20+（建议 20 或 22）
- Windows（当前主平台），后续将拓展更多平台
- 系统已安装 nvm-windows

## 安装与运行

在项目根目录：

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建与打包安装包
npm run build
```

打包完成后，安装包位于：
`dist/electron/nvm-gui Setup <version>.exe`

## 下载与发布

- 最新安装包下载：在 GitHub Releases 页面（基于 tag 的自动发布）
- 推送发布：创建符合语义化的 tag（例如 `v0.0.3`），CI 会自动构建并附加安装包

## 常见问题

- 启动白屏或报错：已修复 Router 重定向与全局 Message Provider 注入，若仍出现问题请在开发者工具查看 Console 日志
- 运行速度：开发模式已移除冗余清理步骤以提升二次启动速度

## 许可协议

MIT

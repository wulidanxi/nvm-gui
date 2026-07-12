<p align="center">
    <img width="400" src="https://github.com/wulidanxi/nvm-gui/blob/main/nvm-logo-color-avatar.png" alt="logo">
</p>

![GitHub License](https://img.shields.io/github/license/wulidanxi/nvm-gui) ![GitHub Release](https://img.shields.io/github/v/release/wulidanxi/nvm-gui)
![CI](https://github.com/wulidanxi/nvm-gui/actions/workflows/ci.yml/badge.svg?branch=main)

当前版本：`0.0.18-a`

# ⚡ NVM GUI（Vite + Vue + Electron）

一个专注于 Node.js 版本管理的桌面图形工具。集成 NVM 常用操作，并提供更贴近开发者工作流的能力。

## 功能特性

- NPM 源管理：内置常用源、全量测速、一键切换
- 全局包迁移助手：读取当前版本的全局包，批量安装到目标版本
- 项目版本检测：识别 `.nvmrc`，检测是否匹配，一键安装/切换
- 主题与基础布局：基于 Naive UI，支持暗色与浅色主题
- 多语言界面：支持中英文切换，并跟随用户偏好持久化保存
- 动效与操作反馈：保留主题扩散、按钮触感和必要的状态反馈，实时展示 Node.js 安装、切换与卸载状态
- 命令日志中心：持久化查看受控 NVM/NPM/NVM 管理器操作，支持筛选、复制、导出和清理
- 应用更新：可配置启动检查；Windows 支持下载后重启安装，macOS/Linux 提供 Release 下载入口

## 环境要求

- Node.js 22.12+（Electron 41 / electron-builder 依赖链要求）
- Windows、macOS 或 Linux
- Windows 使用 nvm-windows；macOS/Linux 使用 nvm-sh/nvm

## 安装与运行

在项目根目录：

```bash
# 安装依赖
npm install

# 如 Electron 二进制下载较慢，可使用国内镜像补下载
npm run electron:install

# 开发模式
npm run dev

# 构建与打包安装包
npm run build

# 分平台打包
npm run build:win
npm run build:mac
npm run build:linux
```

打包完成后，安装包位于：
`dist/electron/`，Windows 为 `.exe`，macOS 为 `.dmg`/`.zip`，Linux 为 `.AppImage`/`.deb`。

## 下载与发布

- 最新安装包下载：在 GitHub Releases 页面（基于 tag 的自动发布）
- 推送发布：创建符合语义化的 tag（例如 `v0.0.11`），CI 会自动构建并附加三平台安装包

版本标记约定：`vX.Y.Z` 为稳定版；带连字符后缀的 `vX.Y.Z-alpha.N`、`vX.Y.Z-beta.N`、`vX.Y.Z-rc.N` 为预览版，GitHub Release 会自动标记为 Pre-release。

## 常见问题

- 启动白屏或报错：已修复 Router 重定向与全局 Message Provider 注入，若仍出现问题请在开发者工具查看 Console 日志
- 运行速度：开发模式已移除冗余清理步骤以提升二次启动速度

## 许可协议

MIT

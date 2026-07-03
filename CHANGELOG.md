# Changelog

## [0.0.5] - 2026-07-03

### Features
- 集成 NVM 管理器安装能力：Windows 内置推荐版 `nvm-windows` 安装器，并支持从官方 GitHub Releases 选择其它版本安装。
- 为 macOS/Linux 增加 `nvm-sh/nvm` 运行时安装路径，支持选择 tag 安装到用户级 `NVM_DIR`。
- 设置页新增 “NVM 管理器” 面板，可检测当前管理器状态、版本、路径并触发安装/升级。

### Improvements
- 主进程新增 NVM 管理器 provider 层，统一处理 `nvm-windows` 与 `nvm-sh/nvm` 的命令执行和状态探测。
- 本地版本页、可安装版本页和 Dashboard 在未安装 NVM 时显示明确状态和引导。
- 应用版本同步升级至 `0.0.5`。

## [0.0.4] - 2026-07-03

### Security
- 收紧 Electron preload 暴露面，改为 `window.nvmGui` 白名单 API，不再向渲染层暴露裸 `ipcRenderer` 和完整 `process`。
- 移除通用 `runCmd` 命令入口，所有 nvm/npm 操作改为专用 IPC。
- 主进程命令执行改为受校验的参数化调用，降低 shell 注入风险。
- 主窗口拦截页面新窗口打开，外链统一走受控 `openUrl`。

### Fixes
- 修复 Node.js 发行记录页安装失败时 loading 和按钮禁用状态可能无法恢复的问题。
- 已安装版本判断改为解析本地版本集合，避免字符串包含导致误判。

### Refactor
- Dashboard、About、AvailableNode 切换到专用 nvm API。
- 版本号升级至 `0.0.4`。

## [0.0.3] - 2025-01-18

### 🚀 新增功能 (Features)
- **NPM 源管理 (Registry Manager)**
  - 内置常用源（npm, yarn, 腾讯云, 淘宝等）。
  - 支持全量测速，实时显示各源延迟。
  - 一键切换当前 NPM 源。
- **全局包迁移助手 (Migration Helper)**
  - 自动读取当前 Node 环境下的全局包列表。
  - 支持批量选中并一键重新安装到当前版本。
  - 解决版本切换后全局工具丢失的痛点。
- **项目版本检测 (Project Detector)**
  - 智能识别项目目录下的 `.nvmrc` 文件。
  - 自动检测当前 Node 版本是否匹配。
  - 提供一键安装/切换到项目所需版本的功能。

### 🐛 修复 (Bug Fixes)
- **启动白屏修复**: 修正了 Vue Router 根路径重定向策略和 CSP 配置，解决了应用启动时的白屏和闪烁问题。
- **组件注册**: 修复了 `MigrationHelper` 和 `RegistryManager` 等组件在部分环境下因隐式命名导致的 `Invalid vnode type` 警告。
- **上下文丢失**: 在根组件 `App.vue` 中全局注入 `NMessageProvider`，彻底解决了子组件无法调用 `useMessage` 导致的崩溃问题。
- **构建优化**: 修复了 `MigrationHelper.vue` 中的 TypeScript 类型定义错误 (TS2322)。

### ⚡ 性能优化 (Performance)
- **开发启动加速**: 优化了 `npm run dev` 脚本，移除冗余的清理步骤，显著提升二次启动速度。
- **路由懒加载**: 优化了路由配置，确保页面按需加载。

---

## [0.0.2c] - Previous Version
- Initial GUI structure based on Naive UI.
- Basic NVM command integration (list, install, use).

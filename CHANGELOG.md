# Changelog

## [0.0.8b] - 2026-07-04

### Fixes
- 修复 macOS 打包未显式包含 Intel `x64` 架构的问题，`build:mac` 会同时产出 `x64` 与 `arm64` 包。
- 修复 Linux `.deb` 打包缺少 maintainer 元数据导致 CI 构建失败的问题。
- 应用版本同步升级至 `0.0.8b`。

## [0.0.8] - 2026-07-04

### Features
- 打包发布扩展为三平台：Windows 继续产出 NSIS `.exe`，macOS 产出未签名 `.dmg`/`.zip`，Linux 产出 `.AppImage`/`.deb`。
- macOS 打包显式产出 Intel `x64` 与 Apple Silicon `arm64` 两种架构。
- 新增 `npm run build:win`、`npm run build:mac`、`npm run build:linux`，通过 Vite mode 将目标平台传递给 electron-builder。
- GitHub Actions 的 CI 与 Release 流程加入 macOS、Linux 构建产物，并在发布时统一附加三平台安装包。

### Improvements
- macOS/Linux 的 NVM 管理器继续使用 `nvm-sh/nvm`，推荐版本更新至 `v0.40.5`。
- POSIX 平台默认 `NVM_DIR` 对齐 nvm-sh 行为：优先 `NVM_DIR`，其次 `$XDG_CONFIG_HOME/nvm`，否则使用 `~/.nvm`。
- Windows 内置的 `nvm-windows` 安装器只在 Windows 包中携带，macOS/Linux 包不再包含 Windows 专用资源。
- 应用版本同步升级至 `0.0.8`。

## [0.0.7] - 2026-07-04

### Improvements
- Electron 依赖升级到 41 系列，当前锁定为 npm 已发布的 `41.9.2`。
- 新增 `npm run electron:install` / `yarn electron:install`，默认使用 `npmmirror` 国内镜像手动补下载 Electron 运行时。
- 应用版本同步升级至 `0.0.7`。

### Fixes
- 修复顶部主题开关切换后，设置中心外观模式下拉值不会同步变化的问题。

## [0.0.6b] - 2026-07-04

### Improvements
- 固定新版工作台各页面标题区域，页面滚动改为标题下方内容区内部滚动。
- 设置中心改为左右展示框内部滚动，右侧底部保存提示区固定在面板底部并横向铺满。
- Windows 下本地版本列表会过滤缺少 `node.exe` 的不完整 Node 版本目录，避免空目录被误认为可切换版本。
- 渲染层统一清理 Electron IPC 错误包装前缀，使 NVM 操作失败提示更贴近真实原因。
- 应用版本同步升级至 `0.0.6b`。

### Fixes
- 修复 Dashboard、本地版本、可安装版本和设置中心滚动时页面标题区跟随内容滑动的问题。
- 修复设置中心整体页面滚动导致 footer 不能稳定贴底的问题。
- 修复 `nvm ls` 显示损坏版本目录但 `nvm use <version>` 报 `Version not installed` 时，界面仍展示该版本并显示底层命令失败的问题。

## [0.0.6] - 2026-07-03

### Features
- 新增工作台式应用壳层，改为左侧导航、顶部运行状态条和统一内容滚动区。
- 新增新版工作台首页，突出当前 Node 运行时、环境健康状态和常用快捷操作。
- 新增新版本地 Node 版本页，支持搜索、状态摘要、稳定列宽和更清晰的切换/卸载状态。
- 新增新版 Node.js 发行记录页，支持搜索、LTS 筛选、安装状态标记和稳定表格布局。
- 新增新版设置中心，改为左侧设置分类导航与右侧内容面板，集中管理通用设置、高级设置、NPM 源、全局包迁移、项目检测和 NVM 管理器。
- 新增预设主题色功能，支持 Node Green、Sky Blue、Violet、Amber、Rose 五套强调色。

### Improvements
- 增加全局 light/dark 主题变量和 Naive UI 主题覆盖，统一页面背景、卡片、工具栏、表格、侧栏、顶部栏和弹窗视觉。
- Naive UI 主色、导航选中态、状态点、hero 强调和自定义组件强调色统一跟随当前主题色。
- 工作台顶部状态条新增 Electron 版本展示，并收紧系统、NVM、Electron 状态标签字号。
- 移除工作台四个重复版本信息卡片，保留更聚焦的当前运行时、环境健康和快捷操作。
- 表格卡片增加内边距和圆角边框，避免内容贴边；本地版本页和发行记录页改用横向滚动承接窄屏列宽。
- 收紧工作台首页 hero 区、指标区、健康状态行、快捷操作卡片和页面标题间距，降低界面占用空间。
- 关于弹窗、导航文案和主要页面标题恢复为可读中文文案。
- 同步更新项目 Wiki，补充 0.0.6 工作台 UI、主题色、路由、页面和构建注意事项。
- 应用版本同步升级至 `0.0.6`。

### Fixes
- 修复 dark 模式下部分自定义 UI 仍保持浅色背景的问题。
- 修复页面内部多重滚动和固定高度导致的内容遮挡问题。
- 修复表格固定高度与分页区域组合导致的显示拥挤、贴边和窄屏挤压问题。
- 修复设置中心长内容可能被底部保存区域遮挡的问题。

### Refactor
- 将路由切换到新版工作台组件，保留旧页面组件以便回退。
- 将消息和弹窗 Provider 上移到根组件，避免应用壳层重复注入。
- 将页面标题、卡片、工具栏、状态点、summary 卡片和表格基础样式收敛到全局样式。

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

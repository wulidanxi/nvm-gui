# nvm-gui 项目 Wiki

## 1. 项目概览

`nvm-gui` 是一个面向 Windows/nvm-windows 的 Node.js 版本管理桌面工具。项目使用 Electron 承载桌面窗口，Vue 3 + Naive UI 构建界面，主进程通过 `einf` 暴露 IPC 能力，让渲染层可以执行 nvm/npm 相关操作。

核心目标：

- 查看本机已安装的 Node.js 版本。
- 切换、安装、卸载 Node.js 版本。
- 查看 Node.js 发行记录并安装目标版本。
- 管理 npm registry。
- 读取当前 Node 环境下的全局包，并批量迁移安装。
- 检测项目 `.nvmrc`，辅助切换到项目所需版本。
- 支持浅色/深色模式、预设主题色和 Node.js 发行源配置。
- 检测、安装和升级底层 NVM 管理器。

当前版本：`0.0.6`。

## 2. 技术栈

| 层级            | 技术                               |
| --------------- | ---------------------------------- |
| 桌面运行时      | Electron 40                        |
| 构建工具        | Vite 7, vite-plugin-doubleshot     |
| 前端框架        | Vue 3, Vue Router 4                |
| UI              | Naive UI, vicons                   |
| 状态管理        | Pinia, pinia-plugin-persistedstate |
| HTTP            | axios                              |
| 日期处理        | dayjs                              |
| 主进程 IPC 框架 | einf                               |
| 类型与质量      | TypeScript, vue-tsc, ESLint        |
| 打包            | electron-builder, NSIS             |

## 3. 本地开发

### 环境要求

- Node.js 22.12+（Electron 40 / electron-builder 依赖链要求）。
- Windows 为当前主要目标平台。
- 系统已安装 `nvm-windows`，并保证 `nvm`、`npm` 可以在命令行中访问。

### 常用命令

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

### 本次 review 验证结果

```text
npm run typecheck 通过
npm run lint      通过
```

`npm run build` 在 Windows 下需要确保旧的 `dist/electron/win-unpacked/nvm-gui.exe` 没有运行；否则 electron-builder 清理旧 DLL 时可能遇到 `Access is denied`。

## 4. 目录结构

```text
.
├── src
│   ├── main
│   │   ├── index.ts               # Electron/einf 启动入口
│   │   ├── main.window.ts         # BrowserWindow 创建与加载
│   │   ├── app.controller.ts      # nvm/npm/openUrl 等 IPC 控制器
│   │   ├── project.controller.ts  # .nvmrc 检测 IPC 控制器
│   │   └── app.service.ts         # 当前仅保留简单服务示例
│   ├── preload
│   │   ├── index.ts               # contextBridge 暴露 IPC 与版本信息
│   │   └── index.d.ts             # window 类型声明
│   ├── render
│   │   ├── App.vue                # 根组件，挂载全局 Provider
│   │   ├── main.ts                # Vue 应用入口
│   │   ├── router                 # 路由配置
│   │   ├── api                    # 渲染层 IPC/API 封装
│   │   ├── components             # 页面与设置子模块
│   │   ├── stores                 # Pinia 持久化 store
│   │   ├── utils                  # nvm 输出解析、HTTP、刷新标记
│   │   └── assets/styles/public   # 静态资源与样式
│   └── common
│       └── types.ts               # 通用类型
├── vite.config.ts                 # Vite + doubleshot 配置
├── electron-builder.config.js     # Electron 打包配置
├── package.json
└── README.md
```

## 5. 应用启动流程

1. `src/main/index.ts` 启动 Electron 应用。
2. `electronAppInit()` 注册窗口关闭、开发环境退出信号等 Electron 生命周期逻辑。
3. `createEinf()` 注册窗口工厂和控制器：
   - `AppController`
   - `ProjectController`
4. `src/main/main.window.ts` 创建 `BrowserWindow`：
   - 开发环境加载 `process.env.DS_RENDERER_URL`。
   - 生产环境加载 `dist/render/index.html`。
   - 开启 `contextIsolation`。
   - 关闭 `nodeIntegration`。
   - 通过 preload 暴露受控桥接对象。
5. `src/render/main.ts` 创建 Vue 应用，注册 Naive UI、Pinia、Router。
6. 根路由进入 `src/render/components/AppShell.vue` 工作台壳层，再渲染具体功能页。

## 6. 路由与页面

| 路由         | 组件                         | 说明                                  |
| ------------ | ---------------------------- | ------------------------------------- |
| `/dashboard` | `WorkbenchDashboard.vue`     | 当前 Node 运行时、环境健康和快捷操作  |
| `/local`     | `WorkbenchLocalNode.vue`     | 查看本地 Node 版本，搜索、切换和卸载  |
| `/available` | `WorkbenchAvailableNode.vue` | 查看 Node.js 发行记录，筛选和安装版本 |
| `/setting`   | `WorkbenchSetting.vue`       | 设置中心，包含多个子功能              |

根路径 `/` 重定向到 `/dashboard`。

## 7. 主进程 IPC 能力

主进程控制器位于 `src/main/app.controller.ts` 和 `src/main/project.controller.ts`。

| IPC handle                    | 作用                              |
| ----------------------------- | --------------------------------- |
| `open-directory-dialog`       | 打开目录选择框                    |
| `nvm-list`                    | 执行 `nvm ls`                     |
| `nvm-current`                 | 执行 `nvm current`                |
| `nvm-version`                 | 获取当前 NVM 管理器版本           |
| `nvm-use`                     | 执行 `nvm use <version>`          |
| `nvm-install`                 | 执行 `nvm install <version>`      |
| `nvm-uninstall`               | 执行 `nvm uninstall <version>`    |
| `nvm-manager-detect`          | 检测 NVM 管理器状态               |
| `nvm-manager-list-versions`   | 获取可安装的 NVM 管理器版本       |
| `nvm-manager-install`         | 安装或升级 NVM 管理器             |
| `nvm-manager-current-version` | 获取 NVM 管理器当前版本           |
| `nvm-manager-refresh`         | 刷新 NVM 运行环境                 |
| `npm-get-registry`            | 获取当前 npm registry             |
| `npm-set-registry`            | 设置 npm registry                 |
| `npm-list-global`             | 获取全局 npm 包列表               |
| `npm-install-global`          | 全局安装 npm 包                   |
| `nvm-alias-list`              | 预留接口，当前返回空字符串        |
| `openUrl`                     | 调用系统浏览器打开 http/https URL |
| `check-nvmrc`                 | 读取目录下 `.nvmrc` 文件          |

渲染层封装位于 `src/render/api/index.ts`，底层通过 preload 暴露的 `window.nvmGui` 白名单 API 调用主进程能力。

## 8. 功能模块说明

### Dashboard

文件：`src/render/components/WorkbenchDashboard.vue`

职责：

- 展示当前 Node 运行时和环境健康状态。
- 聚合 Node、NVM 管理器、Electron 运行壳状态。
- 提供本地版本、可安装版本、项目检测和 NVM 管理器的快捷入口。

### 本机 Node 环境

文件：`src/render/components/WorkbenchLocalNode.vue`

职责：

- 调用 `nvmList()` 获取本地版本列表。
- 使用 `parseNvmList()` 解析 `nvm ls` 输出。
- 支持版本搜索和状态摘要。
- 单选表格切换版本。
- 对非当前版本提供卸载按钮。
- 表格每页默认展示 4 条数据。
- 使用 `nodeEnvDirty` 标记跨页面刷新。

关键工具：

- `src/render/utils/nvmParser.ts`
- `src/render/utils/nodeEnvDirty.ts`

### Node.js 发行记录

文件：`src/render/components/WorkbenchAvailableNode.vue`

职责：

- 通过 `getNodeReleaseRecord()` 拉取 Node.js 发行 JSON。
- 按 Node 大版本分组，每组展示最新版本。
- 结合本地 `nvm ls` 判断版本是否已安装。
- 支持版本/世代/LTS 搜索和仅看 LTS。
- 支持安装未安装的版本。
- 操作列固定在表格最右侧。
- 表格每页默认展示 4 条数据。

发行源默认值来自 `NodeURLStore`：

```text
https://nodejs.org/dist/index.json
```

### 设置页

文件：`src/render/components/WorkbenchSetting.vue`

子模块：

| 分类       | 组件                            | 说明                            |
| ---------- | ------------------------------- | ------------------------------- |
| 通用       | `GeneralAppearanceSettings.vue` | 外观模式和预设主题色            |
| 高级       | `AdvancedSettings.vue`          | Node.js 发行源配置              |
| NPM 源管理 | `RegistryManager.vue`           | npm registry 切换与测速         |
| 全局包迁移 | `MigrationHelper.vue`           | 全局包读取与批量安装            |
| 项目检测   | `ProjectDetector.vue`           | 选择目录并读取 `.nvmrc`         |
| NVM 管理器 | `NvmManager.vue`                | 检测、安装和升级底层 NVM 管理器 |

项目检测用于多项目开发场景：选择项目目录后读取 `.nvmrc`，对比当前激活的 Node 版本，并在不匹配时提供切换/安装入口。

### 主题配置

文件：`src/render/stores/ThemeStore.ts`

使用 Pinia 持久化保存：

- `theme`：`light` / `dark` 外观模式。
- `accent`：预设主题色 key，默认 `node-green`。

当前内置主题色：

- `Node Green`
- `Sky Blue`
- `Violet`
- `Amber`
- `Rose`

`src/render/App.vue` 根据 `ThemeStore` 生成 Naive UI `themeOverrides`，并在根节点写入 `--app-accent`、`--app-accent-soft`、`--app-accent-strong` 等 CSS 变量。工作台壳层、导航、按钮、状态点、表格和设置中心均通过这些变量跟随当前主题色。

### Node 发行源配置

文件：`src/render/stores/NodeURLStore.ts`

使用 Pinia 持久化保存 Node.js 发行记录 URL。

## 9. 数据流与状态流

### 本地版本列表刷新

```text
用户安装/卸载/切换 Node
        ↓
markNodeEnvDirty()
        ↓
LocalNode 被 keep-alive 激活
        ↓
consumeNodeEnvDirty()
        ↓
重新执行 nvmList()
```

### 项目 .nvmrc 检测

```text
用户选择目录
        ↓
open-directory-dialog
        ↓
check-nvmrc 读取 <目录>/.nvmrc
        ↓
nvm-list 获取当前激活版本
        ↓
前端比较 requiredVersion 和 currentActive.version
        ↓
提示匹配或提供切换按钮
```

### npm registry 切换

```text
页面初始化
        ↓
npm config get registry
        ↓
用户选择 registry
        ↓
npm config set registry <url>
        ↓
更新当前选中源
```

## 10. 构建与发布

构建入口：

- 渲染层 root：`src/render`
- 主进程入口：`src/main/index.ts`
- preload 入口：`src/preload/index.ts`

构建输出：

```text
dist/main
dist/preload
dist/render
dist/electron
```

Electron Builder 配置：

- `appId`: `com.nvm-sh.cn`
- Windows 图标：`./nvm-logo-color-avatar.png`
- NSIS 安装包：非 one-click，允许用户选择安装目录。
- `requestedExecutionLevel`: `requireAdministrator`

## 11. 代码审阅发现

以下为早期审阅记录。`0.0.4` 之后已完成 preload 白名单 API、移除通用命令入口、主进程参数校验等安全加固；保留本节用于追溯历史问题和后续测试方向。

### P1：preload 暴露了过宽的能力

位置：

- `src/preload/index.ts:3`
- `src/preload/index.ts:12`

当前 preload 直接暴露了通用 `ipcRenderer.invoke/on/removeAllListeners`，并且通过 `versions.system()` 返回整个 `process` 对象。这样会削弱 `contextIsolation` 的收益：一旦渲染层出现 XSS 或第三方内容注入，攻击者可以直接调用任意 IPC handle，甚至访问进程信息。

建议：

- 不暴露原始 `ipcRenderer`。
- 改为白名单 API，例如 `window.nvmGui.nvm.list()`、`window.nvmGui.project.checkNvmrc()`。
- `versions.system()` 只返回必要字段或方法，例如 `platform`、`getSystemVersion()`。

### P1：`runCmd` 仍可从主进程执行任意命令

位置：

- `src/main/app.controller.ts:23`
- `src/main/app.controller.ts:115`
- `src/render/api/index.ts:10`

虽然渲染层 `executeCmd()` 做了 `cmd.startsWith("nvm ")` 校验，但真正执行命令的主进程 `runExec(cmd)` 没有做同等校验。由于 preload 还暴露了原始 IPC，渲染层可以绕过前端封装直接调用 `runCmd`。

建议：

- 删除 `runCmd`，或在主进程内强制白名单。
- 所有 nvm/npm 操作都走明确参数化的专用 IPC。
- 避免用 `exec` 拼接字符串执行命令，优先使用 `execFile` / `spawn` 并传参数数组。

### P1：部分命令参数存在 shell 注入风险

位置：

- `src/main/app.controller.ts:57`
- `src/main/app.controller.ts:65`
- `src/main/app.controller.ts:73`
- `src/main/app.controller.ts:79`

`npm-set-registry` 虽然用 `new URL()` 做了基础校验，但随后仍拼接到 shell 命令中。URL 查询串中可以合法出现一些对 shell 有意义的字符，使用 `exec()` 时风险较高。

建议：

- 将 `execCommand("npm config set registry ...")` 改为参数数组执行。
- 对 registry 协议、hostname 和完整字符集做更严格白名单。
- npm 包名、版本号、registry 都应在主进程做最终校验。

### P2：`.nvmrc` 支持范围偏窄

位置：

- `src/main/app.controller.ts:128`
- `src/render/components/Setting/ProjectDetector.vue:111`
- `src/render/components/Setting/ProjectDetector.vue:119`

当前主进程版本校验只接受 `x.y.z` 或 `vx.y.z`，但 `.nvmrc` 常见内容包括 `20`、`lts/*`、`lts/iron` 等。前端也只做精确等值比较，导致项目检测功能对真实项目的兼容性有限。

建议：

- 为 `.nvmrc` 建立独立 parser。
- 支持 major、minor、完整版本、`v` 前缀和 LTS alias。
- 匹配本地版本时按语义版本解析，而不是字符串等值。

### P2：安装流程缺少统一错误收敛

位置：

- `src/render/components/AvailableNode.vue:121`
- `src/render/components/AvailableNode.vue:177`

`installNode()` 里没有 `try/finally` 包住安装、刷新和按钮状态恢复。`initData()` 混用 async 函数和 `.then()`，失败路径没有统一 catch，也没有使用 `tableLoading`。

建议：

- `installNode()` 使用 `try/catch/finally`，确保 loading 和禁用状态一定恢复。
- `initData()` 改为纯 `async/await`。
- 拉取发行记录、本地版本列表、解析失败时显示明确消息。

## 12. 建议的近期重构路线

1. 收紧 preload：用领域 API 替代裸 `ipcRenderer` 和裸 `process`。
2. 移除或封死 `runCmd`：所有命令改为专用 IPC。
3. 主进程命令执行改为 `spawn`/`execFile` 参数数组。
4. 抽出 nvm/npm command service，并补充单元测试。
5. 完善 `.nvmrc` parser 和版本匹配逻辑。
6. 统一页面 loading/error/finally 状态管理。
7. 修复 README/CHANGELOG/注释的编码显示问题，保证仓库文本统一 UTF-8。

## 13. 可补充的测试清单

建议优先补充以下测试：

- `parseNvmList()`：覆盖当前版本、无当前版本、空输出、带括号描述、异常行。
- `.nvmrc` parser：覆盖 `20`、`20.11`、`20.11.1`、`v20.11.1`、`lts/*`。
- 主进程参数校验：nvm 版本、npm 包名、registry URL。
- IPC 白名单：确保渲染层不能调用未授权命令。
- 页面流程：安装失败、卸载失败、拉取 Node 发行记录失败时 loading 能恢复。

## 14. 维护注意事项

- 当前 0.0.6 工作区改动主要集中在：
  - `src/main/main.window.ts`
  - `src/render/App.vue`
  - `src/render/router/index.ts`
  - `src/render/stores/ThemeStore.ts`
  - `src/render/styles/reset.css`
  - `src/render/components/AppShell.vue`
  - `src/render/components/Workbench*.vue`
  - `src/render/components/Setting/GeneralAppearanceSettings.vue`

## 15. v0.0.5 NVM 管理器集成

- 主进程新增 NVM 管理器 provider 层，Windows 使用 `coreybutler/nvm-windows`，macOS/Linux 使用 `nvm-sh/nvm`。
- Windows 打包通过 `extraResources` 内置推荐版 `resources/nvm-windows/nvm-setup.exe`，设置页也允许从官方 GitHub Releases 选择远程版本安装。
- `preload` 仅暴露白名单管理器 API：`detect`、`listVersions`、`install`、`currentVersion`、`refresh`。
- 设置页新增 “NVM 管理器” 面板；未安装 NVM 时，本地版本页和可安装版本页显示安装引导。
- 当前应用版本同步为 `0.0.5`，发布说明继续由 `scripts/extract-changelog.js` 从 `CHANGELOG.md` 提取。
- 若继续做修复，建议先单独提交或暂存当前功能改动，再开安全加固分支。
- 由于这是桌面应用，安全边界以主进程为准。前端校验只能改善体验，不能作为最终安全控制。

## 16. v0.0.5 后续界面与构建修正

- `src/render/components/Setting.vue`：设置页固定在父级内容区内，使用 `height: 100%`、`box-sizing: border-box`、`overflow: hidden`，底部保存按钮改为页面内 `absolute` 定位，避免设置页上下滑动。
- `src/render/components/Dashboard.vue`：Dashboard 卡片布局由 `n-flex` + `width: 50vh` + `margin-left` 改为两列 CSS Grid，四个信息卡统一宽度、统一间距，并在小屏下自动切换为单列。
- `package.json`：`build` 脚本改为 `vue-tsc && vite build`，跳过清理 `dist`，避免 Windows 下旧打包产物 `app.asar` 被运行中应用、Explorer 或安全软件锁住时导致 `EBUSY/EPERM`。
- 构建注意：如果需要彻底清理 `dist`，先关闭正在运行的 `nvm-gui`、关闭打开在 `dist/electron/win-unpacked` 的 Explorer 窗口，再手动删除 `dist` 后执行 `npm run build`。
- 已验证：`npm run typecheck`、`npm run lint` 通过；跳过清理后的 `npm run build` 已可完成 Windows NSIS 安装包构建。

## 17. v0.0.6 工作台 UI 与主题色

- 应用壳层切换到 `AppShell.vue`：左侧导航、顶部运行状态条、统一内容滚动区。
- 路由切换到新版 Workbench 页面：`WorkbenchDashboard.vue`、`WorkbenchLocalNode.vue`、`WorkbenchAvailableNode.vue`、`WorkbenchSetting.vue`。
- 顶部运行状态条展示系统版本、NVM 管理器版本和 Electron 版本，标签背景、边框和文字色跟随当前主题色。
- Dashboard 移除四个重复版本信息卡片，保留当前 Node 运行时、环境健康和快捷操作。
- 本地版本页和可安装版本页支持搜索、摘要卡、稳定列宽、横向滚动和每页 4 条数据；可安装版本页操作列固定在最右侧。
- 设置中心改为左侧分类导航和右侧内容面板，底部保存提示区域跟随主题色背景。
- 通用设置新增外观模式与预设主题色选择，当前支持 Node Green、Sky Blue、Violet、Amber、Rose。
- 全局样式新增 `--app-*` 变量，统一控制背景、卡片、边框、阴影、强调色和 dark 模式。
- 主窗口高度从 `768` 调整为 `845`，减少工作台内容被压缩的问题。
- 当前版本同步为 `0.0.6`，发布说明已记录在 `CHANGELOG.md`。
- 构建注意：如果 `npm run build` 在 electron-builder 阶段报 `d3dcompiler_47.dll: Access is denied`，先关闭正在运行的 `dist/electron/win-unpacked/nvm-gui.exe` 进程后再重试。

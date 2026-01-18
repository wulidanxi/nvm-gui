# Changelog

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

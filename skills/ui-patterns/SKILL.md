---
name: ui-patterns
description: Use when building or modifying Vue 3/Element Plus UI components. Covers dialog composables (Base/Form/Container), API request layer, masking, i18n, forms, and tables.
---

# UI 交互模式 Skill

Vue 3 + Element Plus 前端 UI 交互规范和可复用模式。

## 概述

当需要修改或新增前端 UI 组件时使用本技能。

- **弹窗模式**: 三层组合函数（Base / Form / Container）
- **API 请求层**: 统一请求工具 + 掩码显示
- **加载状态**: Pinia 全局 loading store
- **国际化**: vue-i18n 4 语言同步
- **表单/表格模式**: Element Plus 最佳实践

## 弹窗组合函数（三层架构）

三层组合函数：Base / Form / Container。详细实现与用法见：
`skills/ui-patterns/examples/web-coding-style/01-composition-dialog.md`

## API 请求层

统一请求工具、错误处理、loading 管理。详细实现与用法见：
`skills/ui-patterns/examples/web-coding-style/02-request-and-promise.md`

## 掩码显示

敏感字段掩码显示。详细实现与用法见：
`skills/ui-patterns/examples/web-coding-style/03-store-and-state.md`

## 全局加载状态

Pinia 全局 loading store 与 masking 工具封装。详细实现与用法见：
`skills/ui-patterns/examples/web-coding-style/03-store-and-state.md`

## 国际化

vue-i18n 初始化、语言包结构、组件中使用、语言切换。详细实现与用法见：
`skills/ui-patterns/examples/web-coding-style/05-router-i18n-and-structure.md`

## 表单模式

el-dialog + el-form 表单提交模式。详细示例见：
`skills/ui-patterns/examples/web-coding-style/04-view-page.md`

## 表格模式

el-table 表格与操作列模式。详细示例见：
`skills/ui-patterns/examples/web-coding-style/04-view-page.md`

## 编码风格

> 以下编码风格总结自 `packages/web` 实际代码，详细示例见 `skills/ui-patterns/examples/web-coding-style/`。

### 文件组织

- `api/`：按路由前缀分组，一个文件对应一个路由前缀。
- `composition/dialog/`：弹窗三层组合函数（Base / Form / Container）。
- `composition/view/`：视图组合函数，与页面解耦。
- `stores/`：Pinia 状态管理。
- `views/`：页面级组件，按功能模块分组。
- `utils/`：纯函数工具。
- `router/`：路由配置。

### 文件头部与 JSDoc

- 每个文件顶部用 `/** ... */` 说明整体用途。
- 函数/组件都用 JSDoc 描述入参、返回值。
- 说明文字用中文，技术术语保持英文。

详细示例见：`skills/ui-patterns/examples/web-coding-style/00-file-header-and-jsdoc.md`

### 命名规范

- 组合函数：`composition` 前缀，如 `compositionDialogBase`。
- Store：`useXxxStore` 命名导出。
- 组件：PascalCase（`OfficialKey.vue`）。
- 变量/函数：camelCase。
- CSS 类名：kebab-case。

### Vue 3 + Composition API

- 优先 `<script setup>`。
- 响应式用 `ref()` / `computed()`。
- 生命周期用 `onMounted` 等组合式 API。

详细示例见：`skills/ui-patterns/examples/web-coding-style/04-view-page.md`

### 弹窗三层架构

- Base：管理 `isShow` 和 `state`。
- Form：组合 Base + ViewForm，增加提交和验证。
- Container：父组件通过 `getCurrentInstance().refs` 管理子弹窗。

详细示例见：`skills/ui-patterns/examples/web-coding-style/01-composition-dialog.md`

### 请求层与 Promise

- 使用 `axios` 封装，统一超时 15s。
- 优先 `.then().catch().finally()` 链式写法，不用 `async/await`。
- 每个接口是一个命名导出函数。
- loading 由 masking store 统一管理。

详细示例见：`skills/ui-patterns/examples/web-coding-style/02-request-and-promise.md`

### 全局状态

- Pinia store 统一管理全局状态（loading、share 等）。
- 组件中通过 `useXxxStore()` 获取实例。
- 复杂状态封装成工具函数，延迟获取 store。

详细示例见：`skills/ui-patterns/examples/web-coding-style/03-store-and-state.md`

### 路由与国际化

- 路由文件统一在 `router/index.js`。
- i18n 实例独立导出，供 request.js 和 main.js 共用。
- 语言包按域名分组，支持 4 种语言。

详细示例见：`skills/ui-patterns/examples/web-coding-style/05-router-i18n-and-structure.md`

### CSS 约定

- 全局样式放 `styles/common.css`，组件级样式用 `<style scoped>`。
- CSS 变量定义在 `:root`，通过 `var(--bg-secondary)` 引用。
- 布局类名语义化：`.app-shell`、`.top-bar`、`.sidebar`、`.content`。
- 避免行内 `style` 绑定，尽量用 CSS 类控制。

---

**版本**: 1.0  
**最后更新**: 2026-06-28  
**基于项目**: codewhale-tool v0.3.0
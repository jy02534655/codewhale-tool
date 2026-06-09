# 工作进度日志

> 此文件记录 codewhale-tool 项目的开发进度。
> 中断后可直接读取本文件了解当前状态，继续工作。

## 项目概述

CodeWhale 可视化配置管理工具 — 管理 provider/key/model 三级切换和 skill 生命周期。

- **仓库**: `D:\Code\codewhale-tool`
- **架构**: pnpm monorepo（`packages/core` + `packages/web`）
- **语言**: JavaScript (ESM) + JSDoc 注释
- **UI 框架**: Vue 3 + Vite

---

## 已完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `package.json` | ✅ | monorepo 根配置，ESM 模式 |
| `pnpm-workspace.yaml` | ✅ | workspace 定义 |
| `.gitignore` | ✅ | 忽略 node_modules / dist / .bak 等 |
| `PROGRESS.md` | ✅ | 本进度日志 |
| `packages/core/package.json` | ✅ | @codewhale/core，依赖 smol-toml |
| `packages/core/src/types.js` | ✅ | JSDoc 类型定义 |
| `packages/core/src/config.js` | ✅ | ConfigEngine — TOML 安全读写+备份 |
| `packages/core/src/provider.js` | ✅ | ProviderManager — 三级 CRUD+切换 |
| `packages/core/src/skill.js` | ✅ | SkillManager — 安装/启禁/删除/搜索 |
| `packages/core/src/probe.js` | ✅ | API 连通性探测 |
| `packages/core/src/index.js` | ✅ | 统一导出入口 |
| `packages/web/package.json` | ✅ | @codewhale/web，Vue 3 + Vite + Express |
| `packages/web/vite.config.js` | ✅ | Vite 配置 + API 代理 |
| `packages/web/index.html` | ✅ | HTML 入口 + 暗色 CSS 变量 |
| `packages/web/src/main.js` | ✅ | Vue 3 挂载 |
| `packages/web/src/App.vue` | ✅ | 根组件（导航+标签页+toast） |
| `packages/web/src/views/ProviderView.vue` | ✅ | Provider 管理页面 |
| `packages/web/src/views/SkillView.vue` | ✅ | Skill 管理页面 |
| `packages/web/server.js` | ✅ | Express API 服务器 |

---

## 进行中

| 任务 | 状态 | 说明 |
|------|------|------|
| 安装依赖 | 🔄 | `pnpm install` |
| 验证构建 | ⬜ | 确认所有包可正确导入 |
| 多语言文档 | ⬜ | en / ja / zh-Hans / pt-BR |

---

## 待开发

| 项目 | 优先级 | 说明 |
|------|--------|------|
| Web UI Skill 详情展开 | P4 | SKILL.md 内容在点击"详情"时加载 |
| Web UI 全局 toast | P4 | 替换 alert() 为优雅的 toast 提示 |
| 单文件打包 | P5 | bun build --compile 单 exe 分发 |
| CI/CD | P6 | GitHub Actions 自动构建发布 |

---

## 设计决策

1. **全栈 JS**：Web UI 用 Vue 3，核心层用 Node.js，一套语言贯穿
2. **TOML 库**：使用 `smol-toml`（零依赖，轻量）
3. **配置路径**：cwd/config.toml → ~/.codewhale/config.toml 自动探测
4. **写入安全**：每次写入前自动备份为 config.toml.bak
5. **Web 架构**：Express API 后端 (3456) + Vite 前端 (5173)，dev 模式通过代理通信

---

## 恢复指令

如果在此中断后恢复工作：

1. 读取本文件了解进度
2. 首先执行 `pnpm install` 安装依赖
3. 验证：`node -e "import('@codewhale/core').then(m => console.log(Object.keys(m)))"`
4. 继续下一项待开发任务

---

_最后更新: 2026-06-03_
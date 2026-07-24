# 开发进度

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.3.2 | 2026-07-24 | ConfigEngine 重构：删除业务专用方法（`getOfficialKeys`/`setProviders`/`findProxy` 等），统一为通用 `get`/`set`/`find`；`sync.md`/`download/index.md` 文档行号修正；新增 `settings/index.md` 模块文档 |
| 0.3.1 | 2026-06-29 | 文档重构：README 精简去重、Screen-based 页面索引、多语言 README 结构统一、PROGRESS.md 补全；pnpm→npm 命令修正；ESLint 警告修复；多语言 JSON 结构统一 |
| 0.3.0 | 2026-06-28 | 架构重组：`core/utils/` 基础设施分离、`server/utils/guard.js` 中转层规范、三层职责严格分离 |
| 0.2.0 | 2026-06 | JSON 存储引入（store.json）、多供应商管理、模型激活切换、4 语言支持、一体化开发启动脚本 |
| 0.1.0 | 初始 | TOML 存储、基本 CRUD、单供应商模式 |

## 已完成模块

### Core 层 (`packages/core/src/`)

- `utils/config.js` — ConfigEngine 通用配置引擎（`get`/`set`/`find`，无业务专用方法）✅
- `settings/` — SettingsManager + Schema 驱动 config.toml 读写 ✅
- `utils/i18n.js` — 多语言消息映射（4 语言）✅
- `utils/logger.js` — 统一日志（文件 + SSE 回调）✅
- `utils/result.js` — `ok/okMsg/fail/failMsg` 标准返回 ✅
- `provider.js` — ProviderManager + OfficialKeyManager ✅
- `proxy.js` — ProxyManager ✅
- `token.js` — TokenManager ✅
- `sync.js` — SyncManager（store.json ↔ config.toml 双向同步）✅
- `download/` — GitHub Skill 下载引擎（tar 流式 + git sparse-checkout + zip）✅
- `skill/index.js` — SkillManager ✅
- `skill/project.js` — ProjectSkillEngine ✅

### Server 层 (`packages/server/`)

- `index.js` — Express 启动入口 ✅
- `utils/guard.js` — guard / guardAsync / withSync 包装器 ✅
- `routes/lang.js` — /api/lang ✅
- `routes/officialKey.js` — /api/official-key/* ✅
- `routes/provider.js` — /api/provider/* ✅
- `routes/proxy.js` — /api/proxy/* ✅
- `routes/token.js` — /api/token/* ✅
- `routes/skill.js` — /api/skill/* + SSE 流式安装 ✅
- `routes/sync.js` — /api/sync, /api/init-sync ✅
- `routes/settings.js` — /api/settings REST API ✅

### Web 层 (`packages/web/src/`)

- `main.js` / `App.vue` — Vue 3 入口 + 语言切换 + 皮肤 ✅
- `api/` — 7 个 API 模块（provider/officialKey/proxy/token/skill/lang/settings）✅
- `views/provider/` — 供应商 & 模型管理页（列表 + 弹窗 CRUD）✅
- `views/proxy/` — 代理管理页 ✅
- `views/skill/` — Skill 管理页（列表 + 安装弹窗 + SSE 进度 + SKILL.md 编辑器）✅
- `views/token/` — Token 管理页 ✅
- `views/settings/` — 通用设置页（分组卡片 + 瀑布流） ✅
- `composition/dialog/` — Base/Form/Container 三层弹窗组合函数 ✅
- `stores/masking.js` — 全局加载状态 ✅
- `locales/` — 4 语言包（zh-Hans/en/ja/pt-BR）✅
- `utils/request.js` + `utils/Masking.js` — 请求层 + 掩码显示 ✅

### 项目基础设施

- ESLint 配置（根 + web 子包 + 共享规则）✅
- npm workspaces monorepo ✅
- 4 语言 SKILL.md 开发指南 (skills/) ✅

## 待定 / 未来计划

- 测试覆盖（暂无自动化测试）
- CI/CD 流水线
- Docker 部署支持

---

> 会话级临时进度见 [.codewhale/handoff.md](./.codewhale/handoff.md)。本文件记录版本级进度，handoff.md 记录最近一次会话的改动细节。
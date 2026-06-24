# 工作进度日志

> 此文件记录 codewhale-tool 项目的开发进度。
> 中断后可直接读取本文件了解当前状态，继续工作。

## 项目概述

CodeWhale 可视化配置管理工具 — 管理 provider/key/model 三级切换和 skill 生命周期。

- **仓库**: `D:\Code\codewhale-tool`
- **架构**: pnpm monorepo（`packages/core` + `packages/server` + `packages/web`）
- **语言**: JavaScript (ESM) + JSDoc 注释
- **UI 框架**: Vue 3 + Vite

---

## 已完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `packages/core/src/skill.js` | ✅ | SkillManager — 双层 skill 管理 + 多源安装（GitHub/ZIP/Registry）+ 代理下载 |
| `packages/core/src/skillhub.js` | ✅ | Skillhub CLI 集成 |
| `packages/core/src/project-skill.js` | ✅ | 项目级 skill 存储引擎 |
| `packages/core/src/config.js` | ✅ | ConfigEngine — JSON 存储引擎，含 community_cache |
| `packages/core/src/provider.js` | ✅ | ProviderManager + OfficialKeyManager |
| `packages/core/src/sync.js` | ✅ | SyncManager — 双向实时同步 |
| `packages/core/src/types.js` | ✅ | JSDoc 类型定义 |
| `packages/core/src/result.js` | ✅ | ok/fail/guard 统一错误捕获 |
| `packages/core/src/i18n.js` | ✅ | 多语言映射 |
| `packages/server/index.js` | ✅ | Express 服务入口，集成 ProjectSkillEngine + skillMgr.discover() |
| `packages/server/src/routes/skill.js` | ✅ | Skill 路由 — 完整端点（列表/安装/编辑/SSE/Skillhub） |
| `packages/server/src/routes/provider.js` | ✅ | Provider 路由 |
| `packages/server/src/routes/officialKey.js` | ✅ | 官方 Key 路由 |
| `packages/server/src/routes/sync.js` | ✅ | 同步路由 |
| `packages/web/src/views/skill/` | ✅ | Skill 管理页面（install/edit/detail/readme） |
| `packages/web/src/utils/request.js` | ✅ | axios 封装 — 标准 15s + 长超时 120s 双实例 |
| `packages/web/src/api/skill.js` | ✅ | Skill API — 安装操作使用长超时 ajaxPostBackLong |
| `packages/web/vite.config.js` | ✅ | Vite 配置 + API 代理 |
| 多语言包 `zh-Hans/en/ja/pt-BR` | ✅ | 4 语言完整支持 |
| 端到端启动验证 | ✅ | `pnpm dev` → 后端 3456 HTTP 200 / 前端 5163 HTTP 200 |

---

## 进行中

| 任务 | 状态 | 说明 |
|------|------|------|
| `demo/` 目录 | ⬜ | 示例文件目录，暂未处理 |
| SSE 进度流端到端测试 | ⬜ | 需要通过浏览器 UI 手动操作验证 |

---

## 设计决策

1. **代理下载走 `node:https.get` + agent**：`degit` 不支持自定义 agent，`installFromGitHub` 传入 `proxyUrl` 时走 `_downloadZipWithProxy` 分支（codeload zipball → adm-zip），自动识别 SOCKS5/HTTP。
2. **SSE 端点手动注入**：`fix_route_sse.py` 通过字节级搜索/替换向 `skill.js` 注入 `/install-github-stream` 路由。
3. **路由函数签名扩展**：`createSkillRouter` 新增 `skillhubCli` 参数。
4. **前端双 axios 实例**：标准操作 15s（`service`），安装/下载操作 120s（`serviceLong`），通过 `ajaxPostBackLong` 导出。
5. **安装操作 `loading: false`**：避免长时间 loading 遮罩遮挡安装进度 UI。

---

## Bug 修复 (2026-06-24)

| 问题 | 修复 |
|------|------|
| **degit 子目录不存在时静默创建空目录** | 无代理路径改为「优先 degit → 失败时回退到 ZIP 下载整个仓库 + `_findSkillDir` 递归搜索」 |
| **codeload URL 格式错误** | `zipball/{branch}` → `zip/refs/heads/{branch}` |
| **fetch res.body 是 Web ReadableStream，不支持 .pipe()** | 添加 `Readable.fromWeb(res.body)` 转换后使用 Node.js Readable |

## 验证记录

- ✅ `node --check packages/core/src/skill.js` 语法通过
- ✅ `_findSkillDir` 对 `skills/frontend-design` 成功定位
- ✅ `_findSkillDir` 回退搜索（无 `skills/` 前缀）有效
- ✅ codeload URL `zip/refs/heads/main` → 200 OK
- ✅ `pnpm dev` → 后端 3456 HTTP 200，前端 5163 HTTP 200
- ✅ `Readable.fromWeb()` 修复已正确应用到 _downloadViaTar 和 _downloadViaApi 两处
- ❌ SSE 进度流端到端测试（需手动操作浏览器）

---

## 恢复指令

如果在此中断后恢复工作：

1. 确保已安装依赖：`pnpm install`
2. 启动开发环境：`pnpm dev`
3. 访问 `http://localhost:5163` → Skill 管理 → 安装
4. 测试 GitHub URL: `https://github.com/anthropics/skills`
5. Skill 路径: `skills/frontend-design`
6. 观察 SSE 进度流是否正常输出进度事件

---

_最后更新: 2026-06-24_
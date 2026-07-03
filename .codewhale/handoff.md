# Handoff — Skill 前端 API 拆分

> 最后更新: 2026-07-03
> 状态: **已完成**

## 本次目标
将 `packages/web/src/api/skill.js` 按 `packages/server/src/routes/skill` 的文件边界拆分为 5 个文件；删除旧文件并更新所有调用方 import 路径；保留 provider 目录拆分，proxy 保持原样不拆分。

---

## 已完成工作

### 1. 拆分 skill API 文件
新建 `packages/web/src/api/skill/` 目录，包含 5 个文件：

| 文件 | 职责 |
|------|------|
| `routes.js` | 列表查询、元数据、readme、current-project |
| `cmd.js` | enable/disable/remove/copy-to-project/update |
| `files.js` | 文件列表、读写、删除 |
| `install.js` | GitHub 流式安装、ZIP 流式安装、Tree URL 安装 |
| `log.js` | 安装日志查询与清除 |

### 2. 删除旧文件
- 已删除 `packages/web/src/api/skill.js`

### 3. 修改调用方 import
| 文件 | 改动 |
|------|------|
| `views/skill/edit/detail.vue` | 拆为 `@/api/skill/cmd` + `@/api/skill/files` |
| `views/skill/edit/info.vue` | 改为 `@/api/skill/routes` |
| `views/skill/edit/install.vue` | 改为 `@/api/skill/routes` |
| `views/skill/edit/readme.vue` | 改为 `@/api/skill/files` |
| `views/skill/index.vue` | 拆为 `@/api/skill/routes` + `@/api/skill/log` |

---

## 边界情况

| 场景 | 处理方式 |
|------|---------|
| 旧安装 skill 的 `installConfig` 缺失 | 更新弹窗为空表单，用户重新填写 |
| ZIP 安装 skill 更新 | 回填 `installConfig`，用户可修改后统一安装 |
| 本地 skill 更新 | `source !== 'community'`，拒绝更新 |
| 覆盖安装失败 | 保留旧目录（install catch 已有保护） |

---

## 验证结果
- [x] 旧文件 `packages/web/src/api/skill.js` 已删除
- [x] 全局搜索 `packages/web/src` 无 `from '@/api/skill'` 残留
- [x] 5 个新文件均存在
- [x] 5 个调用方 import 已更新

---

## 参考文件
- `packages/server/src/routes/skill/`（server 端拆分结构）
- `packages/web/src/api/skill/`（前端新拆分结构）
- `.codewhale/skill-reinstall-plan.md`（详细方案文档）

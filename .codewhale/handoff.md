# Handoff — Skill 前端 API 拆分

> 最后更新: 2026-07-03
> 状态: **已完成**

## 本次目标
将 `packages/core/src/skill/index.js`（大泥球）按职责拆分为 6 个文件；保留 `SkillManager` 单类对外不变，内部改为薄委托。

---

## 已完成工作

### 1. 新建 6 个 skill 子模块
`packages/core/src/skill/` 目录下新增：

| 文件 | 职责 |
|------|------|
| `shared.js` | 通用函数：`_extractMeta`、`_parseGitHubUrl`、`_parseProxyUrl`、`emitSkillInstallLog` |
| `routes.js` | 列表查询、社区搜索、自动发现、current-project |
| `cmd.js` | enable/disable/remove/copy-to-project/update/remark/tags/meta |
| `files.js` | 文件列表、读写、删除、readme 读写 |
| `install.js` | GitHub/ZIP/Registry/本地/TreePath 安装 |
| `log.js` | 安装日志查询与清除 |

### 2. 重写 index.js
- `SkillManager` 类对外 API 保持完全不变
- 所有公共方法改为薄委托：`return Routes.listGlobal(this)` 等
- 内部辅助方法（`_mutate`、`_mutateAsync`、`_toggle`、`_findEntry`、`_syncToStore` 等）保留在类内
- 删除所有业务逻辑实现，代码量从 ~581 行降至 ~372 行

### 3. 修复的兼容性问题
- `routes.js:86` `const entries;` → `let entries;`（先声明后赋值）
- `_copyDir` 原使用 `require('node:fs')` / `require('node:path')`，ESM 下不可用 → 改为顶部 `import` + 直接调用
- 补全 `join`、`existsSync`、`mkdirSync`、`readdirSync`、`copyFileSync` 等顶部 import

### 4. 删除旧代码
- 旧 `packages/web/src/api/skill.js` 已于上一阶段删除
- 本轮无需删除 `packages/core/src/skill/index.js`（已重写为薄壳）

---

## 验证结果
- [x] 6 个新文件语法校验通过（`node --check`）
- [x] `packages/core/src/skill/index.js` 语法校验通过
- [x] `npm run build` 构建成功（Vite 0 errors）
- [x] `packages/core/src/index.js` 的 `export { SkillManager } from './skill/index.js'` 无需修改
- [x] 前端调用方 import 已更新（上阶段完成）

---

## 边界情况
| 场景 | 处理方式 |
|------|---------|
| 旧安装 skill 的 `installConfig` 缺失 | 更新弹窗为空表单，用户重新填写 |
| ZIP 安装 skill 更新 | 回填 `installConfig`，用户可修改后统一安装 |
| 本地 skill 更新 | `source !== 'community'`，拒绝更新 |
| 覆盖安装失败 | 保留旧目录（install catch 已有保护） |

---

## 参考文件
- `packages/core/src/skill/`（新拆分结构）
- `packages/core/src/skill/index.js`（薄委托壳）
- `.codewhale/skill-reinstall-plan.md`（详细方案文档）

# Handoff — 修复项目 Skill 读取问题

> 最后更新: 2026-07-04
> 状态: **已完成**

## 问题
拆分 `packages/core/src/skill/index.js` 后，`/api/skill/list/project` 始终返回 `[]`，无法读取项目级 skill。同时 `/api/skill/install` 报 500 错误（`createPendingInstall is not a function`）。

## 根因

### 问题 1：list/project 返回空
拆分后的代码中所有与项目 skill 相关的操作方法（`_getProjectInstalled`、`_setLevelInstalled`、`_addToConfig`、`_mutate`、`discover`、`_findEntry`）都硬性依赖 `this._projectEngine`。

但 `packages/server/index.js` 创建 `SkillManager` 时只传了 `engine`：
```js
const skillMgr = new SkillManager(engine);  // 没有 projectEngine
```

旧代码使用独立的 `this._projectInstalled[]` 内存数组 + `init()` 从 `store.skills.project_installed` 加载、`_syncToStore()` 持久化，不依赖 `_projectEngine`。

### 问题 2：_mergeDefaults 过滤 project_installed
`config.js` 的 `_mergeDefaults()` 中 `skills` 对象只保留了 `enabled`/`installed`/`community_cache`/`cached_at`，任何新字段（如 `project_installed`）在 `read()` 时被丢弃。这导致 `discover()` 中每次 `_getProjectInstalled()` 返回空数组，最终只有最后 1 个被持久化到 store.json。

### 问题 3：install 接口崩溃
`SkillManager` 缺少 `createPendingInstall`、`getPendingInstall`、`_pendingInstalls`、`skillsDir` getter — 拆分时漏掉。

### 问题 4：current-project 依赖 projectEngine
`routes.js` 的 `getCurrentProject()` 在 `_projectEngine` 为 null 时直接返回 `PROJECT_NOT_OPEN`。

## 修改

### `packages/core/src/skill/index.js`

| 方法 | 改动 |
|------|------|
| `_getProjectInstalled()` | 新增回退：`_projectEngine` 为 null 时从 `this._engine.read().skills.project_installed` 读取 |
| `_setLevelInstalled()` | project 层级不再要求 `_projectEngine`，无时写入 engine store |
| `_addToConfig()` | 同上，无 `_projectEngine` 时写入 engine store |
| `_mutate()` | hintLevel=project 时使用 `this._projectEngine \|\| this._engine`；无 hintLevel 时无条件搜索项目 skill |
| `_findEntry()` | 移除 `if (!entry && this._projectEngine)` 限制，始终可搜索项目 |
| `discover()` | 移除 `&& this._projectEngine`，项目目录存在即可扫描 |
| `constructor` | 新增 `this._pendingInstalls = new Map()` |
| `createPendingInstall()` | **恢复**（拆分时漏掉） |
| `getPendingInstall()` | **恢复**（拆分时漏掉） |
| `skillsDir` getter | **恢复**（拆分时漏掉） |
| imports | 新增 `import { randomUUID }` |

### `packages/core/src/utils/config.js`

| 位置 | 改动 |
|------|------|
| `DEFAULT_STORE.skills` | 新增 `project_installed: []` |
| `_mergeDefaults()` skills 对象 | 新增 `project_installed` 字段保留逻辑 |

### `packages/core/src/skill/routes.js`

| 位置 | 改动 |
|------|------|
| `getCurrentProject()` | 无 `_projectEngine` 时不再返回 `PROJECT_NOT_OPEN`，改用 `process.cwd()` + `_getProjectInstalled()` 作为回退 |

## 验证
- [x] `node --check` 三个文件语法通过
- [x] `npm run build` 构建成功（Vite 0 errors）
- [x] `/api/skill/list/project` 返回 6 个项目 skill（architecture, documentation, proxy-manager, skill-manager, ui-patterns, ui-ux-pro-max）
- [x] `/api/skill/current-project` 返回项目名 + 路径 + 6 个已安装 skill
- [x] 服务器启动不再报 `createPendingInstall is not a function`

## 参考
- `packages/core/src/skill/index.js` — 修改后的文件
- `packages/core/src/utils/config.js` — 修改后的文件
- `packages/core/src/skill/routes.js` — 修改后的文件
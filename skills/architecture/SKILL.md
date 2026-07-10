---
name: architecture
description: Use when designing new modules or refactoring across layers. Defines core/server/web three-layer separation and cross-layer data flow.
---

# 三层架构规则

codewhale-tool 的严格三层架构规范。所有开发必须遵循分层职责。

## 架构总览

```
Web UI (Vue 3)   →   Server (Express)   →   Core (业务逻辑)
  路由层职责:          中转层职责:            业务层职责:
  - 组件交互           - 参数提取             - 数据验证
  - 国际化             - guard 包装           - CRUD 操作
  - API 请求           - res.json             - 存储读写
  不直接操作 store     不实现业务逻辑          不处理 HTTP
```

## 第一层：Core 层（内核）

**位置**: `packages/core/src/`

**结构**:
```
src/
├── utils/                   ← 基础设施（不允许含业务逻辑）
│   ├── config.js            # ConfigEngine — JSON 存储引擎
│   ├── i18n.js              # 多语言（供应商映射 + SERVER_MSG）
│   ├── logger.js            # 统一日志（文件写入 + SSE 回调）
│   ├── result.js            # ok / okMsg / fail / failMsg 标准响应
│   └── store.js             # Store 通用列表管理器基类
├── provider/
│   ├── provider.js          # ProviderManager — 第三方供应商 + 模型管理
│   └── officialKey.js       # OfficialKeyManager — 官方 API key 管理
├── proxy.js                 # ProxyManager
├── token.js                 # TokenManager
├── project.js               # ProjectManager
├── sync.js                  # SyncManager — store.json ↔ config.toml
├── types.js                 # JSDoc 类型定义
├── download/                # GitHub Skill 下载引擎
│   ├── index.js             # downloadSkillFromGitHub 协调入口
│   ├── http.js              # Tar 流式 + API 并发下载
│   ├── git.js               # Git sparse-checkout
│   ├── zip.js               # ZIP 下载与解压
│   └── utils.js             # createAgent / parseRepoUrl
├── skill/                   # Skill 管理（薄门面 + 职责子模块）
│   ├── index.js             # SkillManager — 薄门面，委托给子模块
│   ├── store.js             # SkillStore — 数据访问层
│   ├── cmd.js               # 变更命令（更新/删除/复制）
│   ├── files.js             # 文件读写
│   ├── routes.js            # 查询路由
│   ├── install.js           # 安装/更新引擎
│   ├── log.js               # 安装日志
│   └── shared.js            # 共享元数据提取
└── index.js                 # 统一导出 @codewhale/core
```

**规则**:

- ConfigEngine 是数据访问的唯一入口，所有 Manager 通过它读写 store.json
- Manager 返回 `{ success: boolean, data?: any, message?: string }` 标准格式
- 使用 `ok(data)` 返回数据（查询类）
- 使用 `okMsg('key')` 返回成功消息（操作类，自动多语言）
- 使用 `failMsg('key')` 返回失败消息（自动多语言 + errorCode）
- 禁止导入 Express/HTTP 相关模块
- 禁止直接引用 `process.cwd()` 作为业务逻辑依赖（仅限 SkillManager 的少数方法）

### Store 基类（通用列表管理器）

`utils/store.js` 中的 `Store` 类抽取了 `project / proxy / token` 等模块的增删改查 + 设为默认共性逻辑。

子类只需提供：
- 存储访问器（getter/setter）
- id 前缀
- 校验/构建/掩码等差异片段

基类方法签名：
- `list(maskFn?)` — 返回 `ok(items)` 或 `ok(items.map(maskFn))`
- `add(input, { validate, build }, messageKey = 'added')` — 成功后 `okMsg(messageKey, entry)`
- `update(id, updates, notFoundCode = 'NOT_FOUND', sanitize?, messageKey = 'updated')` — 成功后 `okMsg(messageKey, entry)`
- `remove(id, notFoundCode = 'NOT_FOUND', messageKey = 'deleted')` — 成功后 `okMsg(messageKey, { removed: true })`
- `setDefault(id, notFoundCode = 'NOT_FOUND', messageKey = 'defaultSet')` — 成功后 `okMsg(messageKey, entry)`

子类无需再传 `messageKey`，也无需再用 `okMsg` 包装一层。只需：
```javascript
add(data) {
  return super.add(data, {
    validate: (input) => (!input.path ? failMsg('validationError') : null),
    build: (input) => ({ id: this.makeId(...), ... }),
  });
}
```

### 组合 vs 继承

- `project.js` / `proxy.js` / `token.js`：继承 `Store`，适合纯列表 CRUD + 设为默认的场景
- `officialKey.js`：**组合** `Store`。因为 `activate/remove` 需要特殊的 active 状态管理（如删除 active key 时的 fallback），不适合纯继承。内部持有一个 `_store` 实例，委托通用操作，特殊逻辑自行实现。
- `provider.js`：**不使用 Store 基类**。因为需要管理供应商 + 模型两层结构，以及复杂的激活/停用/模型切换逻辑。内部使用 `_mutate(id, fn)` 模板方法封装"查找-修改-保存"样板。

### Core Manager 代码模板

根据模块复杂度选择以下三种模板之一。完整骨架见 `skills/architecture/templates/` 目录。

- **纯列表 CRUD**（project / proxy / token）→ 继承 `Store`，见 `templates/manager-inherit.js`
- **需要特殊 active 状态管理**（officialKey）→ 组合 `Store`，见 `templates/manager-compose.js`
- **复杂嵌套结构**（provider）→ 独立 Manager，见 `templates/manager-independent.js`

**选择原则**：
- 只有列表增删改查 + 设为默认 → 继承 `Store`
- 大部分操作可复用 Store，但个别方法需要特殊逻辑 → 组合 `Store`
- 有嵌套结构、复杂状态机、自定义查询方法 → 独立 Manager

**共有规则**：
- 不手动调用 `ok()` / `okMsg()` 包装一层，基类已处理
- `list()` 如需脱敏，传入 `maskFn`
- 内部重复的"查找-修改-保存"逻辑统一收口到 `_mutateXxx` 模板方法
- 错误码集中在 `utils/i18n.js` 的 `SERVER_MSG` 管理

### Skill 模块模式

`skill/index.js` 采用"薄门面 + 职责子模块"模式：
- `SkillManager` 本身不实现业务逻辑，只做参数透传和模块调度
- 数据层委托给 `SkillStore`
- 变更命令委托给 `Cmd`
- 文件操作委托给 `Files`
- 查询委托给 `Routes`
- 安装引擎委托给 `Install`
- 日志委托给 `Log`

好处：单一职责、便于测试、避免大类爆炸。

### JSDoc 与命名约定

**JSDoc 最小规范**：
- 文件顶部必须有 `@module` 声明
- 公共方法必须有 `@param` 和 `@returns`
- 内部方法标记 `@private`

**命名约定**：
- 类名：`XxxManager`
- 单一职责目录：小写复数 `provider/`
- 平铺文件：小写单数 `proxy.js`
- id 前缀：小写 + 冒号 `project:` `proxy:`
- ConfigEngine：`getXxxs()` / `setXxxs()`
- Manager 查询：`list()` / `listProviders()`
- Manager 写操作：动词原形 `add()` / `update()` / `remove()` / `activate()`
- 内部模板方法：`_mutateXxx()`
- 敏感掩码：`maskKey()` / `maskToken()`

**添加新域名的 checklist**:
1. 在 `types.js` 中定义 `@typedef`
2. 在 `utils/i18n.js` 的 `SERVER_MSG` 中添加消息 key（4 种语言）
3. 在 `utils/config.js` 的 `ConfigEngine` 中添加 get/set 方法
4. 创建新的 Manager 类文件
5. 在 `index.js` 中添加导出

## 第二层：Server 层（中转）

**位置**: `packages/server/`

**结构**:
```
├── index.js              # 启动入口：初始化引擎 + 挂载路由 + 启动监听
├── src/
│   ├── utils/
│   │   └── guard.js      # guard / guardAsync / withSync / ok
│   └── routes/
│       ├── lang.js       # /api/lang
│       ├── officialKey.js
│       ├── provider.js
│       ├── proxy.js
│       ├── token.js
│       ├── skill.js
│       └── sync.js
```

**路由文件模板**:
```javascript
import { Router } from 'express';
import { guard, withSync } from '../utils/guard.js';

export function createXxxRouter(mgr, syncMgr) {
  const router = Router();

  // 查询
  /** 获取所有 XXX */
  router.get('/list', (_req, res) => {
    res.json(guard(() => mgr.list()));
  });

  // 写操作（需同步到 CodeWhale）
  /** 新增 XXX */
  router.post('/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => mgr.add(req.body))));
  });

  // 写操作（无需同步）
  /** 新增代理 */
  router.post('/add', (req, res) => {
    res.json(guard(() => mgr.add(req.body)));
  });

  return router;
}
```

**注释风格**：
- 路由注释使用 JSDoc 块注释 `/** 获取所有供应商 */`，不写 `// 查询` / `// 写操作`
- 文件顶部用模块级 JSDoc 说明职责和挂载路径

**严格禁止在路由中**:
- `import { existsSync, readFileSync, ... } from 'node:fs'`
- 直接调用 `engine.setXxx()` 或 `engine.getXxx()`
- 实现数组 `filter/map/slice` 等业务逻辑
- 手动拼装 `{ success: true, data: ... }` 对象
- `ok(null, getServerMessage(...))` → 必须用 `okMsg('key')`

**路由职责只有两项**:
1. 从 `req` 提取参数传给 Manager
2. 用 `guard()` / `guardAsync()` 包装 → `res.json()`

**withSync 使用规则**:
- 需要同步到 CodeWhale 的写操作：`withSync(syncMgr, () => mgr.method(...))`
- 不需要同步的写操作（代理、Token、Skill、项目）：直接 `guard(fn)`
- 当 Manager 方法内部已包含同步逻辑时（如 `syncMgr.activateAndSync()`），直接 `guard(fn)`，不再套 `withSync`

## 第三层：Web 层（前端）

**位置**: `packages/web/src/`

**结构**:
```
src/
├── main.js              # 入口（Vue 3 + i18n 初始化）
├── App.vue              # 根组件
├── api/                 # API 请求层（每个文件对应一个路由前缀）
├── views/               # 页面视图
│   ├── provider/
│   │   ├── index.vue    # 供应商管理页
│   │   └── edit/        # 弹窗组件
│   ├── proxy/
│   ├── skill/
│   └── token/
├── composition/         # 组合函数
│   └── dialog/
│       ├── Base.js      # 弹窗显隐 + 数据初始化
│       ├── Form.js      # 表单提交 + 新增/编辑模式
│       └── Container.js # 父组件弹窗管理
├── stores/              # Pinia 状态
├── locales/             # 多语言包（zh-Hans/en/ja/pt-BR）
└── utils/               # 工具函数（request.js / Masking.js）
```

**规则**:
- 不直接操作 `store.json` 或 `config.toml`
- 所有数据通过 `/api/*` 端点获取
- 弹窗统一使用 `composition/dialog/` 三层组合函数
- 每个 API 文件对应一个 API 路由前缀
- 国际化使用 `vue-i18n`，语言包在 `locales/`
- API 函数简洁封装：`ajaxBack` / `ajaxPostBack` / `ajaxPutBack` / `ajaxDeleteBack`
- 成功提示通过 `{ successMessage: true }` 参数自动触发

## 跨层规则

### 数据流向
```
Web → API 请求 → Server Route → guard() → Core Manager → ConfigEngine → data/store.json
                                                                        ↓
                                                          SyncManager ↔ config.toml
```

### 返回格式一致性
| 层 | 构造方式 | 示例 |
|----|---------|------|
| Core Manager | `ok(data)` / `okMsg('key')` | `return okMsg('added')` |
| Server Route | `guard(() => mgr.method(...))` | `res.json(guard(() => mgr.add(data)))` |
| Web API | `ajaxGet/post/put/delete` → 自动解包 `{ success, data, message }` |

### 消息文案收敛原则

- Core 层操作类成功消息统一收敛，不追求大量差异化文案
- `Store` 基类默认消息 key：`added` / `updated` / `deleted` / `defaultSet`
- 需要差异化时在子类调用时传入 `messageKey`，如 `super.update(id, data, 'projectNotFound', undefined, 'aliasUpdated')`
- 所有消息 key 集中在 `utils/i18n.js` 的 `SERVER_MSG` 中管理，前端无需额外配置
- 前端语言包只包含 UI 文案，不包含后端返回的 `SERVER_MSG`

### 错误处理链条
```
Manager 返回 failMsg → Route 中 guard 捕获异常 → Web 收到 { success: false, message: '...' } → ElMessage.error
```

### ConfigEngine 原子更新

- 使用 `engine.update((data) => { ... return newData; })` 进行读-改-写
- 所有 `setXxx()` 方法内部都应通过 `update()` 实现，保证原子性
- 写入前自动备份为 `.bak`

---

**版本**: 1.1  
**最后更新**: 2026-07-10  
**基于项目**: codewhale-tool v1.0

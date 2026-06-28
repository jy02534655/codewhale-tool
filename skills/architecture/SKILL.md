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
  - API 请求           - res.json            - 存储读写
  不直接操作 store     不实现业务逻辑          不处理 HTTP
```

## 第一层：Core 层（内核）

**位置**: `packages/core/src/`

**结构**:
```
src/
├── utils/          ← 基础设施（不允许含业务逻辑）
│   ├── config.js   # ConfigEngine — JSON 存储引擎
│   ├── i18n.js     # 多语言（供应商映射 + SERVER_MSG）
│   ├── logger.js   # 统一日志（文件写入 + SSE 回调）
│   └── result.js   # ok / okMsg / fail / failMsg 标准响应
├── provider.js     # ProviderManager + OfficialKeyManager
├── proxy.js        # ProxyManager
├── token.js        # TokenManager
├── sync.js         # SyncManager — store.json ↔ config.toml
├── types.js        # JSDoc 类型定义
├── download/       # GitHub Skill 下载引擎
│   ├── index.js    # downloadSkillFromGitHub 协调入口
│   ├── http.js     # Tar 流式 + API 并发下载
│   ├── git.js      # Git sparse-checkout
│   ├── zip.js      # ZIP 下载与解压
│   └── utils.js    # createAgent / parseRepoUrl
├── skill/
│   ├── index.js    # SkillManager
│   └── project.js  # ProjectSkillEngine
└── index.js        # 统一导出 @codewhale/core
```

**规则**:

- ConfigEngine 是数据访问的唯一入口，所有 Manager 通过它读写 store.json
- Manager 返回 `{ success: boolean, data?: any, message?: string }` 标准格式
- 使用 `ok(data)` 返回数据（查询类）
- 使用 `okMsg('key')` 返回成功消息（操作类，自动多语言）
- 使用 `failMsg('key')` 返回失败消息（自动多语言 + errorCode）
- 禁止导入 Express/HTTP 相关模块
- 禁止直接引用 `process.cwd()` 作为业务逻辑依赖（仅限 SkillManager 的少数方法）

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
  router.get('/list', (_req, res) => {
    res.json(guard(() => mgr.list()));
  });

  // 写操作（需同步到 CodeWhale）
  router.post('/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => mgr.add(req.body))));
  });

  // 写操作（无需同步）
  router.post('/add', (req, res) => {
    res.json(guard(() => mgr.add(req.body)));
  });

  return router;
}
```

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
- 需要同步到 CodeWhale 的写操作：`withSync(syncMgr, fn)`
- 不需要同步的写操作（代理、Token、Skill）：直接 `guard(fn)`

## 第三层：Web 层（前端）

**位置**: `packages/web/src/`

**结构**:
```
src/
├── main.js              # 入口（Vue 3 + i18n 初始化）
├── App.vue              # 根组件
├── api/                 # API 请求层
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

## 跨层规则

### 数据流向
```
Web → API 请求 → Server Route → guard() → Core Manager → ConfigEngine → store.json
                                                                        ↓
                                                          SyncManager ↔ config.toml
```

### 返回格式一致性
| 层 | 构造方式 | 示例 |
|----|---------|------|
| Core Manager | `ok(data)` / `okMsg('key')` | `return okMsg('added')` |
| Server Route | `guard(() => mgr.method(...))` | `res.json(guard(() => mgr.add(data)))` |
| Web API | `ajaxGet/post/put/delete` → 自动解包 `{ success, data, message }` |

### 错误处理链条
```
Manager 返回 failMsg → Route 中 guard 捕获异常 → Web 收到 { success: false, message: '...' } → ElMessage.error
```

---

**版本**: 1.0  
**最后更新**: 2026-06-28  
**基于项目**: codewhale-tool v0.3.0
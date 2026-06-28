---
name: module-template
description: Use when creating a new module or following the project's coding conventions. Provides architecture templates, naming conventions, and layer-by-layer development guides.
---

# 模块开发规范与模板 Skill

为 `codewhale-tool` 项目提供模块开发编码规范、架构模板和最佳实践指南。

## 概述

本 skill 基于当前项目架构提炼出一套可复用的开发模式，帮助为新功能模块遵循统一的编码规范和架构模式。

**适用场景**：

- 新增一个独立的功能领域
- 为现有功能添加新的 CRUD 操作
- 扩展现有模块字段
- 重构或优化现有模块结构

## 项目架构总览（v0.3.0）

```
codewhale-tool/
├── packages/
│   ├── core/                           # @codewhale/core — 核心逻辑库（无 UI 依赖）
│   │   ├── package.json
│   │   └── src/
│   │       ├── utils/                  # 基础设施
│   │       │   ├── config.js           # ConfigEngine — JSON 存储引擎
│   │       │   ├── i18n.js             # 多语言（供应商名 + 服务器消息 SERVER_MSG）
│   │       │   ├── logger.js           # 统一日志（文件写入 + SSE 回调）
│   │       │   └── result.js           # ok / okMsg / fail / failMsg 标准响应格式
│   │       ├── provider.js             # ProviderManager + OfficialKeyManager
│   │       ├── proxy.js                # ProxyManager
│   │       ├── token.js                # TokenManager
│   │       ├── sync.js                 # SyncManager — store.json ↔ config.toml
│   │       ├── types.js                # JSDoc 类型定义
│   │       ├── download/               # GitHub Skill 下载引擎
│   │       │   ├── index.js            # downloadSkillFromGitHub — 协调入口
│   │       │   ├── http.js             # Tar 流式下载 + API 并发下载
│   │       │   ├── git.js              # Git sparse-checkout 下载
│   │       │   ├── zip.js              # ZIP 下载与解压
│   │       │   └── utils.js            # createAgent、parseRepoUrl 等工具
│   │       ├── skill/                  # Skill 管理
│   │       │   ├── index.js            # SkillManager — 双层 Skill 管理
│   │       │   └── project.js          # ProjectSkillEngine — 项目级 skill 存储
│   │       └── index.js                # 统一导出入口
│   │
│   ├── server/                         # @codewhale/server — Express API 服务（纯中转层）
│   │   ├── index.js                    # 入口：初始化引擎、挂载路由、启动监听
│   │   ├── package.json
│   │   └── src/
│   │       ├── utils/
│   │       │   └── guard.js            # guard / guardAsync / withSync / ok
│   │       └── routes/
│   │           ├── lang.js             # /api/lang 语言切换
│   │           ├── officialKey.js      # /api/official-key/* 路由
│   │           ├── provider.js         # /api/provider/* 路由
│   │           ├── proxy.js            # /api/proxy/* 路由
│   │           ├── token.js            # /api/token/* 路由
│   │           ├── skill.js            # /api/skill/* 路由
│   │           └── sync.js             # /api/sync /api/init-sync 路由
│   │
│   └── web/                            # @codewhale/web — Vue 3 + Element Plus
│       ├── package.json
│       └── src/
│           ├── main.js                 # Vue 应用入口（i18n 初始化）
│           ├── App.vue                 # 根组件（语言切换 + 皮肤）
│           ├── router/index.js         # 前端路由
│           ├── api/                    # API 请求层
│           │   ├── officialKey.js
│           │   ├── provider.js
│           │   ├── proxy.js
│           │   ├── token.js
│           │   └── skill.js
│           ├── views/                  # 页面视图
│           │   ├── provider/           # 供应商 & 模型管理
│           │   ├── proxy/              # 代理管理
│           │   ├── skill/              # Skill 管理
│           │   └── token/              # Token 管理
│           ├── composition/            # 组合函数（Composables）
│           │   ├── dialog/
│           │   │   ├── Base.js         # 弹窗显隐、数据初始化
│           │   │   ├── Form.js         # 弹窗表单（新增/编辑模式 + 提交逻辑）
│           │   │   └── Container.js    # 父组件弹窗 ref 管理
│           │   └── form/               # 纯表单逻辑
│           ├── stores/                 # Pinia / reactive 状态
│           │   └── masking.js          # 全局加载状态
│           ├── locales/                # 多语言包
│           │   ├── zh-Hans.json
│           │   ├── en.json
│           │   ├── ja.json
│           │   └── pt-BR.json
│           └── utils/                  # 工具函数
│               ├── request.js          # ajaxGet / ajaxPost 等统一请求
│               ├── Masking.js          # API key 掩码
│               └── index.js
│
└── store.json                          # 本地 JSON 主存储
```

---

## 第一部分：代码规范

### 1. 文件与目录命名

| 类别 | 规范 | 示例 |
|------|------|------|
| JS 模块 | camelCase（匹配类名主词） | `provider.js` → `ProviderManager` |
| 基础设施 | 归类到 `utils/` | `utils/config.js`、`utils/i18n.js` |
| 子模块 | 按功能分目录 | `download/`、`skill/` |
| 路由文件 | 文件名对应 API 前缀 | `officialKey.js` → `/api/official-key/*` |
| Vue 组件 | camelCase 文件名 | `provider.vue`、`model.vue` |
| 弹窗组件 | 放在 `views/xxx/edit/` 下 | `views/provider/edit/provider.vue` |
| 页面入口 | 放在 `views/xxx/index.vue` | `views/provider/index.vue` |
| 目录名 | 单数名词 | `provider`、`skill`、`proxy` |

### 2. 文件头部注释

每个源文件以 JSDoc 块开头：

```javascript
/**
 * @codewhale/<package> — 简短模块描述
 *
 * 详细功能介绍，一行或多行。
 */
```

### 3. 类与方法注释

#### Manager 类

```javascript
/**
 * MyManager — 职能说明
 *
 * @example
 * const mgr = new MyManager(engine);
 * mgr.add({ key: 'value' });
 */
export class MyManager {
  /**
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }
}
```

#### 公共方法

```javascript
/**
 * 创建新条目
 * @param {string} name
 * @param {object} [opts]
 * @returns {{success: boolean, data?: any, message?: string}}
 */
add(name, opts = {}) { ... }
```

### 4. 行内注释

- 注释写在代码行**上方**
- 复杂逻辑段前用中文说明意图
- 使用 `//` 注释

### 5. 变量与函数命名

| 类别 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getActiveProvider` |
| 布尔变量 | is/has/can 前缀 | `isActive`、`hasPermission` |
| 私有成员 | `_` 前缀 | `this._engine`、`this._cache` |
| 常量 | 全大写 SNAKE_CASE | `DEFAULT_TIMEOUT` |
| 类名 | PascalCase | `ProviderManager` |

### 6. 错误处理与返回

#### 统一返回格式（core 层）

所有 Manager 的公共方法返回标准 `{ success, data, message }` 对象：

```javascript
// 查询类：返回数据，无消息
return ok(data);

// 操作类：有消息
return okMsg('added');                     // 自动翻译 → "已添加"
return okMsg('SYNC_MERGED', { merged: n }, { count: n });  // 带插值参数

// 失败
return failMsg('KEY_NOT_FOUND');           // 自动翻译 + errorCode = key
return fail('自定义错误消息', 'CUSTOM_CODE'); // 原始构造
```

#### server 路由层

```javascript
// 从 server/src/utils/guard.js 导入
import { guard, guardAsync, withSync } from '../utils/guard.js';

// 同步 handler
router.post('/add', (req, res) => {
  res.json(guard(() => myMgr.add(req.body)));
});

// 异步 handler
router.get('/search', async (req, res) => {
  res.json(await guardAsync(async () => myMgr.search(req.query.q)));
});

// 需要 CodeWhale 同步的写操作
router.post('/add', (req, res) => {
  res.json(guard(() => withSync(syncMgr, () => providerMgr.addProvider(req.body))));
});
```

**路由层禁止事项**：
- 禁止直接使用 `node:fs`（readFileSync、existsSync 等）
- 禁止直接操作 `ConfigEngine`
- 禁止实现过滤/组装/转换逻辑
- 只做两件事：提取参数 + guard 包装 + res.json

### 7. 类型定义

在 `packages/core/src/types.js` 中集中定义 JSDoc 类型：

```javascript
/**
 * @typedef {object} MyModuleEntry
 * @property {string} id           - 唯一标识
 * @property {string} name         - 显示名称
 * @property {string} [desc]       - 可选描述
 */
```

---

## 第二部分：分层开发模板

### 第 1 层：core — 核心 Manager 类

创建 `packages/core/src/<my-module>.js`。

**模板**：

```javascript
import { ok, okMsg, failMsg } from './utils/result.js';

export class MyManager {
  constructor(engine) { this._engine = engine; }

  list() {
    return ok(this._engine.getMyItems() || []);
  }

  add(opts) {
    const items = this.list().data;
    const id = opts.name;
    if (items.find(i => i.id === id)) return failMsg('ITEM_DUPLICATE');
    items.push({ id, active: false, ...opts });
    this._engine.setMyItems(items);
    return okMsg('added');
  }
}
```

**在 ConfigEngine 中添加存取方法**：

```javascript
// packages/core/src/utils/config.js
getMyItems() { return this.read().my_items || []; }
setMyItems(items) { this.update((d) => { d.my_items = items; return d; }); }
```

### 第 2 层：server — 路由模块

创建 `packages/server/src/routes/<my-module>.js`。

**模板**：

```javascript
import { Router } from 'express';
import { guard, withSync } from '../utils/guard.js';

export function createMyRouter(myMgr, syncMgr) {
  const router = Router();

  router.get('/list', (_req, res) => {
    res.json(guard(() => myMgr.list()));
  });

  router.post('/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => myMgr.add(req.body))));
  });

  return router;
}
```

在 `server/index.js` 中挂载：

```javascript
import { createMyRouter } from './src/routes/my-module.js';
app.use('/api/my-module', createMyRouter(myMgr, syncMgr));
```

### 第 3 层：web — 前端组件

**API 请求层** (`packages/web/src/api/<my-module>.js`)：

```javascript
import { ajaxGet, ajaxPost } from '@/utils/request';
export const getList = () => ajaxGet('/api/my-module/list');
export const addItem = (data) => ajaxPost('/api/my-module/add', data);
```

**页面视图** (`packages/web/src/views/<my-module>/index.vue`)：

- 使用 Element Plus `el-table` 展示列表
- 操作按钮触发弹窗（使用 `compositionDialogContainer` 模式）
- `ElMessage.success/error` 提示操作结果

**弹窗组件** (`packages/web/src/views/<my-module>/edit/<item>.vue`)：

- 使用 `compositionDialogForm`（新增+编辑）或 `compositionDialogBase`（纯新增）
- 关闭时 emit `saved` 事件，父组件刷新列表

---

## 第三部分：i18n 多语言

### core/server 层消息

在 `packages/core/src/utils/i18n.js` 的 `SERVER_MSG` 对象中为 4 种语言添加消息 key：

```javascript
'zh-Hans': { itemAdded: '已添加', itemDeleted: '已删除' },
'en':       { itemAdded: 'Added', itemDeleted: 'Deleted' },
'ja':       { itemAdded: '追加しました', itemDeleted: '削除しました' },
'pt-BR':    { itemAdded: 'Adicionado', itemDeleted: 'Excluído' },
```

### web 层 UI 文案

在 `packages/web/src/locales/{zh-Hans,en,ja,pt-BR}.json` 中添加 UI 文案 key。

---

## 第四部分：package.json 子路径导出

在 `packages/core/package.json` 的 `exports` 中添加新的子路径：

```json
"exports": {
  "./my-module": "./src/my-module.js"
}
```

---

**版本**：3.0
**最后更新**：2026-06-28
**基于项目**：codewhale-tool v0.3.0（utils/ 目录结构 + server/utils/guard.js 中转层模式）
---
name: provider-manager
description: Use when managing DeepSeek official API keys, third-party AI providers (SiliconFlow, OpenRouter, etc.), and model configurations with real-time CodeWhale sync.
---

# Provider Manager Skill

管理 CodeWhale 的第三方供应商、官方 API key 和模型配置。

## 概述

当用户需要管理 CodeWhale 的 AI 供应商配置时，使用本技能。这包括：

- **官方 DeepSeek API key** 管理（多个 key，支持别名切换）
- **第三方供应商**（SiliconFlow、OpenRouter、NVIDIA NIM 等）的增删改查
- **模型管理**：每个供应商下可管理多个模型，支持一键切换
- **实时双向同步**：所有变更自动写回 CodeWhale 的 `config.toml` 文件

## 项目架构（v0.3.0）

```
codewhale-tool/
├── packages/
│   ├── core/src/                       # 核心逻辑库（@codewhale/core）
│   │   ├── utils/
│   │   │   ├── config.js               # ConfigEngine — JSON 存储引擎（store.json）
│   │   │   ├── i18n.js                 # 多语言映射（供应商 labels + SERVER_MSG）
│   │   │   ├── logger.js               # 统一日志（文件 + SSE 回调）
│   │   │   └── result.js               # ok / okMsg / fail / failMsg 标准响应
│   │   ├── provider.js                 # ProviderManager + OfficialKeyManager
│   │   ├── proxy.js                    # ProxyManager
│   │   ├── token.js                    # TokenManager
│   │   ├── sync.js                     # SyncManager — store.json ↔ config.toml
│   │   ├── download/                   # GitHub Skill 下载引擎
│   │   ├── skill/                      # SkillManager + ProjectSkillEngine
│   │   └── index.js                    # 统一导出
│   │
│   ├── server/                         # Express API 服务（@codewhale/server）
│   │   ├── index.js                    # 入口：初始化引擎、挂载路由、启动
│   │   └── src/
│   │       ├── utils/
│   │       │   └── guard.js            # guard / guardAsync / withSync / ok
│   │       └── routes/
│   │           ├── lang.js             # /api/lang
│   │           ├── officialKey.js      # /api/official-key/*
│   │           ├── provider.js         # /api/provider/*（含模型管理）
│   │           ├── proxy.js            # /api/proxy/*
│   │           ├── token.js            # /api/token/*
│   │           ├── skill.js            # /api/skill/*
│   │           └── sync.js             # /api/sync, /api/init-sync
│   │
│   └── web/src/                        # Vue 3 Web UI（@codewhale/web）
│       ├── api/
│       │   ├── officialKey.js          # 官方 key 相关 API 请求
│       │   ├── provider.js             # 供应商/模型相关 API 请求
│       │   ├── proxy.js                # 代理相关 API 请求
│       │   ├── token.js                # Token 相关 API 请求
│       │   └── skill.js                # 技能相关 API 请求
│       ├── views/
│       │   ├── provider/               # 供应商 & 模型管理
│       │   │   ├── index.vue           # 页面主入口
│       │   │   └── edit/
│       │   │       ├── provider.vue    # 供应商新增/编辑弹窗
│       │   │       ├── model.vue       # 模型新增弹窗
│       │   │       └── officialKey.vue # 官方 key 新增/编辑弹窗
│       │   ├── proxy/                  # 代理管理
│       │   ├── skill/                  # Skill 管理
│       │   └── token/                  # Token 管理
│       ├── composition/
│       │   └── dialog/
│       │       ├── Base.js             # 弹窗基础组合函数
│       │       ├── Form.js             # 弹窗表单组合函数（新增/编辑）
│       │       └── Container.js        # 父组件弹窗容器管理
│       └── stores/masking.js           # 全局加载状态管理
│
└── store.json                          # 本地 JSON 存储文件
```

## 触发规则

当用户提及以下话题时激活本技能：

- "管理供应商"、"添加 API key"、"切换模型"
- "CodeWhale 配置"、"第三方供应商"、"官方 DeepSeek key"
- "siliconflow 配置"、"openrouter 设置"
- "同步配置"、"测试 API 连通性"
- "供应商列表"、"激活供应商"

## 核心能力

### 1. 查看当前配置

- 读取 `store.json`（本地 JSON 存储）获取当前的官方 key、供应商列表、模型配置
- 检查 CodeWhale `config.toml`（`~/.codewhale/config.toml`）的同步状态
- 通过 `getActiveInfo()` 一次获取激活供应商 + 激活模型

### 2. 官方 API key 管理

- **添加**新的 DeepSeek 官方 API key（支持别名）
- **切换**激活的官方 key
- **更新**别名
- **删除** key（至少保留一个）

### 3. 第三方供应商管理

- **新增供应商**：提供 `provider` 类型、`api_key`、`label`、`base_url`、`models`
- **编辑供应商**：修改标签或 base_url
- **删除供应商**：从列表移除
- **激活/停用供应商**：使用 `activateAndSync` 或 `deactivateAndSync`

### 4. 模型管理

- **添加模型**：向指定供应商添加新模型
- **删除模型**：移除指定模型（至少保留一个）
- **设置激活模型**：`setActiveModelAndSync`

### 5. 同步操作

- **初始化同步**：`initSync()` 从 `config.toml` 合并到 `store.json`
- **实时同步**：修改后自动调用 `syncToCodeWhale()` 写回变更
- **withSync 包装**：server 路由层用 `withSync(syncMgr, fn)` 自动同步

## 工作流程

### 步骤 1：环境检查

1. 确认当前工作空间包含 `codewhale-tool` 项目
2. 检查 `store.json` 文件位置（项目目录优先，否则 `~/.codewhale/store.json`）

### 步骤 2：理解用户请求

- 询问或确认具体操作（添加、编辑、删除、切换、查看）
- 收集必要参数（provider 类型、api_key、label、base_url、models）

### 步骤 3：执行操作

#### 查看类操作

- 使用 API `/api/official-key/list`、`/api/provider/list`、`/api/provider/active`

#### 修改类操作

- **直接操作 server API**（推荐）：启动 `pnpm dev`，通过 API 端点进行 CRUD
- 若操作 Node.js 代码：`import` 相应 Manager 模块
- **务必验证变更是否生效**

## API 端点一览

```
GET    /api/official-key/list          → officialKey.js
POST   /api/official-key/add
PUT    /api/official-key/:id           → 更新别名
POST   /api/official-key/:id/activate
DELETE /api/official-key/:id

GET    /api/provider/list              → provider.js
GET    /api/provider/active             → getActiveInfo() — 一次返回激活供应商+模型
POST   /api/provider/models/add
POST   /api/provider/models/delete
POST   /api/provider/models/activate
GET    /api/provider/:id
POST   /api/provider/add
PUT    /api/provider/:id
DELETE /api/provider/:id
POST   /api/provider/:id/activate
POST   /api/provider/deactivate

POST   /api/sync                       → sync.js
POST   /api/init-sync
```

## 数据流与同步机制

```
store.json (本地 JSON 主存储)          config.toml (CodeWhale 运行时配置)
─────────────────────────────          ──────────────────────────────────
official_keys[]                   ←──→  api_key = "sk-xxx"
providers[]                       ←──→  provider = "siliconflow"
  │                                      [providers.siliconflow]
  ├─ provider, label                     api_key, base_url, model
  ├─ api_key, base_url
  └─ models[]
       ├─ name
       └─ active
```

**同步规则**：

- 第三方供应商：每种 provider 类型只保留激活的那个到 `config.toml`
- 同步时完全重建 `cwCfg.providers`（解决删除不同步）

## Server 层返回规范

路由文件从 `server/src/utils/guard.js` 导入工具：

```javascript
import { guard, withSync } from '../utils/guard.js';

// 查询类
router.get('/list', (_req, res) => {
  res.json(guard(() => providerMgr.listProviders()));
});

// 需要同步的写操作
router.post('/add', (req, res) => {
  res.json(guard(() => withSync(syncMgr, () => providerMgr.addProvider(req.body))));
});
```

**禁止在路由层**：
- 直接读写 `node:fs`
- 直接操作 `ConfigEngine`
- 实现组装/过滤逻辑
- `ok(null, getServerMessage(key))` 替代为 `okMsg(key)`

## Web 前端组合函数模式

弹窗组件使用三层组合函数架构：

| 层级 | 路径 | 用途 |
|------|------|------|
| `compositionDialogBase` | `composition/dialog/Base.js` | 弹窗显隐、数据初始化 |
| `compositionDialogForm` | `composition/dialog/Form.js` | 表单提交、新增/编辑模式切换 |
| `compositionDialogContainer` | `composition/dialog/Container.js` | 父组件管理弹窗 ref |

## 错误处理

| 场景 | 操作 |
|------|------|
| API key 无效 | HTTP 401/403 → 请用户检查 key |
| 供应商类型不支持 | `getDefaultBaseUrl` 返回空 → 提示提供 base_url |
| 同步失败 | 检查 `~/.codewhale/` 目录权限 |
| 删除最后一个 | 拒绝操作，至少保留一个 |
| 显示 API key | 使用掩码（前 5 位...后 4 位） |

## 多语言支持

- `zh-Hans` - 简体中文（默认）
- `en` - English
- `ja` - 日本語
- `pt-BR` - Português (BR)

## 依赖与约束

- Node.js 18+
- `codewhale-tool` 项目代码
- 访问 `~/.codewhale/` 目录的读写权限
- **绝不记录明文 API key**

---

**版本**：3.0
**最后更新**：2026-06-28
**基于项目**：codewhale-tool v0.3.0
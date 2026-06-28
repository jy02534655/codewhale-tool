# 设计思路与方案

## 🐋 项目定位

codewhale-tool 是一个 CodeWhale 运行时配置的可视化管理工具。CodeWhale 本身使用 TOML 格式的 `~/.codewhale/config.toml` 作为运行时配置，但 TOML 不适合做频繁的增删改查操作。本工具引入独立的 JSON 存储层（`store.json`），并保持与 CodeWhale TOML 配置的双向实时同步。

## 架构分层

```
┌─────────────────────────────────────────────┐
│                   Web UI                     │
│          Vue 3 + Element Plus + i18n        │
│          views/{provider,proxy,skill,token}/ │
├─────────────────────────────────────────────┤
│              @codewhale/server               │
│  Express API 服务 — 纯中转层                  │
│  src/utils/guard.js  (guard/guardAsync/withSync/ok) │
│  src/routes/{lang,officialKey,provider,       │
│              proxy,token,skill,sync}.js       │
├─────────────────────────────────────────────┤
│              @codewhale/core                  │
│  ┌──────────────────┬──────────────────────┐ │
│  │ utils/           │ 业务模块              │ │
│  │  config.js       │  provider.js          │ │
│  │  i18n.js         │  proxy.js             │ │
│  │  logger.js       │  token.js             │ │
│  │  result.js       │  sync.js              │ │
│  │                  │  download/            │ │
│  │                  │  skill/               │ │
│  └──────────────────┴──────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 三层职责

| 层 | 包名 | 职责 | 不做什么 |
|----|------|------|---------|
| **core** | `@codewhale/core` | 业务逻辑、存储、同步、数据结构 | 不处理 HTTP 请求 |
| **server** | express 应用 | 路由注册、参数提取、`guard` 包装 | 不实现业务逻辑 |
| **web** | `@codewhale/web` | Vue 3 组件、API 调用、国际化 | 不直接操作 store |

### server 中转层规范

```
路由文件只做两件事：
  1. 从 req 取参数传给 Manager
  2. 用 guard/guardAsync 包装并 res.json

严禁在路由层：
  - 直接读写文件系统（node:fs）
  - 直接操作 ConfigEngine
  - 实现过滤/组装/转换逻辑
```

## 存储设计

### store.json (JSON)
本地主存储，数据结构：

```json
{
  "official_keys": [
    {
      "id": "official:sk-xxx",
      "alias": "主账号",
      "api_key": "sk-xxx",
      "active": true
    }
  ],
  "providers": [
    {
      "id": "siliconflow:sk-yyy",
      "provider": "siliconflow",
      "label": "硅基流动",
      "api_key": "sk-yyy",
      "base_url": "https://...",
      "models": [
        { "name": "model-a", "active": true }
      ],
      "active": true
    }
  ],
  "proxies": [
    {
      "id": "proxy:xxx",
      "type": "http|socks5",
      "host": "127.0.0.1",
      "port": 1080,
      "label": "本地代理"
    }
  ],
  "tokens": [
    {
      "id": "token:xxx",
      "name": "GitHub Token",
      "token": "ghp_xxx",
      "label": "个人令牌"
    }
  ],
  "skills": { "enabled": true, "installed": [] }
}
```

### 主键设计

| 领域 | 主键格式 | 示例 |
|------|---------|------|
| 供应商 | `供应商类型:api_key` | `siliconflow:sk-abc` |
| 官方 key | `official:api_key` | `official:sk-xxx` |
| 代理 | `proxy:host:port` 或 `proxy:随机ID` | `proxy:127.0.0.1:1080` |
| Token | `token:名称` 或 `token:随机ID` | `token:github_pat` |

## 同步策略

### 启动时 (initSync)
1. 读取 `~/.codewhale/config.toml`
2. 读取 `store.json`
3. 按 api_key 做主键合并：本地有则不覆盖，本地无则新增
4. 根据 codewhale 的 `provider` 和 `[providers.xxx].model` 设置激活状态

### 修改时 (syncToCodeWhale)
1. 读取本地 `store.json`
2. 完全用本地数据重建 `cwCfg.providers`
3. 写入 codewhale config.toml

## 返回规范

### core 层统一格式

```javascript
{ success: true, data: any, message: '' }    // ok(data, message)
{ success: false, data: null, message: '...' } // fail(message, errorCode)
```

### 多语言快捷方法

```javascript
okMsg('added')           // 自动翻译 → { success: true, message: '已添加' }
okMsg('SYNC_MERGED', { merged: n }, { count: n })  // 带插值
failMsg('KEY_NOT_FOUND') // 自动翻译 → { success: false, message: '...', errorCode: 'KEY_NOT_FOUND' }
```

## 多语言设计

| 代码 | 名称 | 覆盖范围 |
|------|------|---------|
| `zh-Hans` | 简体中文 | 默认，UI 文案 + 供应商名称 + 服务器消息 |
| `en` | English | 完整 |
| `ja` | 日本語 | 完整 |
| `pt-BR` | Português (BR) | 完整 |

## 边缘场景处理

| 场景 | 处理 |
|------|------|
| 删除正在激活的供应商 | 清空所有 `active`，codewhale 切回官方 API |
| 删除正在激活的模型 | 自动激活该供应商下第一个模型 |
| 删除唯一模型 | 拒绝（至少保留一个） |
| 删除最后一个官方 key | codewhale `api_key` 字段置空 |
| 添加同类型+同 api_key 供应商 | 拒绝（主键冲突） |
| 同类型多供应商写入 TOML | 每种只保留激活的 |

## 技术栈

| 层 | 技术 |
|----|------|
| 存储 | Node.js 原生 JSON（store.json）|
| TOML 读写 | smol-toml |
| Web 前端 | Vue 3 + Element Plus + Vue I18n + Pinia |
| API 服务 | Express |
| 下载引擎 | node-fetch + tar + adm-zip + git sparse-checkout |
| 构建 | Vite |
| 包管理 | pnpm workspaces |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.3.0 | 2026-06 | 架构重组：core/utils/ + server/utils/guard.js + 三层职责分离 |
| 0.2.0 | 2026-06 | JSON 存储、多供应商、模型管理、多语言、一体化启动 |
| 0.1.0 | 初始 | TOML 存储、基本 CRUD |
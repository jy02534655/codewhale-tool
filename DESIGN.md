# 设计思路与方案

## 🐋 项目定位

codewhale-tool 是一个 CodeWhale 运行时配置的可视化管理工具。CodeWhale 本身使用 TOML 格式的 `~/.codewhale/config.toml` 作为运行时配置，但 TOML 不适合做频繁的增删改查操作。本工具引入独立的 JSON 存储层（`store.json`），并保持与 CodeWhale TOML 配置的双向实时同步。

## 架构分层

```
┌─────────────────────────────────────────────┐
│                   Web UI                     │
│        ProviderView.vue (Vue 3 + i18n)      │
├─────────────────────────────────────────────┤
│              @codewhale/server               │
│           server.js (REST API)               │
├─────────────────────────────────────────────┤
│              @codewhale/core                 │
│  ┌──────────┬──────────┬──────────────────┐ │
│  │ ConfigEngine │ ProviderManager         │ │
│  │ (JSON I/O)   │ OfficialKeyManager      │ │
│  │              │ SkillManager            │ │
│  ├──────────────┴─────────────────────────┤ │
│  │ SyncManager (双向同步)                  │ │
│  ├────────────────────────────────────────┤ │
│  │ i18n.js (多语言供应商映射+服务器消息)      │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 存储设计

### store.json (JSON)
本地主存储，数据结构：

```json
{
  "official_keys": [
    {
      "id": "official:sk-xxx",    // 主键
      "alias": "主账号",
      "api_key": "sk-xxx",
      "active": true              // 同时只有一个激活
    }
  ],
  "providers": [
    {
      "id": "siliconflow:sk-yyy",  // 主键 = 供应商类型:api_key
      "provider": "siliconflow",   // 供应商类型标识
      "label": "硅基流动",          // 别名
      "api_key": "sk-yyy",
      "base_url": "https://...",
      "models": [
        { "name": "model-a", "active": true },
        { "name": "model-b", "active": false }
      ],
      "active": true               // 同时只有一个 third-party provider 激活
    }
  ],
  "skills": { "enabled": true, "installed": [] }
}
```

### 主键设计

- **供应商主键**：`供应商类型 + ":" + api_key`（如 `siliconflow:sk-abc`）。同一供应商类型下可以有多个不同 api_key 的配置。
- **官方 key 主键**：`"official:" + api_key`。支持多个官方 API key，同一时间只有一个激活。

### CodeWhale config.toml (TOML)
运行时配置格式（标准，不添加 `[model]` 段）：

```toml
api_key = "sk-xxx"              # 当前激活的官方 key
auth_mode = "api_key"
default_text_model = "deepseek-v4-pro"
provider = "siliconflow"        # 非空 = 使用第三方

[providers.siliconflow]
api_key = "sk-yyy"
base_url = "https://..."
model = "deepseek-ai/DeepSeek-V4-Pro"
```

### TOML 写入时的同类型冲突处理

CodeWhale 的 `[providers.xxx]` 按供应商类型（如 `siliconflow`）作为 key，不支持同类型多 key。写入 codewhale 时：
- 每种供应商类型只保留激活的 provider，其余仅存于本地 `store.json`
- 同步时完全重建 `cwCfg.providers`（解决删除不同步问题）

## 同步策略

### 启动时 (initSync)

1. 读取 `~/.codewhale/config.toml`
2. 读取 `store.json`
3. 按 api_key 做主键合并：本地有则不覆盖，本地无则新增
4. 根据 codewhale 的 `provider` 和 `[providers.xxx].model` 设置激活状态
5. 过滤无 api_key 的空 provider（如 `http_headers`）

### 修改时 (syncToCodeWhale)

1. 读取本地 `store.json`
2. 完全用本地数据重建 `cwCfg.providers`
3. 写入 codewhale config.toml
4. 保留 `auth_mode`、`default_text_model` 等非管理字段

## 多语言设计

### 数据层

`i18n.js` 提供供应商名称的多语言映射：
- `getProviderI18nLabel(providerId, locale)` — 获取单供应商在指定语言下的 label
- `getKnownProviders(locale)` — 获取供应商下拉列表

### 前端层

- Vue I18n (`vue-i18n`) 管理 UI 文案
- Element Plus 语言包联动：切换语言时同步切换 Element Plus 组件语言
- 语言偏好保存在 localStorage (`codewhale-locale`)

### 支持语言

| 代码 | 名称 | 供应商名称 | UI 文案 |
|------|------|-----------|---------|
| `zh-Hans` | 简体中文 | 中文优先 | ✅ |
| `en` | English | 英文 | ✅ |
| `ja` | 日本語 | 日文/英文混排 | ✅ |
| `pt-BR` | Português (BR) | 英文/葡萄牙文混排 | ✅ |

## 边缘场景处理

| 场景 | 处理 |
|------|------|
| 删除正在激活的供应商 | 清空所有 `active` 标记，codewhale 切回官方 API |
| 删除正在激活的模型 | 自动激活该供应商下第一个模型 |
| 删除唯一模型 | 拒绝（至少保留一个） |
| 删除最后一个官方 key | codewhale `api_key` 字段置空 |
| 添加同类型+同 api_key 供应商 | 拒绝（主键冲突） |
| 同类型多供应商写入 TOML | 按供应商类型分组，每种只保留激活的 |

## 技术栈

| 层 | 技术 |
|----|------|
| 存储 | Node.js 原生 JSON（store.json）|
| TOML 读写 | smol-toml |
| Web 前端 | Vue 3 + Element Plus + Vue I18n |
| API 服务 | Express（@codewhale/server） |
| 构建 | Vite |
| 包管理 | pnpm workspaces |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 0.2.0 | 2026-06 | JSON 存储、多供应商、模型管理、多语言、一体化启动 |
| 0.1.0 | 初始 | TOML 存储、基本 CRUD |
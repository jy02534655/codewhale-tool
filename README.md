# codewhale-tool

CodeWhale AI 配置管理工具 — 多语言、可视化、供应商与模型实时同步。

[English](./README.en.md) | [日本語](./README.ja.md) | [Português (BR)](./README.pt-BR.md)

---

## 🐋 关于本项目

本项目旨在探索 AI 辅助开发的边界。**作者虽然是程序员，但全程使用 CodeWhale 开发，截至目前没有手动调整过一行代码。**

从初始想法到架构设计，从代码编写到多语言翻译，从 bug 修复到文档撰写——所有工作都由 AI 在对话中完成。

---

## 功能

- **官方 API Key 管理**：多个官方 DeepSeek API key，支持别名、一键切换
- **供应商管理**：第三方供应商增删改查，主键 = 供应商类型 + api_key
- **模型管理**：每个供应商下可管理多个模型，一键切换激活模型
- **代理管理**：HTTP / SOCKS5 代理配置，供 Skill 下载等场景使用
- **Token 管理**：GitHub Token 等访问令牌管理
- **Skill 管理**：社区 Skill 安装/启用/禁用/更新，SSE 流式安装进度
- **实时同步**：所有变更自动写回 CodeWhale 运行时配置文件
- **多语言**：简体中文、English、日本語、Português (BR)

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 一键启动（后端 localhost:7000 + 前端 localhost:7200）
pnpm dev
```

访问 `http://localhost:7200` 使用 Web UI。

---

## 项目结构

```
codewhale-tool/
├── packages/
│   ├── core/               # @codewhale/core — 核心逻辑库
│   │   └── src/
│   │       ├── utils/          # 基础设施
│   │       │   ├── config.js   # ConfigEngine — JSON 存储引擎
│   │       │   ├── i18n.js     # 多语言映射（供应商名 + 服务器消息）
│   │       │   ├── logger.js   # 统一日志（文件 + SSE 回调）
│   │       │   └── result.js   # ok / okMsg / fail / failMsg
│   │       ├── provider.js     # ProviderManager + OfficialKeyManager
│   │       ├── proxy.js        # ProxyManager
│   │       ├── token.js        # TokenManager
│   │       ├── sync.js         # SyncManager — store.json ↔ config.toml
│   │       ├── download/       # GitHub Skill 下载引擎
│   │       ├── skill/          # SkillManager + ProjectSkillEngine
│   │       └── index.js        # 统一导出
│   │
│   ├── server/             # Express API 服务 — 纯中转层
│   │   ├── index.js            # 启动入口（初始化引擎 + 挂载路由）
│   │   └── src/
│   │       ├── utils/guard.js  # guard / guardAsync / withSync / ok
│   │       └── routes/
│   │           ├── lang.js         # /api/lang
│   │           ├── officialKey.js  # /api/official-key/*
│   │           ├── provider.js     # /api/provider/*
│   │           ├── proxy.js        # /api/proxy/*
│   │           ├── token.js        # /api/token/*
│   │           ├── skill.js        # /api/skill/*
│   │           └── sync.js         # /api/sync, /api/init-sync
│   │
│   └── web/                # @codewhale/web — Vue 3 + Element Plus
│       └── src/
│           ├── App.vue              # 根组件（语言切换 + 皮肤）
│           ├── main.js              # 入口（vue-i18n 初始化）
│           ├── api/                 # API 请求层
│           ├── views/               # 页面视图
│           │   ├── provider/        # 供应商 & 模型管理
│           │   ├── proxy/           # 代理管理
│           │   ├── skill/           # Skill 管理
│           │   └── token/           # Token 管理
│           ├── composition/         # 组合函数（Composables）
│           │   └── dialog/          # Base / Form / Container 弹窗模式
│           ├── stores/              # Pinia 状态
│           ├── locales/             # 多语言包（zh-Hans/en/ja/pt-BR）
│           └── utils/               # 工具函数（request / Masking）
├── store.json              # 本地 JSON 主存储
├── DESIGN.md               # 设计思路与架构
└── README.md               # 本文件
```

---

## 架构分层

| 层 | 包名 | 职责 | 禁止 |
|----|------|------|------|
| **core** | `@codewhale/core` | 业务逻辑、存储、同步 | 不处理 HTTP |
| **server** | express 应用 | 路由注册、参数提取、guard 包装 | 不实现业务逻辑 |
| **web** | `@codewhale/web` | Vue 3 组件、API 调用 | 不直接操作 store |

---

## 数据流

```
store.json (JSON)              CodeWhale config.toml (TOML)
─────────────────               ───────────────────────────
official_keys[]           ←──→  api_key = "sk-xxx"
providers[]               ←──→  provider = "siliconflow"
  ├ id (主键)                   [providers.siliconflow]
  ├ provider/类型                api_key / base_url / model
  ├ label (别名)
  ├ api_key
  ├ models[] → name / active
  └ active

proxies[]                         （仅本地存储，不同步到 CodeWhale）
tokens[]                          （仅本地存储，不同步到 CodeWhale）
skills.installed[]                （仅本地存储，不同步到 CodeWhale）
```

---

## 语言

| 语言 | 代码 | 文档 |
|------|------|------|
| 简体中文 | `zh-Hans` | 本文件 |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Web UI 右上角可切换语言，偏好持久化到 store.json。
# codewhale-tool

CodeWhale AI 配置管理工具 — 多语言、可视化、供应商与模型实时同步。

---

## 🐋 关于本项目

本项目旨在探索 AI 辅助开发的边界。**作者虽然是程序员，但全程使用 CodeWhale 开发，截至目前没有手动调整过一行代码。**

从初始想法到架构设计，从代码编写到多语言翻译，从 bug 修复到文档撰写——所有工作都由 AI 在对话中完成。这是一个关于"AI 是否能独立完成完整软件项目"的实验。

---

## 功能

- **官方 API Key 管理**：多个官方 DeepSeek API key，支持别名、一键切换
- **供应商管理**：第三方供应商增删改查，主键 = 供应商类型 + api_key
- **模型管理**：每个供应商下可管理多个模型，一键切换激活模型
- **实时同步**：所有变更自动写回 CodeWhale 运行时配置文件
- **多语言**：支持简体中文、English、日本語、Português (BR)
- **多入口**：CLI 命令行 + Vue 3 Web UI

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 一键启动（后端 + 前端自动串联）
pnpm dev

# 或分别启动
pnpm server    # API 后端 → localhost:3456
pnpm --filter @codewhale/web dev  # Vite 前端 → localhost:5173

# CLI 模式
pnpm cli key list
pnpm cli provider list
```

访问 `http://localhost:5173` 即可使用 Web UI。

---

## 项目结构

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — 核心逻辑库
│   │   └── src/
│   │       ├── config.js     # ConfigEngine — JSON 存储引擎
│   │       ├── provider.js   # ProviderManager + OfficialKeyManager
│   │       ├── skill.js      # SkillManager
│   │       ├── sync.js       # SyncManager — 双向实时同步
│   │       ├── i18n.js       # 多语言供应商映射
│   │       ├── probe.js      # API 连通性探测
│   │       └── index.js      # 统一导出
│   ├── cli/           # @codewhale/cli — commander CLI
│   │   └── src/index.js
│   └── web/           # @codewhale/web — Vue 3 + Element Plus
│       ├── src/
│       │   ├── App.vue               # 根组件（语言切换 + 皮肤）
│       │   ├── main.js               # 入口（vue-i18n 初始化）
│       │   ├── views/ProviderView.vue # 模型管理页面
│       │   └── locales/              # 多语言包
│       │       ├── zh-Hans.json
│       │       ├── en.json
│       │       ├── ja.json
│       │       └── pt-BR.json
│       └── server.js       # Express API 后端
├── scripts/
│   └── dev.mjs            # 一体化开发启动脚本
├── DESIGN.md               # 设计思路与方案
├── store.json              # 本地 JSON 存储文件
└── README.md               # 本文件
```

> **注意**：项目已从 TOML 迁移到 JSON 存储。旧的 `config.toml` / `config.example.toml` / `PROGRESS.md` 如存在可安全删除。

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
  ├ models[]
  │  ├ name
  │  └ active
  └ active
```

启动时自动从 CodeWhale 配置同步，修改时实时写回。无需手动同步按钮。

---

## 配置与存储

本地数据存储在 `store.json`（自动探测：项目目录优先 → `~/.codewhale/store.json`）：

```json
{
  "official_keys": [
    { "id": "official:sk-xxx", "alias": "主账号", "api_key": "sk-xxx", "active": true }
  ],
  "providers": [
    {
      "id": "siliconflow:sk-yyy",
      "provider": "siliconflow",
      "label": "硅基流动",
      "api_key": "sk-yyy",
      "base_url": "https://api.siliconflow.cn/v1",
      "models": [
        { "name": "deepseek-ai/DeepSeek-V4-Pro", "active": true },
        { "name": "deepseek-ai/DeepSeek-V4-Flash", "active": false }
      ],
      "active": true
    }
  ],
  "skills": { "enabled": true, "installed": [] }
}
```

---

## 语言

| 语言 | 代码 | 状态 |
|------|------|------|
| 简体中文 | `zh-Hans` | 默认，完整 |
| English | `en` | 完整 |
| 日本語 | `ja` | 完整 |
| Português (BR) | `pt-BR` | 完整 |

Web UI 右上角可切换语言，偏好保存在 localStorage。
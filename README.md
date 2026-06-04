# codewhale-tool

CodeWhale 配置管理工具 — 管理 AI 模型提供方和 Skills 的可视化工具包。

## 功能

- **Provider 管理**：支持 provider → API key 别名 → 多个模型的三级配置结构，动态切换
- **Skill 管理**：可视化的安装、启用/禁用、删除、社区搜索
- **多入口**：CLI 命令行 + Vue 3 Web UI + 可编程 API

## 快速开始

```bash
# 安装依赖
pnpm install

# CLI 模式
node packages/cli/src/index.js provider list

# Web UI 模式（终端 1：API 后端，终端 2：前端 dev server）
node packages/web/server.js          # API 后端 → localhost:3456
pnpm --filter @codewhale/web dev      # Vite 前端 → localhost:5173
```

## 项目结构

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — 核心逻辑库
│   │   └── src/
│   │       ├── config.js    # ConfigEngine — TOML 安全读写
│   │       ├── provider.js  # ProviderManager — 三级配置管理
│   │       ├── skill.js     # SkillManager — Skill 生命周期
│   │       ├── probe.js     # API 连通性探测
│   │       └── index.js     # 统一导出
│   ├── cli/           # @codewhale/cli — 命令行工具
│   │   └── src/
│   │       └── index.js     # commander CLI 入口
│   └── web/           # @codewhale/web — Web UI
│       ├── src/
│       │   ├── App.vue               # 根组件
│       │   └── views/
│       │       ├── ProviderView.vue  # Provider 管理
│       │       └── SkillView.vue     # Skill 管理
│       └── server.js       # Express API 后端
├── config.toml        # 示例配置文件
├── PROGRESS.md         # 开发进度日志
└── README.md           # 本文件
```

## CLI 命令

```bash
# Provider
codewhale-tool provider list              # 列出所有 provider
codewhale-tool provider tree              # 显示三级树形结构
codewhale-tool provider active            # 查看当前活动配置
codewhale-tool provider switch -k work    # 切换到指定 API key
codewhale-tool provider add deepseek -l DeepSeek    # 添加 provider
codewhale-tool provider add-key deepseek personal sk-xxx  # 添加 key
codewhale-tool provider probe deepseek personal        # 测试连通性

# Skill
codewhale-tool skill list                 # 列出已安装
codewhale-tool skill install pdf          # 安装
codewhale-tool skill show pdf             # 查看详情
codewhale-tool skill enable pdf           # 启用
codewhale-tool skill disable pdf          # 禁用
codewhale-tool skill search               # 搜索社区
```

## 配置文件格式

示例 `config.toml`：

```toml
[model]
active_provider = "deepseek"
active_api_key = "personal"
active_model = "deepseek-ai/DeepSeek-V4-Pro"

[providers.deepseek]
label = "DeepSeek"

[providers.deepseek.api_keys.personal]
key = "sk-xxxxxxxxxxxxxxxx"
label = "个人账号"
models = ["deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash"]
default_model = "deepseek-ai/DeepSeek-V4-Pro"

[skills]
enabled = true
installed = [
  { id = "pdf", path = "~/.codewhale/skills/pdf", enabled = true, source = "community" },
]
```

## 语言

| 语言 | 文档 |
|------|------|
| English | [README.en.md](./README.en.md) |
| 日本語 | [README.ja.md](./README.ja.md) |
| 简体中文 | 本文件 |
| Português (BR) | [README.pt-BR.md](./README.pt-BR.md) |
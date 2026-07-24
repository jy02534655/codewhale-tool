# codewhale-tool

CodeWhale AI 配置管理工具 — 多语言、可视化、供应商与模型实时同步。

[English](./README.en.md) | [日本語](./README.ja.md) | [Português (BR)](./README.pt-BR.md)

---

## 🐋 关于本项目

本项目旨在探索 AI 辅助开发的边界。**作者虽然是程序员，但全程使用 CodeWhale 开发，仅做了少量调整。模型主要使用 DeepSeek 和阶跃星辰，哪个便宜用哪个。**

从初始想法到架构设计，从代码编写到多语言翻译，从 bug 修复到文档撰写——所有工作都由 AI 在对话中完成。

---

## 功能

- **官方 API Key 管理**：多个官方 DeepSeek API key，支持别名、一键切换
- **供应商管理**：第三方供应商增删改查，主键 = 供应商类型 + api_key
- **模型管理**：每个供应商下可管理多个模型，一键切换激活模型
- **代理管理**：HTTP / SOCKS5 代理配置，供 Skill 下载等场景使用
- **Token 管理**：GitHub Token 等访问令牌管理
- **Skill 管理**：社区 Skill 安装/启用/禁用/更新，SSE 流式安装进度
- **通用设置**：Schema 驱动通用配置管理，读写 CodeWhale config.toml
- **实时同步**：所有变更自动写回 CodeWhale 运行时配置文件
- **多语言**：简体中文、English、日本語、Português (BR)

---

## 快速开始

```bash
# 安装依赖
npm install

# 一键启动（后端 localhost:7000 + 前端 localhost:7200）
npm run dev
```

访问 `http://localhost:7200` 使用 Web UI。

---

## 项目结构

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — 业务逻辑、存储、同步
│   │   └── src/
│   │       ├── settings/     # 通用设置模块（Schema 驱动 config.toml 读写）
│   │       ├── download/     # GitHub Skill 下载引擎
│   │       ├── skill/        # Skill 管理
│   │       ├── provider/     # 供应商管理
│   │       └── ...
│   ├── server/        # Express API 中转层
│   └── web/           # @codewhale/web — Vue 3 + Element Plus
├── skills/            # 项目级开发 Skill（架构、代理、UI 模式等）
├── scripts/dev.mjs    # 一体化开发启动脚本
├── store.json         # 本地 JSON 主存储
├── DESIGN.md          # 设计思路、架构详解、数据流、边缘场景
└── PROGRESS.md        # 开发进度
```

> 完整的源码目录树、模块索引见 [DESIGN.md](./DESIGN.md) → 架构分层。

---

## 架构概述

三层分离，单向依赖：

| 层 | 包名 | 职责 | 禁止 |
|----|------|------|------|
| **core** | `@codewhale/core` | 业务逻辑、存储、同步 | 不处理 HTTP |
| **server** | express 应用 | 路由注册、参数提取、guard 包装 | 不实现业务逻辑 |
| **web** | `@codewhale/web` | Vue 3 组件、API 调用 | 不直接操作 store |

---

## 功能页面（Web UI）

| 页面 | 路径 | 核心功能 |
|------|------|---------|
| 供应商管理 | `/views/provider/` | 官方 & 第三方供应商 CRUD、模型激活切换 |
| 代理管理 | `/views/proxy/` | HTTP / SOCKS5 代理新增、编辑、设为默认 |
| Skill 管理 | `/views/skill/` | 安装/搜索/启用/禁用、SSE 进度、SKILL.md 编辑 |
| Token 管理 | `/views/token/` | GitHub Token 增删改、安全掩码显示 |
| 通用设置 | `/settings` | CodeWhale config.toml 通用配置读写、恢复默认 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 存储 | Node.js 原生 JSON（store.json）+ smol-toml |
| Web 前端 | Vue 3 + Element Plus + Vue I18n + Pinia |
| API 服务 | Express |
| 下载引擎 | node-fetch + tar + adm-zip + git sparse-checkout |
| 构建 | Vite |
| 包管理 | npm workspaces |

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [DESIGN.md](./DESIGN.md) | 设计思路与架构：分层详解、存储设计、同步策略、返回规范、边缘场景、版本历史 |
| [PROGRESS.md](./PROGRESS.md) | 开发进度：已完成的功能模块与版本变更 |
| [skills/architecture/SKILL.md](./skills/architecture/SKILL.md) | 三层架构开发规范 |
| [skills/proxy-manager/SKILL.md](./skills/proxy-manager/SKILL.md) | 代理 & Token 模块开发指南 |
| [skills/skill-manager/SKILL.md](./skills/skill-manager/SKILL.md) | Skill 模块开发指南 |
| [skills/ui-patterns/SKILL.md](./skills/ui-patterns/SKILL.md) | UI 交互模式（弹窗/表单/表格/i18n） |
| [packages/core/src/settings/index.md](./packages/core/src/settings/index.md) | Settings 通用设置模块文档（Schema 驱动、config.toml 读写） |
| [.codewhale/handoff.md](./.codewhale/handoff.md) | 最近一次会话的移交记录（临时性） |

---

## 语言

| 语言 | 代码 | 文档 |
|------|------|------|
| 简体中文 | `zh-Hans` | 本文件 |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Web UI 右上角可切换语言，偏好持久化到 store.json。
# Provider Manager Skill

管理 CodeWhale 的第三方供应商、官方 API key 和模型配置。

## 概述

当用户需要管理 CodeWhale 的 AI 供应商配置时，使用本技能。这包括：
- **官方 DeepSeek API key** 管理（多个 key，支持别名切换）
- **第三方供应商**（SiliconFlow、OpenRouter、NVIDIA NIM 等）的增删改查
- **模型管理**：每个供应商下可管理多个模型，支持一键切换
- **实时双向同步**：所有变更自动写回 CodeWhale 的 `config.toml` 文件
- **API 连通性探测**：验证 API key 有效性并获取可用模型列表

本技能基于 `codewhale-tool` 项目，该项目提供 CLI 和 Web UI 两种入口。

## 触发规则

当用户提及以下任意话题时激活本技能：

- "管理供应商"、"添加 API key"、"切换模型"
- "CodeWhale 配置"、"第三方供应商"、"官方 DeepSeek key"
- "siliconflow 配置"、"openrouter 设置"
- "同步配置"、"测试 API 连通性"
- "供应商列表"、"激活供应商"

## 核心能力

### 1. 查看当前配置
- 读取 `store.json`（本地 JSON 存储）获取当前的官方 key、供应商列表、模型配置
- 检查 CodeWhale `config.toml` 的同步状态
- 显示激活的供应商和模型

### 2. 官方 API key 管理
- **添加**新的 DeepSeek 官方 API key（支持别名）
- **切换**激活的官方 key
- **更新**别名
- **删除** key（至少保留一个）

### 3. 第三方供应商管理
- **新增供应商**：提供 `provider` 类型、`api_key`、`label`（可选别名）、`base_url`（可选）、`models`（模型列表）
- **编辑供应商**：修改标签或 base_url
- **删除供应商**：从列表移除
- **激活/停用供应商**：设置当前使用的第三方供应商

### 4. 模型管理
- **添加模型**：向指定供应商添加新模型
- **删除模型**：移除指定模型（至少保留一个）
- **设置激活模型**：切换当前使用的模型

### 5. 同步操作
- **初始化同步**：从 CodeWhale `config.toml` 合并现有配置
- **实时同步**：将本地变更写回 `config.toml`
- **批量同步**：激活供应商/模型时自动同步

### 6. 连通性探测
- **单次探测**：验证指定供应商 + API key 的有效性
- **批量探测**：测试多个供应商的连通性
- **获取模型列表**：从 API 端点拉取可用模型

## 工作流程

### 步骤 1：环境检查
1. 确认当前工作空间包含 `codewhale-tool` 项目
2. 检查 `store.json` 文件位置（项目目录优先，否则 `~/.codewhale/store.json`）
3. 检查 CodeWhale `config.toml` 路径（`~/.codewhale/config.toml`）

### 步骤 2：理解用户请求
- 询问或确认具体操作（添加、编辑、删除、切换、查看、测试）
- 收集必要参数（provider 类型、api_key、label、base_url、models）

### 步骤 3：执行操作
根据请求类型调用相应模块：

#### 查看类操作
- 使用 `ConfigEngine` 读取 `store.json`
- 使用 `ProviderManager` 获取供应商列表
- 使用 `OfficialKeyManager` 获取官方 key 列表
- 使用 `SyncManager` 检查同步状态

#### 修改类操作
- 调用相应 Manager 的方法（`addProvider`、`activateProvider`、`addModel` 等）
- 自动触发 `SyncManager.syncToCodeWhale()` 写回变更
- 验证变更是否生效

#### 探测类操作
- 调用 `probeProvider` 函数测试连通性
- 解析返回的模型列表，提供可用选项

### 步骤 4：验证与反馈
- 读取更新后的配置确认变更
- 检查 `config.toml` 是否同步
- 向用户报告结果（成功/失败、错误信息）

## 工具使用指南

### 文件操作
- `read_file('store.json')` - 读取本地 JSON 配置
- `read_file('~/.codewhale/config.toml')` - 读取 CodeWhale 配置
- `write_file` / `edit_file` - 修改配置文件（谨慎使用）
  - 注：通常应通过 Manager 类修改，而非直接编辑文件

### Shell 命令
- `cd` 到项目根目录
- 运行 CLI 命令测试功能：
  ```bash
  pnpm cli provider list
  pnpm cli key list
  ```

### API 调用
- 使用 `fetch` 或 `curl` 测试供应商端点（如 `https://api.siliconflow.cn/v1/models`）
- 设置正确的 `Authorization: Bearer <api_key>` 头部

## 数据流与同步机制

```
store.json (本地管理)          config.toml (CodeWhale 使用)
─────────────────────          ───────────────────────────
official_keys[]           ←──→  api_key = "sk-xxx"
providers[]               ←──→  provider = "siliconflow"
  │                               [providers.siliconflow]
  ├─ provider, label              api_key, base_url, model
  ├─ api_key, base_url
  └─ models[]
       ├─ name
       └─ active
```

**同步规则**：
- 启动时从 `config.toml` 合并到 `store.json`（按 api_key 去重）
- 修改时实时写回 `config.toml`
- 第三方供应商：每种 provider 类型只保留激活的那个到 `config.toml`

## 错误处理

### 常见错误及解决
1. **API key 无效**
   - 症状：探测返回 HTTP 401/403
   - 操作：请用户检查 key 是否正确，是否有足够配额

2. **供应商类型不支持**
   - 症状：`getDefaultBaseUrl` 返回空字符串
   - 操作：提示用户提供 `base_url` 参数

3. **同步失败**
   - 症状：`syncToCodeWhale` 返回错误
   - 操作：检查 `~/.codewhale/` 目录权限，确认 TOML 格式有效

4. **模型重复**
   - 症状：`addModel` 返回 "模型已存在"
   - 操作：跳过或提示用户使用不同名称

5. **删除最后一个**
   - 症状：尝试删除最后一个官方 key 或最后一个模型
   - 操作：拒绝操作，提示至少保留一个

### 用户沟通
- 错误信息要友好，包含具体原因和建议
- 成功操作后提供简洁确认
- 涉及敏感信息（api_key）时使用掩码显示（前5位...后4位）

## 多语言支持

本技能支持多语言界面，语言代码：
- `zh-Hans` - 简体中文（默认）
- `en` - English
- `ja` - 日本語
- `pt-BR` - Português (BR)

供应商名称已本地化，如 "硅基流动"（中文）对应 "SiliconFlow"（英文）。

## 示例对话

### 示例 1：添加 SiliconFlow 供应商
**用户**：帮我添加一个硅基流动的供应商，API key 是 sk-abc123

**AI（使用本技能）**：
1. 确认 provider 类型为 `siliconflow`
2. 调用 `addProvider({ provider: 'siliconflow', api_key: 'sk-abc123' })`
3. 自动同步到 `config.toml`
4. 返回：`成功添加供应商 "siliconflow:sk-abc123"，已同步到 CodeWhale 配置`

### 示例 2：切换激活模型
**用户**：把当前供应商的模型切换到 DeepSeek-V4-Flash

**AI**：
1. 获取当前激活的供应商 ID
2. 调用 `setActiveModelAndSync(providerId, 'deepseek-ai/DeepSeek-V4-Flash')`
3. 验证变更
4. 返回：`已将模型切换为 deepseek-ai/DeepSeek-V4-Flash，配置已同步`

### 示例 3：测试连通性
**用户**：测试一下我所有供应商的 API key 是否有效

**AI**：
1. 获取所有供应商列表（含 api_key、base_url）
2. 调用 `probeMultiple` 批量测试
3. 汇总结果：成功/失败、延迟、可用模型数
4. 返回：`测试完成：3/4 个供应商连通正常，1 个失败（key 无效）`

## 依赖与约束

### 必需环境
- Node.js 18+ 环境
- `codewhale-tool` 项目代码（或已安装的 CLI）
- 访问 `~/.codewhale/` 目录的读写权限

### 安全注意事项
- **绝不记录明文 API key** 到日志或持久化存储
- 显示时使用掩码（`sk-abc...1234`）
- 操作前确认用户意图，特别是删除操作
- 同步前备份原始 `config.toml`

### 性能考虑
- 探测操作有 15 秒超时，避免长时间阻塞
- 批量操作时适当延迟，避免 API 速率限制
- 大配置文件（>1MB）分段读取

## 扩展建议

### 未来增强
1. **供应商模板**：预定义常用供应商配置（一键添加）
2. **配置导入/导出**：备份和分享配置集
3. **历史记录**：记录配置变更，支持回滚
4. **自动化测试**：定期检查 API 连通性，发送通知

### 集成可能
- 与 CodeWhale 任务系统集成，作为配置管理插件
- 与 MCP（Model Context Protocol）服务器对接，动态更新模型列表
- 提供 REST API 供外部工具调用

---

**版本**：1.0  
**最后更新**：2026-06-09  
**基于项目**：codewhale-tool（@codewhale/core v1.0）  
**维护者**：CodeWhale 社区
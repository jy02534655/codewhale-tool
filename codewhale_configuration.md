# CodeWhale 配置说明文档

> 基于 [CodeWhale/docs/CONFIGURATION.md](https://github.com/Hmbown/CodeWhale/blob/main/docs/CONFIGURATION.md) 整理

---

## 一、配置文件位置

- **默认路径**：`~/.codewhale/config.toml`（旧版兼容：`~/.deepseek/config.toml`）
- **CLI 覆盖**：`codewhale --config /path/to/config.toml`
- **环境变量覆盖**：`CODEWHALE_CONFIG_PATH=/path/to/config.toml`
- **项目级覆盖**：`<workspace>/.codewhale/config.toml`（安全子集，只能收紧不能放宽）
- **启动时加载**：工作区本地 `.env` 文件（如果存在）

---

## 二、核心配置项


### 2.2 安全与审批

| 配置项 | 作用 | 可选值 |
|--------|------|--------|
| `approval_policy` | 审批策略 | `on-request`（默认，每次请求审批）、`untrusted`（不信任时审批）、`never`（永不审批） |
| `sandbox_mode` | 沙箱模式 | `read-only`（只读）、`workspace-write`（工作区可写）、`danger-full-access`（完全访问）、`external-sandbox`（外部沙箱） |
| `allow_shell` | 是否允许 shell 工具 | `true` / `false`（交互模式默认可用，非交互需显式开启） |
| `permissions.toml` | 同级文件，定义细粒度权限规则 | `[[rules]]` 条目，含 `tool`、`command`、`path` |

---

### 2.3 子代理（Sub-agents）

| 配置项 | 作用 | 默认值 / 范围 |
|--------|------|---------------|
| `max_subagents` | 最大并发子代理数 | 默认 20，限制 1~20 |
| `[subagents].max_concurrent` | 同上，优先级更高 | 同上 |
| `[subagents].max_admitted` | 排队+运行总数上限 | 默认 200，范围 `max_concurrent`~200 |
| `[subagents].launch_concurrency` | 同时启动的直接子代理数 | 默认等于 `max_subagents` |
| `[subagents].max_depth` | 子代理嵌套深度 | — |
| `[subagents].token_budget` | 令牌预算 | 0 表示无限制 |
| `[subagents].api_timeout_secs` | API 超时 | 默认 120 秒，范围 1~1800 |
| `[subagents].heartbeat_timeout_secs` | 心跳超时 | 默认 300 秒，范围 30~3600 |
| `[subagents].default_model` | 默认子代理模型 | — |
| `[subagents].worker_model` | Worker 角色模型 | — |
| `[subagents].explorer_model` | Explorer 角色模型 | — |
| `[subagents].awaiter_model` | Awaiter 角色模型 | — |
| `[subagents].review_model` | Review 角色模型 | — |
| `[subagents].custom_model` | 自定义角色模型 | — |
| `[subagents.providers.<provider>]` | 按提供商覆盖子代理配置 | 支持 `enabled`、`max_concurrent`、`max_admitted`、`launch_concurrency`、`max_depth`、`token_budget`、`api_timeout_secs`、`heartbeat_timeout_secs` |

---

### 2.4 上下文管理

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `[context].enabled` | 启用 Fin 快速路径管理 | `false`（需手动开启） |
| `[context].verbatim_window_turns` | 完整保留的最近轮数 | 16 |
| `[context].l1_threshold` | L1 阈值 | 192000 |
| `[context].l2_threshold` | L2 阈值 | 384000 |
| `[context].l3_threshold` | L3 阈值 | 576000 |
| `[context].seam_model` | 接缝模型 | `deepseek-v4-flash` |
| `CODEWHALE_CACHE_MAXIMAL` | 缓存最大化模式（环境变量） | `1`/`true`/`on`/`yes` |

---

### 2.5 重试机制

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `[retry].enabled` | 启用重试 | `true` |
| `[retry].max_retries` | 最大重试次数 | 3 |
| `[retry].initial_delay` | 初始延迟（秒） | 1.0 |
| `[retry].max_delay` | 最大延迟（秒） | 60.0 |
| `[retry].exponential_base` | 指数退避基数 | 2.0 |

---

### 2.6 容量控制（实验性）

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `[capacity].enabled` | 启用容量控制器 | `false` |
| `[capacity].low_risk_max` | 低风险上限比例 | 0.50 |
| `[capacity].medium_risk_max` | 中风险上限比例 | 0.62 |
| `[capacity].severe_min_slack` | 严重风险最小余量 | -0.25 |
| `[capacity].severe_violation_ratio` | 严重违规比例 | 0.40 |
| `[capacity].refresh_cooldown_turns` | 刷新冷却轮数 | 6 |
| `[capacity].replan_cooldown_turns` | 重规划冷却轮数 | 5 |
| `[capacity].max_replay_per_turn` | 每轮最大重放 | 1 |
| `[capacity].min_turns_before_guardrail` | 护栏前最小轮数 | 4 |
| `[capacity].profile_window` | 分析窗口 | 8 |
| `[capacity].deepseek_v3_2_chat_prior` | V3.2 Chat 优先级 | 3.9 |
| `[capacity].deepseek_v3_2_reasoner_prior` | V3.2 Reasoner 优先级 | 4.1 |
| `[capacity].deepseek_v4_pro_prior` | V4 Pro 优先级 | 3.5 |
| `[capacity].deepseek_v4_flash_prior` | V4 Flash 优先级 | 4.2 |
| `[capacity].fallback_default_prior` | 回退默认优先级 | 3.8 |

---

### 2.7 通知

| 配置项 | 作用 | 可选值 / 默认值 |
|--------|------|---------------|
| `[notifications].method` | 通知方式 | `auto`（默认）、`osc9`、`bel`、`off` |
| `[notifications].threshold_secs` | 触发阈值（秒） | 30 |
| `[notifications].include_summary` | 包含摘要 | `false` |
| `[notifications].completion_sound` | 完成声音 | `beep`（默认）、`off`、`bell`、`file` |
| `[notifications].sound_file` | 自定义声音文件路径 | — |

---

### 2.8 TUI 界面与交互

| 配置项 | 作用 | 可选值 / 默认值 |
|--------|------|---------------|
| `theme` | 主题 | `system`（默认，自动检测）、`dark`、`light`、`grayscale`、`catppuccin-mocha`、`tokyo-night`、`dracula`、`gruvbox-dark` |
| `locale` | 界面语言 | `auto`（默认）、`en`、`ja`、`zh-Hans`、`pt-BR` |
| `default_mode` | 默认模式 | `agent`（默认）、`plan`、`yolo`（旧版 `normal` 映射为 `agent`） |
| `sidebar_focus` | 侧边栏焦点 | `pinned`（默认）、`auto`、`tasks`、`agents`、`context`、`hidden` |
| `show_thinking` | 显示思考过程 | on / off |
| `show_tool_details` | 显示工具详情 | on / off |
| `auto_compact` | 自动压缩上下文 | 模型感知默认开启 |
| `auto_compact_threshold_percent` | 自动压缩阈值 | 80（范围 10~100） |
| `paste_burst_detection` | 粘贴突发检测 | 默认 `on` |
| `mention_menu_limit` | @提及菜单候选数 | 默认 128 |
| `mention_walk_depth` | @提及遍历深度 | 默认 6（0 为无限） |
| `mention_menu_behavior` | @提及菜单行为 | `fuzzy`（默认）、`browser` |
| `cost_currency` | 成本显示货币 | `usd`（默认）、`cny`（别名 `rmb`、`yuan`） |
| `background_color` | 自定义背景色 | `#RRGGBB` 或 `default` |
| `max_history` | 输入历史条数 | — |
| `default_model` | 默认模型覆盖 | — |
| `tui.alternate_screen` | 备用屏幕 | `auto`、`always`、`never`（交互会话始终使用） |
| `tui.mouse_capture` | 鼠标捕获 | 默认 `true`（部分终端除外） |
| `tui.terminal_probe_timeout_ms` | 终端探测超时 | 默认 500，范围 100~5000 |
| `tui.stream_chunk_timeout_secs` | 流式块超时 | 默认 300，范围 1~3600 |
| `tui.osc8_links` | OSC 8 超链接 | macOS/Linux 默认开启，Windows 默认关闭 |
| `verbosity` | 输出详细程度 | `normal`（默认）、`concise` |

---

### 2.9 功能开关（Feature Flags）

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `[features].shell_tool` | Shell 工具 | `true` |
| `[features].subagents` | 子代理 | `true` |
| `[features].web_search` | 网页搜索 | `true` |
| `[features].apply_patch` | 应用补丁 | `true` |
| `[features].mcp` | MCP 协议 | `true` |
| `[features].exec_policy` | 执行策略 | `true` |
| `[features].vision_model` | 视觉模型 | 需手动开启 |

---

### 2.10 搜索提供商

| 配置项 | 作用 | 可选值 |
|--------|------|--------|
| `[search].provider` | 搜索后端 | `duckduckgo`（默认）、`bing`、`tavily`、`bocha`、`metaso`、`searxng`、`baidu`、`volcengine`、`sofya` |
| `[search].base_url` | 自定义搜索端点 | 可选（DuckDuckGo 兼容格式） |
| `[search].api_key` | API 密钥 | 部分提供商需要 |

---

### 2.11 其他路径配置

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `skills_dir` | 技能目录 | `~/.codewhale/skills` |
| `[skills].scan_codewhale_only` | 仅扫描 CodeWhale 技能 | `false` |
| `mcp_config_path` | MCP 配置文件 | `~/.codewhale/mcp.json` |
| `notes_path` | 笔记文件路径 | `~/.codewhale/notes.txt` |
| `memory_path` | 记忆文件路径 | `~/.codewhale/memory.md` |
| `[memory].enabled` | 启用用户记忆 | `false` |
| `[snapshots].enabled` | 启用文件快照 | `true` |
| `[snapshots].max_age_days` | 快照保留天数 | 7 |
| `[verifier].enabled` | 启用自动验证器 | `false` |
| `[verifier].verdict_policy` | 验证器裁决策略 | `hunt`（唯一当前策略） |

---

### 2.12 更新检查

| 配置项 | 作用 | 默认值 |
|--------|------|--------|
| `[update].check_for_updates` | 启动时检查更新 | `true` |
| `[update].update_uri` | 自定义更新镜像 | — |

---

### 2.13 热键栏（Hotbar）

```toml
[[hotbar]]
slot = 1
action = "mode.plan"
label = "Plan"

[[hotbar]]
slot = 2
action = "session.compact"
```

- `slot`：1~8
- `action`：动作 ID
- `label`：显示标签（可选）

---

### 2.14 自动审查（Auto Review）

```toml
[auto_review]
natural_language_guidance = "Prefer read-only inspection until the user asks for writes."

[[auto_review.allow]]
id = "read-only-inspection"
action_kind = "read"
reason = "Read-only inspection is safe to run automatically."

[[auto_review.block]]
id = "no-release-publish"
action_kind = "publish"
reason = "Release and publish actions require maintainer review."
```

- `action_kind` 可选值：`read`、`write`、`shell`、`network`、`git`、`mcp_read`、`mcp_action`、`browser`、`secret`、`publish`、`destructive`、`unknown`

---

### 2.15 指令源

```toml
instructions = [
    "./AGENTS.md",
    "~/.codewhale/global.md",
    "~/team/agents-shared.md",
]
```

- 路径支持 `~` 和环境变量展开
- 每个文件上限 100 KiB，超出会被截断
- 项目配置（`<workspace>/.codewhale/config.toml`）**忽略**此设置

---

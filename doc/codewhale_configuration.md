# CodeWhale 配置说明文档（含配置位置与可选值详解）

> 基于 [CodeWhale/docs/CONFIGURATION.md](https://github.com/Hmbown/CodeWhale/blob/main/docs/CONFIGURATION.md) 整理，修订日期：2026-08-13

---

## 配置文件体系总览

CodeWhale 的配置分散在多个文件中，**写入位置错误会导致配置被忽略或启动失败**。以下是所有配置位置的权威清单：

| 配置文件 | 路径 | 作用域 | 说明 |
|---------|------|--------|------|
| **主配置文件** | `~/.codewhale/config.toml`（旧版兼容：`~/.deepseek/config.toml`） | 用户全局 | **运行时策略、提供商、密钥、审批策略等核心配置** |
| **UI 偏好文件** | `~/.codewhale/settings.toml`（旧版兼容：`~/.deepseek/settings.toml`） | 用户全局 | **主题、布局、显示偏好等纯 UI 设置** |
| **权限规则文件** | `~/.codewhale/permissions.toml` | 用户全局 | **工具调用的精细化权限规则** |
| **项目覆盖配置** | `<workspace>/.codewhale/config.toml` | 项目级 | **仅允许收紧安全策略的安全子集** |
| **项目 Hooks** | `<workspace>/.codewhale/hooks.toml` | 项目级 | **项目生命周期钩子，需仓库被信任后加载** |
| **用户全局宪法** | `~/.codewhale/constitution.json` | 用户全局 | **个人行为偏好与停止条件** |
| **仓库本地宪法** | `.codewhale/constitution.json` | 仓库级 | **仓库权威策略、受保护不变量** |
| **项目指令** | `AGENTS.md`（兼容 `CLAUDE.md`、`.claude/instructions.md`） | 仓库级 | **跨代理项目工作指令（自然语言）** |
| **MCP 配置** | `~/.codewhale/mcp.json`（旧版兼容：`~/.deepseek/mcp.json`） | 用户全局 | **MCP 服务器列表与参数** |
| **技能目录** | `~/.codewhale/skills/`（或工作区 `./skills`、`.agents/skills`） | 用户/项目 | **Skill 包存储目录** |
| **记忆存储** | `~/.codewhale/memory/global/MEMORY.md` | 用户全局 | **用户记忆实际存储位置**（由 `memory_path` 锚定） |
| **工作区笔记** | `<workspace>/.deepseek/notes.md` | 工作区 | **工作区本地笔记** |
| **快照存储** | `~/.codewhale/snapshots/<project_hash>/<worktree_hash>/.git` | 用户全局 | **文件修改的 side-git 快照** |

> **重要原则**：`config.toml` 与 `settings.toml` 是**两个不同的文件**。运行时策略（如 `approval_policy`、`sandbox_mode`）必须写在 `config.toml`；主题、布局等 UI 偏好必须写在 `settings.toml`。TUI 内 `/config` 命令管理的是 `config.toml`，`/settings` 管理的是 `settings.toml`。

---

## 一、主配置文件（`~/.codewhale/config.toml`）

> 以下所有配置项**必须写入 `~/.codewhale/config.toml`**（或 CLI `--config` 指定的文件）。写入 `settings.toml` 会被忽略。

### 1.1 模型与提供商

| 配置项 | 作用 | 可选值 | 各值说明 |
|--------|------|--------|----------|
| `provider` | 选择 AI 提供商 | `deepseek` | **默认**。官方 DeepSeek 平台，endpoint 为 `https://api.deepseek.com` |
| | | `deepseek-anthropic` | DeepSeek 的 Anthropic Messages 兼容端点 `https://api.deepseek.com/anthropic` |
| | | `nvidia-nim` | NVIDIA NIM 托管的 DeepSeek 端点 `https://integrate.api.nvidia.com/v1` |
| | | `openai` | 通用 OpenAI 兼容端点，默认 `https://api.openai.com/v1` |
| | | `atlascloud` | AtlasCloud 兼容端点 `https://api.atlascloud.ai/v1` |
| | | `wanjie-ark` | 万界方舟兼容端点 `https://maas-openapi.wanjiedata.com/api/v1` |
| | | `volcengine` | 火山引擎 Ark 兼容端点 `https://ark.cn-beijing.volces.com/api/coding/v3` |
| | | `openrouter` | OpenRouter 端点 `https://openrouter.ai/api/v1` |
| | | `xiaomi-mimo` | 小米 MiMo 兼容端点，Token Plan 默认 `https://token-plan-sgp.xiaomimimo.com/v1` |
| | | `novita` | Novita AI 端点 `https://api.novita.ai/openai/v1` |
| | | `fireworks` | Fireworks AI 端点 `https://api.fireworks.ai/inference/v1` |
| | | `siliconflow` | SiliconFlow 国际端点 `https://api.siliconflow.com/v1` |
| | | `siliconflow-CN` | SiliconFlow 中国区域端点 `https://api.siliconflow.cn/v1` |
| | | `arcee` | Arcee AI 端点 `https://api.arcee.ai/api/v1`，默认模型 `trinity-large-thinking` |
| | | `moonshot` | Moonshot/Kimi 端点 `https://api.moonshot.ai/v1` |
| | | `sglang` | 自托管 SGLang，默认 `http://localhost:30000/v1`，通常无需 API Key |
| | | `vllm` | 自托管 vLLM，默认 `http://localhost:8000/v1`，通常无需 API Key |
| | | `ollama` | 本地 Ollama，默认 `http://localhost:11434/v1`，通常无需 API Key |
| | | `huggingface` | Hugging Face Inference Providers `https://router.huggingface.co/v1` |
| | | `together` | Together AI 端点 `https://api.together.xyz/v1` |
| | | `qianfan` | 百度千帆端点 `https://api.baiduqianfan.ai/v1` |
| | | `openai-codex` | ChatGPT/Codex OAuth 端点 `https://chatgpt.com/backend-api` |
| | | `anthropic` | Claude 原生 Messages API `https://api.anthropic.com` |
| | | `openmodel` | OpenModel 兼容端点 `https://api.openmodel.ai` |
| | | `zai` | Z.ai 端点 `https://api.z.ai/api/coding/paas/v4` |
| | | `stepfun` | 阶跃星辰端点 `https://api.stepfun.ai/v1` |
| | | `minimax` | MiniMax 端点 `https://api.minimax.io/v1` |
| | | `deepinfra` | DeepInfra 端点 `https://api.deepinfra.com/v1/openai` |
| | | `sakana` | Sakana AI Fugu 端点 `https://api.sakana.ai/v1` |
| | | `longcat` | 美团 LongCat 端点 `https://api.longcat.chat/openai/v1` |
| | | `opencode-go` | OpenCode Go Chat Completions `https://opencode.ai/zen/go/v1` |
| | | `meta` | Meta Model API |
| | | `mistral` | Mistral AI 端点 `https://api.mistral.ai/v1`，默认模型 `mistral-code-latest` |
| | | `telecomjs` | TelecomJS TokenHub `https://aigw.telecomjs.com/v1` |
| | | `xai` | xAI API-key 或 OAuth 端点 |
| | | `opencode-zen` | OpenCode Zen 网关，默认 `https://opencode.ai/zen/v1`，默认模型 `gpt-5.5` |
| | | `minimax-anthropic` | MiniMax Anthropic 兼容路由 `https://api.minimax.io/anthropic` |
| `api_key` | API 密钥 | 字符串 | 托管服务必填；自托管（SGLang/vLLM/Ollama）通常可省略 |
| `base_url` | API 基础地址 | 字符串 | 各提供商有默认值，仅当使用自定义网关或私有部署时才需覆盖 |
| `default_text_model` | 默认文本模型 | 因提供商而异 | 如 `deepseek-v4-pro`、`deepseek-v4-flash`、`claude-sonnet-4-6` 等。DeepSeek 官方当前推荐 `deepseek-v4-pro`（1M 上下文，384K 输出，默认启用 thinking）和 `deepseek-v4-flash`（快速路径）。**注意**：`deepseek-chat` 和 `deepseek-reasoner` 将于 2026-07-24 退役，直接路由自动迁移至 `deepseek-v4-flash` |
| `reasoning_effort` | 推理强度 | `off` | 完全关闭推理模式，直接输出答案 |
| | | `low` | 低强度推理，快速响应 |
| | | `medium` | 中等强度，平衡速度与深度 |
| | | `high` | 高强度推理，更深入的思考过程 |
| | | `max` | 最大推理深度，适合复杂问题 |
| | | `xhigh` | 极高强度（OpenAI Codex 映射为 Responses `xhigh`） |
| | | `ultracode` | 专为代码生成优化的最高推理强度 |
| `[providers.<name>].context_window` | 覆盖上下文窗口 | 整数（>0） | 当使用 OpenAI 兼容网关或自托管模型时，若实际窗口与 CodeWhale 静态元数据不一致，需手动指定。影响提示预算、压缩阈值和溢出检查 |
| `[providers.<name>].path_suffix` | 自定义 chat-completions 路径 | 字符串 | 部分网关不接受 `/v1/chat/completions`，可改为 `/chat/completions` 等。仅影响 chat 请求，`/models` 和 beta 路径保持原样 |
| `[providers.<name>].reasoning_stream_style` | 推理流式风格 | `separate_field` | 标准方式：通过 `reasoning_content` / `reasoning` 独立字段传输推理内容 |
| | | `inline_tags` | 网关在 `delta.content` 内流式传输 `<thinking>...</thinking>` 标签，需解析分离 |
| | | `none` | 不分离推理内容，全部作为普通答案文本渲染 |
| `[providers.<name>].insecure_skip_tls_verify` | 跳过 TLS 验证 | `true` / `false` | **已弃用保留键**。即使设为 `true`，运行时也会拒绝该配置。请改用 `SSL_CERT_FILE` 环境变量指向可信 CA 证书包 |
| `[providers.<name>].auth_mode` | 认证模式 | `api_key` | 默认 API Key 认证 |
| | | `oauth` | OAuth 认证（如 xAI） |
| `[providers.<name>].auth` | 认证源元数据 | `source = "command"` / `source = "secret"` | 供 `/provider` 和 `doctor` 报告认证来源类别，不暴露具体值 |

---

### 1.2 安全与审批（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 可选值 | 各值说明 |
|--------|------|--------|----------|
| `approval_policy` | 审批策略 | `on-request` | **默认**。每次执行工具（如 shell、文件写入）前都会弹窗请求用户确认 |
| | | `untrusted` | 仅对标记为"不可信"的操作请求审批，比 `on-request` 宽松但仍保留关键拦截 |
| | | `never` | 永不弹窗审批。配合 YOLO 模式可实现全自动执行，风险极高 |
| `[approval].default_selection` | 审批卡默认选项 | `deny` | **默认**。审批卡首次出现时高亮"拒绝"，直接按 Enter 会拒绝 |
| | | `allow_once` | 高亮"允许一次"，恢复 v0.9.6 之前的 Enter 即批准操作习惯 |
| `sandbox_mode` | 沙箱模式 | `read-only` | **最严格**。禁止任何文件系统写入，只能读取代码和文档 |
| | | `workspace-write` | 允许在工作区目录内写入文件，但禁止越界访问和系统级修改 |
| | | `danger-full-access` | 无沙箱限制，可读写任意路径。仅在完全可信环境中使用 |
| | | `external-sandbox` | 使用外部沙箱工具（如 Docker、Seatbelt、Landlock）进行隔离，具体行为取决于外部配置 |
| `allow_shell` | 是否允许 shell 工具 | `true` | 交互式 TUI 会话中默认可用 shell 工具（但仍受 `approval_policy` 控制） |
| | | `false` | 完全隐藏 `exec_shell` 工具，即使模型请求也无法调用 |

> **权限规则文件**：`permissions.toml` 与 `config.toml` 同级（默认 `~/.codewhale/permissions.toml`），支持 `[[rules]]` 条目。项目配置**不加载**项目级 `permissions.toml`。

---

### 1.3 子代理（Sub-agents）（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 默认值 / 范围 | 说明 |
|--------|------|---------------|------|
| `max_subagents` | 最大并发子代理数 | 默认 `64`，限制 `1~128` | 同时处于活跃状态的子代理数量上限 |
| `[subagents].max_concurrent` | 同上（优先级更高） | 默认 `64`，限制 `1~128` | 与 `max_subagents` 等价，但配置中优先级更高 |
| `[subagents].max_admitted` | 排队+运行总数上限 | 默认 `1024`，范围 `max_concurrent`~`1024` | 包括正在运行和排队等待的子代理总数。高扇出任务可以排队，但运行时启动压力受控 |
| `[subagents].launch_concurrency` | 同时启动的直接子代理数 | 默认等于 `max_subagents` | 一轮中同时启动多少子代理后再让其余排队。防止瞬间 burst 导致 API 限流 |
| `[subagents].max_depth` | 子代理嵌套深度 | — | 子代理可以递归委派子代理的最大层级深度 |
| `[subagents].token_budget` | 令牌预算 | `0` = 无限制 | 单次 `agent` 调用及其所有后代子代理的累计 Token 消耗上限。用于控制长任务成本 |
| `[subagents].api_timeout_secs` | API 超时 | 默认 `600`，范围 `1~3600` | 子代理单步模型调用的超时时间 |
| `[subagents].heartbeat_timeout_secs` | 心跳超时 | 默认 `300`，范围 `30~3600` | 子代理多久无响应会被视为僵死并清理。**必须大于 `api_timeout_secs`** |
| `[subagents].default_model` | 默认子代理模型 | — | 未指定角色时的 fallback 模型 |
| `[subagents].worker_model` | Worker 角色模型 | — | 执行具体编码/修改任务的子代理模型 |
| `[subagents].explorer_model` | Explorer 角色模型 | — | 探索代码库、搜索文件的子代理模型 |
| `[subagents].awaiter_model` | Awaiter 角色模型 | — | 等待外部事件、轮询结果的子代理模型 |
| `[subagents].review_model` | Review 角色模型 | — | 代码审查、验证结果的子代理模型 |
| `[subagents].custom_model` | 自定义角色模型 | — | 用户自定义角色的子代理模型 |
| `[subagents.providers.<provider>]` | 按提供商覆盖子代理配置 | 多个字段 | 可覆盖 `enabled`、`max_concurrent`、`max_admitted`、`launch_concurrency`、`max_depth`、`token_budget`、`api_timeout_secs`、`heartbeat_timeout_secs` |

---

### 1.4 上下文管理（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 默认值 | 说明 |
|--------|------|--------|------|
| `[context].enabled` | 启用 Fin 快速路径管理 | `false` | **需手动开启**。Fin 使用 `deepseek-v4-flash`（thinking 关闭）执行协调工作（路由、摘要、上下文维护），减轻主模型负担 |
| `[context].project_pack` | 包含项目上下文包 | `false` | 在稳定提示前缀中包含确定性的项目上下文包（大型格式化目录列表），适用于工具调用能力较弱的模型 |
| `[context].verbatim_window_turns` | 完整保留的最近轮数 | `16` | **已弃用**：自 2026-07-23 起被忽略，仅解析兼容不再读取 |
| `[context].l1_threshold` | L1 阈值 | `192000` | **已弃用**：自 2026-07-23 起被忽略 |
| `[context].l2_threshold` | L2 阈值 | `384000` | **已弃用**：自 2026-07-23 起被忽略 |
| `[context].l3_threshold` | L3 阈值 | `576000` | **已弃用**：自 2026-07-23 起被忽略 |
| `[context].seam_model` | 接缝模型 | `deepseek-v4-flash` | **已弃用**：自 2026-07-23 起被忽略 |
| `CODEWHALE_CACHE_MAXIMAL` | 缓存最大化模式 | `1`/`true`/`on`/`yes` | 开启后，每轮将活跃文件的**完整内容**（而非仅路径）注入系统提示，利用 DeepSeek KV 前缀缓存命中。文件未修改时块内容稳定，编辑后从该块开始 cache miss。默认每文件 24KB / 总计 96KB 上限 |

---

### 1.5 重试机制（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 默认值 | 说明 |
|--------|------|--------|------|
| `[retry].enabled` | 启用重试 | `true` | API 请求失败时自动重试 |
| `[retry].max_retries` | 最大重试次数 | `3` | 单次请求最多重试几次后仍失败则报错 |
| `[retry].initial_delay` | 初始延迟（秒） | `1.0` | 第一次重试前的等待时间 |
| `[retry].max_delay` | 最大延迟（秒） | `60.0` | 退避延迟的上限，防止无限增长 |
| `[retry].exponential_base` | 指数退避基数 | `2.0` | 每次重试延迟乘以该基数（如 1s → 2s → 4s → 8s...） |

---

### 1.6 通知（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 可选值 | 各值说明 |
|--------|------|--------|----------|
| `[notifications].method` | 通知方式 | `auto` | **默认**。自动检测终端：iTerm.app、Ghostty、WezTerm 使用 `osc9`；其他终端回退到 `bel`；Windows 上 `bel` 映射为 `MessageBeep(MB_OK)` |
| | | `osc9` | 发送 OSC 9 转义序列。在 tmux 中会自动包装 DCS 透传。支持 iTerm2、Terminal.app 13+、Ghostty、Kitty、WezTerm 等 |
| | | `bel` | 发送单个 BEL 字符。最保守的兼容性方案，几乎所有终端都支持响铃 |
| | | `off` | 完全关闭完成通知 |
| `[notifications].threshold_secs` | 触发阈值（秒） | 整数 | 默认 `30`。只有成功完成且耗时 ≥ 该值的回合才会触发通知。失败/取消的回合始终静默 |
| `[notifications].include_summary` | 包含摘要 | `true` / `false` | 默认 `false`。开启后通知体会包含耗时和该回合的估算费用 |
| `[notifications].completion_sound` | 完成声音 | `beep` | **默认**。使用系统默认蜂鸣声 |
| | | `off` | 关闭完成声音 |
| | | `bell` | 使用终端 bell（与 `bel` 通知方式类似但独立控制） |
| | | `file` | 播放自定义 WAV 文件（Windows 专用，通过 `sound_file` 指定路径） |
| `[notifications].sound_file` | 自定义声音文件路径 | 路径字符串 | 仅当 `completion_sound = "file"` 时生效。指向一个 WAV 文件，异步播放 |
| `[notifications].quiet` | 静音所有通知 | `true` / `false` | 默认 `false`。`true` 时抑制所有桌面通知和事件声音，但不改变其他配置 |

**`[notifications.events]`** — 按类别开关桌面通知（每项默认 `true`）：

```toml
[notifications.events]
turn-complete     = true   # 代理回合完成
subagent-terminal = true   # 子代理到达终止状态
approval-needed   = true   # 工具调用等待审批
input-needed      = true   # 代理提问等待输入
elevation-needed  = true   # 沙箱拒绝需要决策
model-notify      = true   # 模型调用 notify 工具
```

**`[notifications.event_sound]`** — 事件声音提示（默认关闭）：

```toml
[notifications.event_sound]
enabled         = false
events          = ["turn-complete", "approval-needed"]
min_interval_ms = 2000
quiet           = false
```

| 事件 | 提示音 |
|------|--------|
| `turn-complete` | BEL |
| `subagent-terminal` | BEL |
| `approval-needed` | 双 BEL |
| `input-needed` | BEL |
| `elevation-needed` | 双 BEL |
| `model-notify` | BEL |

---

### 1.7 功能开关（Feature Flags）（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 默认值 | 说明 |
|--------|------|--------|------|
| `[features].shell_tool` | Shell 工具 | `true` | 启用 `exec_shell` 工具，允许执行 shell 命令 |
| `[features].subagents` | 子代理 | `true` | 启用子代理委派和扇出功能 |
| `[features].web_search` | 网页搜索 | `true` | 启用 `web_search` 和兼容别名 `web.run`。默认使用 Firecrawl（无密钥，有每日限额），失败时降级到 DuckDuckGo 和 Bing |
| `[features].apply_patch` | 应用补丁 | `true` | 启用 `apply_patch` 工具，支持统一差异格式（unified diff）批量修改 |
| `[features].mcp` | MCP 协议 | `true` | 启用 Model Context Protocol 支持，可连接外部 MCP 服务器扩展工具集 |
| `[features].exec_policy` | 执行策略 | `true` | 启用执行策略引擎，对工具调用进行权限检查和审批 |
| `[features].vision_model` | 视觉模型 | `false` | 需手动开启。启用后可通过 `[vision_model]` 配置独立的图像分析模型（如小米 MiMo） |

---

### 1.8 搜索提供商（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 可选值 | 各值说明 |
|--------|------|--------|----------|
| `[search].provider` | 搜索后端 | `firecrawl` | **默认**。Firecrawl Cloud 无密钥搜索，有每日限额。失败时自动降级到 DuckDuckGo 和 Bing |
| | | `duckduckgo` | DuckDuckGo HTML 搜索，遇到机器人挑战时自动回退到 Bing |
| | | `bing` | 微软 Bing 搜索 |
| | | `tavily` | Tavily AI 搜索，需要 API Key |
| | | `bocha` | Bocha 搜索，需要 API Key |
| | | `metaso` | 秘塔搜索（metaso.cn），免费额度 100 次/天，API Key 可提升额度 |
| | | `searxng` | 自托管 SearXNG 实例，通过 JSON API 搜索。需配置 `base_url` |
| | | `baidu` | 百度 AI 搜索，需要 API Key |
| | | `volcengine` | 火山引擎搜索，需要 API Key |
| | | `sofya` | Sofya 搜索，返回完整提取的页面内容而非摘要。需要 `ay_live_...` 格式的 API Key |
| `[search].base_url` | 自定义搜索端点 | URL 字符串 | DuckDuckGo 兼容的自定义搜索端点（如内部搜索服务）。SearXNG 必须配置此项 |
| `[search].api_key` | API 密钥 | 字符串 | Tavily、Bocha、Baidu、Volcengine、Sofya 必需；Metaso 可选（提升额度）；Firecrawl 可选（认证限额） |

---

### 1.9 其他路径与功能配置（写入 `~/.codewhale/config.toml`）

| 配置项 | 作用 | 默认值 | 说明 |
|--------|------|--------|------|
| `skills_dir` | 技能目录 | `~/.codewhale/skills` | 每个技能是一个包含 `SKILL.md` 的目录。工作区本地 `.agents/skills` 或 `./skills` 优先于全局目录 |
| `[skills].scan_codewhale_only` | 仅扫描 CodeWhale 技能 | `false` | 设为 `true` 时，忽略 `.claude/skills`、`.opencode/skills`、`.cursor/skills`、`~/.agents/skills` 等跨工具根目录 |
| `[skills].registry_url` | 技能注册表地址 | — | 供 `/skills --remote`、`/skills suggest <task>`、`/skills sync` 使用 |
| `[skills].max_install_size_bytes` | 最大安装大小 | — | 远程技能安装的大小限制 |
| `mcp_config_path` | MCP 配置文件 | `~/.codewhale/mcp.json` | MCP 服务器配置文件路径。TUI 内可通过 `/mcp` 查看，修改后需重启 TUI 重建工具池 |
| `notes_path` | 笔记文件路径 | `~/.codewhale/notes.txt` | 模型可见的 `note` 工具使用的笔记文件路径 |
| `memory_path` | 记忆文件锚点路径 | `~/.codewhale/memory.md` | **顶层字段，不嵌套在 `[memory]` 下**。<br><br>⚠️ **反直觉行为**：`memory_path` 指定的文件名**不是实际写入的文件**。CodeWhale 会以其父目录为根，自动创建 `memory/global/MEMORY.md` 目录结构。例如设置 `memory_path = "~/my_notes/ideas"`，实际文件是 `~/my_notes/memory/global/MEMORY.md`，而非 `~/my_notes/ideas.md`！ |
| `[memory].enabled` | 启用用户记忆 | `false` | 开启后，TUI 加载记忆文件到 `<user_memory>` 提示块，启用 `# foo` 快速捕获和 `remember` 工具 |
| `[snapshots].enabled` | 启用文件快照 | `true` | 为文件修改创建 side-git 快照，支持回滚。快照存储在 `~/.codewhale/snapshots/...`，从不使用工作区自身的 `.git` |
| `[snapshots].max_age_days` | 快照保留天数 | `7` | 超过该天数的快照自动清理 |
| `[verifier].enabled` | 启用自动验证器 | `false` | 开启后，模型声称任务完成时会自动运行验证器预览检查 |
| `[verifier].verdict_policy` | 验证器裁决策略 | `hunt` | 当前唯一策略。将验证器的 `pass`/`partial`/`fail` 映射为 `hunted`/`wounded`/`escaped` 语义 |
| `[tools].always_load` | 常驻加载工具 | `[]` | 保持特定原生工具（如 `["Git", "notify"]`）在每次请求时加载，避免通过 ToolSearch 发现 |
| `[update].check_for_updates` | 启动时检查更新 | `true` | 后台检查最新稳定版，有新版本且资源完整时显示 toast 提示 |
| `[update].check_interval_hours` | 检查缓存间隔 | `1` | 网络更新检查的缓存间隔（小时）。设为 `0` 则每次启动都检查网络。失败不缓存 |
| `[update].update_uri` | 自定义更新镜像 | URL 字符串 | 指向内部镜像端点，需返回 GitHub 兼容的 latest-release JSON |
| `managed_config_path` | 托管配置文件路径 | — | 托管配置文件路径，加载于用户配置之后 |
| `requirements_path` | 需求验证文件路径 | — | 需求验证文件路径，用于限制允许的审批策略和沙箱模式 |
| `telemetry` | 遥测开关 | `true` | 匿名使用统计。显式 `false` 为持久化退订，删除安装 ID 并留下墓碑标记 |
| `telemetry_endpoint` | 遥测端点 | `https://telemetry.codewhale.net/v1/telemetry` | 遥测上报地址。设为空字符串则写入本地 dry-run 文件而不发送网络请求 |
| `max_subagents` | 最大子代理数 | `64` | 顶层快捷方式，与 `[subagents].max_concurrent` 等价 |
| `instructions` | 额外指令源 | `[]` | 附加系统提示源文件路径列表。项目配置**忽略**此键 |
| `verbosity` | 输出详细程度 | — | `normal` 或 `concise`。CLI 非交互命令默认 `concise` |
| `http_headers` | 自定义请求头 | `{}` | 额外 HTTP 请求头，如 `{ "X-Model-Provider-Id" = "your-model-provider" }` |

---

### 1.10 热键栏（Hotbar）（写入 `~/.codewhale/config.toml`）

```toml
[[hotbar]]
slot = 1
action = "mode.plan"
label = "Plan"

[[hotbar]]
slot = 2
action = "session.compact"
```

| 字段 | 说明 |
|------|------|
| `slot` | `1~8`。TUI 底部热键栏的 8 个槽位 |
| `action` | 动作 ID，如 `mode.plan`（切换到计划模式）、`session.compact`（手动压缩上下文）等 |
| `label` | 显示标签（可选），覆盖默认动作名称 |

> 若未配置 `hotbar`，使用内置默认 8 个槽位；`hotbar = []` 禁用所有热键；配置后只显示已配置的槽位，未配置的留空。项目配置**忽略** `hotbar`。

---

### 1.11 自动审查（Auto Review）（写入 `~/.codewhale/config.toml`）

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

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `action_kind` | `read` | 读取类操作（如 `read_file`、`grep`） |
| | `write` | 写入类操作（如 `write_file`、`edit_file`） |
| | `shell` | Shell 命令执行 |
| | `network` | 网络请求 |
| | `git` | Git 操作 |
| | `mcp_read` | MCP 读取工具 |
| | `mcp_action` | MCP 动作工具 |
| | `browser` | 浏览器操作 |
| | `secret` | 密钥/凭证操作 |
| | `publish` | 发布/部署操作 |
| | `destructive` | 破坏性操作（如删除、重置） |
| | `unknown` | 未分类操作 |

> 规则匹配顺序：先检查 `block` 规则 → 再检查内置安全底线 → 最后检查 `allow` 规则。YOLO 模式下 `allow` 规则不会降级为弹窗。

---

### 1.12 目标循环（`[goal]`）（写入 `~/.codewhale/config.toml`）

```toml
[goal]
max_continuations = 100   # 默认 0（无限制），设为正值启用安全上限
```

Operate 模式目标默认无 Token、时间或延续上限。`max_continuations` 是可选的安全断路器，触发后目标暂停并提示检查进度。

---

### 1.13 Hooks（生命周期钩子）（写入 `~/.codewhale/config.toml`）

配置在 `[[hooks.hooks]]` 下，支持的事件：
- `message_submit` — 可替换/阻断提交文本（非后台模式）
- `tool_call_before` — 可决策 `allow`/`deny`/`ask`，重写输入或追加上下文
- `turn_end`、`subagent_spawn`、`subagent_complete` — 观察者钩子，只读
- `shell_env` — 环境变量注入

> 项目级 hooks 可放在 `<workspace>/.codewhale/hooks.toml`，需仓库被信任后才加载。全局 hooks 写在 `~/.codewhale/config.toml` 的 `[hooks]` 下。

---

### 1.14 Harness Profiles（模型特定配置）（写入 `~/.codewhale/config.toml`）

```toml
[[harness_profiles]]
provider_route = "deepseek"
model_pattern = "deepseek-v4.*"

[harness_profiles.posture]
kind = "cache-heavy"
max_subagents = 10
prefer_codebase_search = false
compaction_strategy = "prefix-cache"
tool_surface = "full"
safety_posture = "standard"
```

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `kind` | `standard` | 标准姿态，平衡资源使用 |
| | `cache-heavy` | 缓存优先，最大化利用 KV 前缀缓存，适合重复访问相同文件的仓库 |
| | `lean` | 精简姿态，减少上下文占用，适合资源受限环境 |
| | `custom` | 自定义姿态，需显式配置所有子字段 |
| `compaction_strategy` | `default` | 使用默认压缩策略 |
| | `prefix-cache` | 针对前缀缓存优化的压缩策略，尽量保持文件块稳定 |
| | `aggressive` | 激进压缩，更快丢弃旧内容，适合极长会话 |
| `tool_surface` | `full` | 暴露完整工具集 |
| | `read-only` | 仅暴露读取类工具，隐藏写入和 shell |
| | `auto` | 根据当前模式和上下文自动选择工具集 |
| `safety_posture` | `standard` | 标准安全检查，遵循 `approval_policy` 设置 |
| | `strict` | 更严格的安全姿态，额外限制敏感操作 |
| | `permissive` | 宽松姿态，减少拦截（但仍低于 YOLO 模式） |

> 未知 posture 名称或未知键会导致配置反序列化失败而非静默变为 `custom`，确保拼写错误可见。

---

## 二、UI 偏好文件（`~/.codewhale/settings.toml`）

> 以下所有配置项**必须写入 `~/.codewhale/settings.toml`**。写入 `config.toml` 会被忽略。TUI 内 `/settings` 查看，`/config` 部分键可修改并 `--save` 持久化到 `settings.toml`。

| 配置项 | 作用 | 可选值 | 各值说明 |
|--------|------|--------|----------|
| `theme` | 主题 | `system` | **默认**。自动检测终端背景色，跟随系统亮/暗模式 |
| | | `dark` | 强制使用 DeepSeek 暗色配色 |
| | | `light` | 强制使用 DeepSeek 亮色配色 |
| | | `grayscale` | 低饱和度的黑白灰主题，无色彩偏好 |
| | | `catppuccin-mocha` | Catppuccin Mocha 社区主题 |
| | | `tokyo-night` | Tokyo Night 社区主题 |
| | | `dracula` | Dracula 社区主题 |
| | | `gruvbox-dark` | Gruvbox Dark 社区主题 |
| `locale` | 界面语言 | `auto` | **默认**。依次检查 `LC_ALL` → `LC_MESSAGES` → `LANG` 环境变量，不支持时回退英语 |
| | | `en` | 英语 |
| | | `zh-Hans` | 简体中文 |
| | | `ja` | 日语 |
| | | `pt-BR` | 巴西葡萄牙语 |
| `default_mode` | 默认模式 | `agent` | **默认**。代理模式，模型可自主调用工具、读写文件、执行命令 |
| | | `plan` | 计划模式，模型先制定计划，用户确认后逐步执行。此模式下 shell 工具始终隐藏 |
| | | `operate` | 操作模式（预览），目标循环自动执行 |
| `work_surface_placement` | 工作栏位置 | `top` | **默认**。工作栏位于对话记录上方 |
| | | `left` | 工作栏位于左侧 |
| | | `right` | 工作栏位于右侧 |
| | | `off` | 隐藏工作栏 |
| `rail_panel` | 工作栏默认面板 | `tasks` | **默认**。显示完整任务列表（待办 + 子代理） |
| | | `agents` | 仅显示子代理行 |
| | | `context` | 显示只读的会话事实列表 |
| | | `pinned` | 显示目标 + 待办清单 |
| `show_thinking` | 显示思考过程 | `on` / `off` | 是否在 TUI 对话记录中展示模型的 reasoning/thinking 内容 |
| `thinking_default_expanded` | 思考块默认展开 | `true` / `false` | 默认 `false`。`show_thinking` 开启时，是否默认展开 thinking 块 |
| `show_tool_details` | 显示工具详情 | `on` / `off` | 是否展开显示每次工具调用的详细参数和结果 |
| `auto_compact` | 自动压缩上下文 | `on` / `off` | 模型感知默认开启。当上下文接近模型窗口上限时，自动生成摘要并替换旧内容 |
| `auto_compact_threshold_percent` | 自动压缩阈值 | `10~100` | 默认 `80`。当活跃请求输入估算达到模型上下文窗口的该百分比时触发自动压缩 |
| `paste_burst_detection` | 粘贴突发检测 | `on` / `off` | 默认 `on`。检测不支持 bracketed-paste 事件的终端中的快速批量粘贴 |
| `mention_menu_limit` | @提及菜单候选数 | 整数 | 默认 `128`。`@` 弹窗最多保留多少候选文件 |
| `mention_walk_depth` | @提及遍历深度 | 整数 | 默认 `6`。`@` 补全遍历工作区的最大目录深度。设为 `0` 表示无限深度 |
| `mention_menu_behavior` | @提及菜单行为 | `fuzzy` | **默认**。模糊搜索整个工作区，并结合提及频率（frecency）排序 |
| | | `browser` | 仅列出当前已输入目录段的直接子目录，按字母顺序排列 |
| `cost_currency` | 成本显示货币 | `usd` | **默认**。美元 |
| | | `cny` | 人民币（别名 `rmb`、`yuan` 会归一化为 `cny`） |
| `background_color` | 自定义背景色 | `#RRGGBB` / `default` | 自定义 TUI 根、头部、对话记录、底部的背景色，同时保留面板对比度 |
| `max_input_history` | 输入历史条数 | 整数 | 默认 `100`。保留多少条已提交输入历史。已清除的草稿也保留在本地用于历史搜索。<br><br>⚠️ **键名陷阱**：TUI 内 `/config set max_history 200 --save` 使用的别名是 `max_history`，但保存到 `settings.toml` 时**会自动映射为 `max_input_history`**。如果用户**手动在文件里写 `max_history`**，该配置会被**完全忽略**！请始终使用 `max_input_history` 作为文件键名 |
| `default_model` | 默认模型覆盖 | 字符串 | 覆盖当前提供商的默认模型选择 |
| `verbosity` | 输出详细程度 | `normal` | **默认**。标准对话风格，包含解释和上下文 |
| | | `concise` | 简洁模式，追加提示纪律块要求直接、低冗余输出 |
| `inline_diffs` | 内联 diff 展示 | `full` | **默认**。显示完整的红/绿 diff 和语义统计 |
| | | `summary` | 仅保留统计信息 |
| | | `off` | 仅显示已变更文件的平静结果 |
| `focus_texture` | 聚焦纹理 | `off` | **默认**。无纹理 |
| | | `scrim` | 模态视图外背景变暗 |
| | | `grain` | 在空白单元格上散布稀疏点 |
| `sessions_rail` | 会话栏 | `on` / `off` | 默认 `off`。在侧边栏显示最近会话列表 |
| `session_auto_resume` | 自动恢复会话 | `on` / `off` | 默认 `off`。启动时自动恢复该工作区最近会话 |
| `launch_screen` | 启动菜单 | `on` / `off` | 默认 `off`。启动时显示 New/Resume/Worktree 菜单 |
| `work_surface_top_height` | 顶部工作栏高度上限 | `2~16` | 顶部条带高度上限（通常通过拖拽分隔线持久化） |
| `work_surface_side_width` | 侧边工作栏宽度上限 | `26~80` | 侧边栏宽度上限（通常通过拖拽分隔线持久化） |
| `tui.alternate_screen` | 备用屏幕 | `auto` / `always` / `never` | 保留兼容性配置。实际上交互会话始终使用 TUI 拥有的备用屏幕 |
| `tui.mouse_capture` | 鼠标捕获 | `true` / `false` | 默认 `true`（非 Windows 终端和 Windows Terminal/ConEmu/Cmder 启用；JetBrains 终端默认关闭）。启用后支持内部滚动、对话选择、右键菜单、滚动条拖拽 |
| `tui.terminal_probe_timeout_ms` | 终端探测超时 | 整数 | 默认 `500`，范围 `100~5000`。启动时探测终端模式的超时 |
| `tui.stream_chunk_timeout_secs` | 流式块超时 | 整数 | 默认 `900`，范围 `1~3600`。SSE 流中两个数据块之间的最大空闲时间 |
| `tui.osc8_links` | OSC 8 超链接 | `true` / `false` | macOS/Linux 默认 `true`，Windows 默认 `false`。在对话输出中的 URL 周围包裹 OSC 8 转义序列，支持终端 Cmd/Ctrl+点击跳转 |
| `tui.header_items` | 头部可选芯片 | `string[]` | 默认 `[]`。例如 `["tokens"]` 可在头部显示会话输入、缓存命中和输出 Token 计数 |

---

## 三、项目覆盖配置（`<workspace>/.codewhale/config.toml`）

> **安全子集**：项目级配置仅支持以下键，且**只能收紧**用户全局配置。写入其他键会被忽略。

| 键 | 允许的值 | 效果 | 收紧规则 |
|----|----------|------|----------|
| `model` | 任意模型 ID | 覆盖 `default_text_model` | — |
| `reasoning_effort` | `high` / `max` | 强制高推理强度 | 仅允许提升（不能降低） |
| `approval_policy` | 更严格的值 | 收紧审批姿态 | 只能比全局更严格 |
| `sandbox_mode` | 更严格的值 | 收紧沙箱姿态 | 只能比全局更严格 |
| `notes_path` | 路径 | 将笔记保存在仓库内 | — |
| `max_subagents` | `1~128` | 限制子代理并发 | clamp 到 `1..=128` |
| `allow_shell` | `false` | 禁用 shell | `true` 被**忽略**（不能放宽） |

> **以下键在项目配置中会被明确忽略**：`api_key`、`base_url`、`provider`、`mcp_config_path`、`hotbar`、`allow_shell = true`、`instructions`、`telemetry`、`telemetry_endpoint`、`http_headers`。

---

## 四、Constitution 与项目指令

### 4.1 用户全局 Constitution（`~/.codewhale/constitution.json`）

通过 TUI 内 `/constitution` 或 `/setup` 管理。存储个人偏好和停止条件，**不改变运行时审批策略、沙箱或权限**。

```json
{
  "schema_version": 1,
  "authority": [
    "current user request",
    "live code and tests",
    "AGENTS.md",
    "memory"
  ],
  "protected_invariants": [
    "do not break old-session transcript replay"
  ]
}
```

### 4.2 仓库本地 Constitution（`.codewhale/constitution.json`）

放在仓库内的 `.codewhale/` 目录中。可定义权威优先级、受保护不变量（带 `paths` 的对象可被**机械执行**）、分支策略、验证策略等。

```json
{
  "schema_version": 1,
  "authority": [
    "current user request",
    "live code and tests",
    "GitHub issue/PR details",
    "AGENTS.md"
  ],
  "protected_invariants": [
    "Keep DeepSeek support first-class.",
    {
      "text": "The wire format is frozen; protocol changes need a human.",
      "paths": ["crates/protocol/**"],
      "action": "block"
    }
  ],
  "branch_policy": "PRs target the integration branch, not main",
  "verification_policy": {
    "before_claiming_done": ["run focused tests", "read changed files back"]
  }
}
```

### 4.3 项目指令（`AGENTS.md`）

跨代理项目工作指令（自然语言 prose）。通过 `/init` 脚手架化。`CLAUDE.md` 和 `.claude/instructions.md` 作为兼容回退读取。

> `WHALE.md` 已弃用，不再读取。

---

## 五、环境变量速查

> 环境变量**覆盖**配置文件中的对应值。以下列出与配置位置相关的关键变量。

### 5.1 核心三件套（新旧前缀共存，`CODEWHALE_*` 优先）

| 变量名 | 作用 | 对应配置文件位置 |
|--------|------|------------------|
| `CODEWHALE_PROVIDER` / `DEEPSEEK_PROVIDER` | 覆盖提供商 | `config.toml` → `provider` |
| `CODEWHALE_MODEL` / `DEEPSEEK_MODEL` | 覆盖默认模型 | `config.toml` → `default_text_model` |
| `CODEWHALE_BASE_URL` / `DEEPSEEK_BASE_URL` | 覆盖基础地址 | `config.toml` → `[providers.<name>].base_url` |

### 5.2 安全与审批（对应 `config.toml`）

| 变量名 | 作用 | 有效值 |
|--------|------|--------|
| `CODEWHALE_ALLOW_SHELL` / `DEEPSEEK_ALLOW_SHELL` | 允许 Shell | `1`、`true` |
| `CODEWHALE_APPROVAL_POLICY` / `DEEPSEEK_APPROVAL_POLICY` | 审批策略 | `on-request`、`untrusted`、`never` |
| `CODEWHALE_SANDBOX_MODE` / `DEEPSEEK_SANDBOX_MODE` | 沙箱模式 | `read-only`、`workspace-write`、`danger-full-access`、`external-sandbox` |

### 5.3 路径与配置覆盖

| 变量名 | 作用 | 对应配置文件位置 |
|--------|------|------------------|
| `CODEWHALE_HOME` | 覆盖基础数据目录 | 影响所有 `~/.codewhale/*` 路径 |
| `CODEWHALE_CONFIG_PATH` / `DEEPSEEK_CONFIG_PATH` | 覆盖配置文件路径 | 替换 `~/.codewhale/config.toml` |
| `CODEWHALE_MANAGED_CONFIG_PATH` | 托管配置文件路径 | `config.toml` → `managed_config_path` |
| `CODEWHALE_REQUIREMENTS_PATH` | 需求验证文件路径 | `config.toml` → `requirements_path` |
| `CODEWHALE_SKILLS_DIR` | 覆盖技能目录 | `config.toml` → `skills_dir` |
| `CODEWHALE_MCP_CONFIG` / `DEEPSEEK_MCP_CONFIG` | 覆盖 MCP 配置文件 | `config.toml` → `mcp_config_path` |
| `CODEWHALE_NOTES_PATH` | 覆盖笔记文件路径 | `config.toml` → `notes_path` |
| `CODEWHALE_MEMORY_PATH` / `DEEPSEEK_MEMORY_PATH` | 覆盖记忆文件锚点 | `config.toml` → `memory_path` |
| `CODEWHALE_TASKS_DIR` / `DEEPSEEK_TASKS_DIR` | 运行时任务队列目录 | — |
| `CODEWHALE_AUTOMATIONS_DIR` | 覆盖自动化存储目录 | — |

### 5.4 功能开关（对应 `config.toml`）

| 变量名 | 作用 | 有效值 |
|--------|------|--------|
| `CODEWHALE_MEMORY` / `DEEPSEEK_MEMORY` | 启用用户记忆 | `1`、`on`、`true`、`yes`、`y`、`enabled` |
| `CODEWHALE_CACHE_MAXIMAL` | 缓存最大化模式 | `1`、`true`、`on`、`yes` |
| `CODEWHALE_ALLOW_INSECURE_HTTP` / `DEEPSEEK_ALLOW_INSECURE_HTTP` | 允许非本地 HTTP | `1`、`true` |
| `CODEWHALE_FORCE_HTTP1` / `DEEPSEEK_FORCE_HTTP1` | 强制 HTTP/1.1 | `1`、`true`、`yes`、`on` |
| `CODEWHALE_TELEMETRY` / `DEEPSEEK_TELEMETRY` | 遥测开关 | `0`、`1`、`true`、`false`、`yes`、`no`、`on`、`off` |
| `CODEWHALE_TELEMETRY_ENDPOINT` / `DEEPSEEK_TELEMETRY_ENDPOINT` | 遥测端点 | URL 或空字符串 |
| `CODEWHALE_MAX_SUBAGENTS` / `DEEPSEEK_MAX_SUBAGENTS` | 最大子代理数 | `1~128` |
| `CODEWHALE_VERBOSITY` / `DEEPSEEK_VERBOSITY` | 输出详细程度 | `normal`、`concise` |

### 5.5 日志与调试

| 变量名 | 作用 |
|--------|------|
| `CODEWHALE_LOG_LEVEL` / `RUST_LOG` | 日志级别：`info`、`debug`、`trace` |
| `SSL_CERT_FILE` | 企业代理/自签证书路径 |
| `NO_ANIMATIONS` | 强制低动效（`1`/`true`/`yes`/`on`） |

### 5.6 提供商专属环境变量

| 变量名 | 对应 Provider |
|--------|--------------|
| `MISTRAL_API_KEY` / `MISTRAL_BASE_URL` / `MISTRAL_MODEL` | `mistral` |
| `XAI_API_KEY` / `XAI_BASE_URL` / `XAI_MODEL` | `xai` |
| `TELECOMJS_API_KEY` / `TELECOMJS_BASE_URL` | `telecomjs` |
| `OPENCODE_ZEN_API_KEY` / `OPENCODE_ZEN_BASE_URL` / `OPENCODE_ZEN_MODEL` | `opencode-zen` |
| `META_API_KEY` / `META_BASE_URL` / `META_MODEL` | `meta` |

> 完整列表请参考官方 `CONFIGURATION.md` 的 Environment Variables 章节。

---

## 六、修订记录

| 日期 | 修订内容 |
|------|----------|
| 2026-08-13 | **新增**：为每个配置项明确标注应写入的配置文件位置（`config.toml` / `settings.toml` / `permissions.toml` / `constitution.json` / `AGENTS.md` / 项目覆盖）；新增"配置文件体系总览"章节；区分 `config.toml` 与 `settings.toml` 的边界；补充项目覆盖的安全子集说明；补充 Constitution 与项目指令的独立文件说明 |
| 2026-08-12 | 修正 `max_subagents` 默认值（20→64）、限制（20→128）；修正 `max_admitted` 默认值（200→1024）；修正 `api_timeout_secs` 默认值（120→600）；标注 `[context]` 废弃键；补充新增 provider（xai、longcat、opencode-go、mistral、telecomjs 等）；补充 `[notifications.events/event_sound]`、`[update].check_interval_hours`、`[approval].default_selection`、Settings 章节、环境变量等 |

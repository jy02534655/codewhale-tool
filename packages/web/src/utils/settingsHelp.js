/**
 * 通用设置配置项说明文本
 * 来源：codewhale_configuration.md
 */

export const settingsHelp = {
  // BasicSettingsCard
  locale: 'Web UI 语言。切换界面显示语言，偏好持久化到 store.json。',
  default_text_model: '默认文本模型。如 deepseek-v4-pro、deepseek-v4-flash 等。',
  update_check_for_updates: '启动时检查更新。后台检查最新稳定版，有新版本且资源完整时显示 toast 提示。',

  // TuiInterfaceCard
  theme: '界面主题。system 跟随系统，light 浅色，dark 深色。',
  default_mode: '默认模式。agent 为普通对话，plan 为计划模式。',
  sidebar_focus: '侧边栏焦点行为。pinned 固定侧边栏，auto 自动显隐。',
  mention_menu_behavior: '@ 提及文件时的菜单行为。fuzzy 模糊搜索；browser 仅按当前目录段子目录列举。',
  cost_currency: '成本显示货币。usd 为美元，cny/rmb/yuan 会归一化为人民币。',
  verbosity: '输出详细程度。normal 为标准对话风格；concise 为简洁低冗余输出。',
  show_thinking: '是否在对话记录中展示模型的 reasoning/thinking 内容。',
  show_tool_details: '是否展开显示每次工具调用的详细参数和结果。',
  auto_compact: '模型感知默认开启。上下文接近模型窗口上限时自动生成摘要并替换旧内容。',
  paste_burst_detection: '默认开启。检测不支持 bracketed-paste 的终端中的批量粘贴，防止逐字符触发补全。',
  auto_compact_threshold_percent: '默认 80。活跃请求输入估算达到模型上下文窗口该百分比时触发自动压缩。',
  mention_menu_limit: '@ 弹窗最多保留多少候选文件，超出部分截断，默认 128。',
  mention_walk_depth: '@ 补全遍历工作区的最大目录深度。设为 0 表示无限深度，默认 6。',
  max_history: '保留多少条已提交输入历史，已清除草稿仍保留用于历史搜索，默认 1000。',
  background_color: '自定义 TUI 根、头部、对话记录、底部的背景色，default 使用主题默认。',
  default_model_override: '覆盖当前提供商的默认模型选择。暂不可配置，后续版本支持。',

  // TuiTerminalCard
  tui_alternate_screen: '备用屏幕策略。auto/always/never；交互会话通常由 TUI 接管备用屏幕。',
  tui_mouse_capture: '启用后支持内部滚动、对话选择、右键菜单、滚动条拖拽；部分终端默认关闭。',
  tui_terminal_probe_timeout_ms: '启动时探测终端模式（颜色、鼠标协议）的超时，默认 500ms，范围 100~5000。',
  tui_stream_chunk_timeout_secs: 'SSE 流中两个数据块之间的最大空闲时间，默认 300s，范围 1~3600，0 映射为默认值。',
  tui_osc8_links: '在 URL 周围包裹 OSC 8 转义序列，支持 iTerm2/Ghostty/Kitty/WezTerm 等终端的 Cmd+点击跳转。',

  // SecurityCard
  approval_policy: '工具执行前的弹窗审批策略。on-request 每次请求确认；untrusted 仅对不可信操作确认；never 永不弹窗。',
  sandbox_mode: '文件系统访问沙箱。read-only 最严格；workspace-write 允许工作区内写入；danger-full-access 无限制；external-sandbox 依赖外部工具隔离。',
  allow_shell: '是否允许 shell 工具。true 时可用，但仍受 approval_policy 控制；false 完全隐藏 exec_shell 工具。',

  // SubagentsCard
  subagents_max_concurrent: '同时处于活跃状态的子代理数量上限，默认 20，限制 1~20。',
  subagents_token_budget: '单次 agent 调用及其所有后代子代理的累计 Token 消耗上限，0 表示无限制。',
  subagents_api_timeout_secs: '子代理单步模型调用的超时时间，默认 120s，范围 1~1800。',
  subagents_heartbeat_timeout_secs: '子代理多久无响应会被视为僵死并清理，默认 300s，范围 30~3600，必须大于 api_timeout_secs。',
  subagents_default_model: '未指定角色时的 fallback 模型。',

  // RetryCard
  retry_enabled: 'API 请求失败时是否自动重试。',
  retry_max_retries: '单次请求最多重试几次后仍失败则报错，默认 3。',
  retry_initial_delay: '第一次重试前的等待时间（秒），默认 1.0。',
  retry_max_delay: '退避延迟的上限（秒），防止无限增长，默认 60.0。',
  retry_exponential_base: '每次重试延迟乘以该基数，默认 2.0（1s → 2s → 4s → 8s...）。',

  // NotificationsCard
  notifications_method: '完成通知方式。auto 按终端自动选择；osc9 发送 OSC 9；bel 发送终端响铃；off 关闭通知。',
  notifications_threshold_secs: '只有成功完成且耗时 ≥ 该值的回合才触发通知，默认 30s。失败/取消的回合始终静默。',
  notifications_completion_sound: '完成声音。beep 系统默认蜂鸣；off 关闭；bell 终端 bell；file 播放自定义 WAV。',

  // FeaturesCard
  features_shell_tool: '启用 exec_shell 工具，允许执行 shell 命令。',
  features_subagents: '启用子代理委派和扇出功能。',
  features_web_search: '启用 web_search 和兼容别名 web.run，默认使用 DuckDuckGo。',
  features_apply_patch: '启用 apply_patch 工具，支持统一差异格式批量修改。',
  features_mcp: '启用 Model Context Protocol 支持，可连接外部 MCP 服务器扩展工具集。',
  features_exec_policy: '启用执行策略引擎，对工具调用进行权限检查和审批。',
  features_vision_model: '启用后可通过 [vision_model] 配置独立的图像分析模型，需手动开启。',

  // SearchCard
  search_provider: '搜索后端。duckduckgo 无需 API Key；bing/tavily/bocha/metaso/searxng/baidu/volcengine/sofya 需要对应 API Key 或配置。',
  search_base_url: 'DuckDuckGo 兼容的自定义搜索端点；SearXNG 必须配置此项。',

  // ReadOnlySettingsCard / 不可配置项
  'reasoning_effort': '推理强度。off/low/medium/high/max/xhigh/ultracode 控制思考深度。暂不可配置，后续版本支持。',
  'context.enabled': '启用 Fin 快速路径管理。Fin 使用 deepseek-v4-flash 执行协调工作，减轻主模型负担。暂不可配置，后续版本支持。',
  'context.verbatim_window_turns': '最近多少轮对话保持完整原文，更早轮次会被压缩或摘要，默认 16。暂不可配置，后续版本支持。',
  'context.l1_threshold': '第一级上下文压力阈值（Token 数），超过后触发轻量级干预，默认 192000。暂不可配置，后续版本支持。',
  'context.l2_threshold': '第二级阈值，超过后采取更激进压缩策略，默认 384000。暂不可配置，后续版本支持。',
  'context.l3_threshold': '第三级阈值，接近模型上限时的紧急处理线，默认 576000。暂不可配置，后续版本支持。',
  'context.seam_model': '执行上下文协调任务的模型，默认 deepseek-v4-flash。暂不可配置，后续版本支持。',
  'CODEWHALE_CACHE_MAXIMAL': '开启后每轮将活跃文件完整内容注入系统提示，利用 KV 前缀缓存命中。默认每文件 24KB / 总计 96KB。暂不可配置，后续版本支持。',
  'notifications.include_summary': '开启后通知体会包含耗时和该回合的估算费用，默认 false。暂不可配置，后续版本支持。',
  'notifications.sound_file': '自定义 WAV 声音文件路径，仅 Windows 且 completion_sound 为 file 时使用。暂不可配置，后续版本支持。',
  'update.update_uri': '自定义更新镜像，需返回 GitHub 兼容的 latest-release JSON。暂不可配置，后续版本支持。',
  'permissions.toml': '同级权限规则文件，支持 tool + command/path 字段，用于强制审批或拒绝。暂不可配置，后续版本支持。',
  'skills_dir': '技能目录，默认 ~/.codewhale/skills；工作区本地 .agents/skills 或 ./skills 优先。暂不可配置，后续版本支持。',
  'skills.scan_codewhale_only': '设为 true 时忽略 .claude/skills、.cursor/skills 等跨工具根目录，默认 false。暂不可配置，后续版本支持。',
  'mcp_config_path': 'MCP 服务器配置文件路径，修改后需重启 TUI。暂不可配置，后续版本支持。',
  'notes_path': '模型可见 note 工具使用的笔记文件路径。暂不可配置，后续版本支持。',
  'memory_path': '用户记忆文件路径。暂不可配置，后续版本支持。',
  'memory.enabled': '开启后 TUI 加载记忆文件到 <user_memory> 提示块，默认 false。暂不可配置，后续版本支持。',
  'snapshots.enabled': '为文件修改创建 side-git 快照，支持回滚，默认 true。暂不可配置，后续版本支持。',
  'snapshots.max_age_days': '快照保留天数，超过自动清理，默认 7。暂不可配置，后续版本支持。',
  'verifier.enabled': '开启后模型声称完成时自动运行验证器预览检查，默认 false。暂不可配置，后续版本支持。',
  'verifier.verdict_policy': '验证器裁决策略，当前唯一策略为 hunt。暂不可配置，后续版本支持。',
  'subagents.max_depth': '子代理可以递归委派子代理的最大层级深度。暂不可配置，后续版本支持。',
  'subagents.launch_concurrency': '一轮中同时启动多少子代理后再让其余排队，默认等于 max_subagents。暂不可配置，后续版本支持。',
  'subagents.max_admitted': '包括正在运行和排队等待的子代理总数上限，默认 200。暂不可配置，后续版本支持。',
  'subagents.worker_model': 'Worker 角色子代理模型。暂不可配置，后续版本支持。',
  'subagents.explorer_model': 'Explorer 角色子代理模型。暂不可配置，后续版本支持。',
  'subagents.awaiter_model': 'Awaiter 角色子代理模型。暂不可配置，后续版本支持。',
  'subagents.review_model': 'Review 角色子代理模型。暂不可配置，后续版本支持。',
  'subagents.custom_model': '自定义角色子代理模型。暂不可配置，后续版本支持。',
  'capacity.enabled': '实验性容量控制器。开启后上下文接近上限时会主动干预，可能改变对话历史，默认 false。暂不可配置，后续版本支持。',
  'capacity.low_risk_max': '上下文使用率低于该比例时视为低风险，默认 0.50。暂不可配置，后续版本支持。',
  'capacity.medium_risk_max': '使用率在该区间为中等风险并开始预警，默认 0.62。暂不可配置，后续版本支持。',
  'capacity.severe_min_slack': '负值表示允许短暂超额，但触发紧急压缩，默认 -0.25。暂不可配置，后续版本支持。',
  'capacity.severe_violation_ratio': '当实际使用率超过预期比例的该值时视为严重违规，默认 0.40。暂不可配置，后续版本支持。',
  'capacity.refresh_cooldown_turns': '两次上下文刷新操作之间至少间隔多少轮，默认 6。暂不可配置，后续版本支持。',
  'capacity.replan_cooldown_turns': '两次重新规划之间至少间隔多少轮，默认 5。暂不可配置，后续版本支持。',
  'capacity.max_replay_per_turn': '单轮内最多重放多少次历史内容到提示中，默认 1。暂不可配置，后续版本支持。',
  'capacity.min_turns_before_guardrail': '会话开始至少多少轮后才启用容量护栏，默认 4。暂不可配置，后续版本支持。',
  'capacity.profile_window': '容量控制器分析最近多少轮的 Token 使用趋势，默认 8。暂不可配置，后续版本支持。',
  'capacity.deepseek_v3_2_chat_prior': 'V3.2 Chat 模型的上下文优先级权重，默认 3.9。暂不可配置，后续版本支持。',
  'capacity.deepseek_v3_2_reasoner_prior': 'V3.2 Reasoner 模型的上下文优先级权重，默认 4.1。暂不可配置，后续版本支持。',
  'capacity.deepseek_v4_pro_prior': 'V4 Pro 的上下文优先级权重，默认 3.5。暂不可配置，后续版本支持。',
  'capacity.deepseek_v4_flash_prior': 'V4 Flash 的上下文优先级权重，默认 4.2。暂不可配置，后续版本支持。',
  'capacity.fallback_default_prior': '未知模型时的默认上下文优先级权重，默认 3.8。暂不可配置，后续版本支持。',
};

export function getSettingsHelp(key) {
  return settingsHelp[key] || '';
}

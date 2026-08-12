/**
 * CodeWhale 通用设置默认值
 *
 * 与 CodeWhale config.toml 默认值保持一致，供 server 和前端共享。
 */

export const DEFAULT_SETTINGS = {
  // 基础
  locale: 'auto',
  default_text_model: 'deepseek-v4-pro',

  // TUI 界面
  theme: 'system',
  default_mode: 'agent',
  sidebar_focus: 'pinned',
  show_thinking: true,
  show_tool_details: true,
  auto_compact: true,
  auto_compact_threshold_percent: 80,
  paste_burst_detection: true,
  mention_menu_limit: 128,
  mention_walk_depth: 6,
  mention_menu_behavior: 'fuzzy',
  cost_currency: 'usd',
  background_color: 'default',
  max_history: 1000,
  verbosity: 'normal',
  tui_alternate_screen: 'auto',
  tui_mouse_capture: false,
  tui_terminal_probe_timeout_ms: 500,
  tui_stream_chunk_timeout_secs: 300,
  tui_osc8_links: true,

  thinking_default_expanded: false,
  inline_diffs: 'full',
  focus_texture: 'off',
  rail_panel: 'tasks',
  work_surface_placement: 'top',
  sessions_rail: false,
  session_auto_resume: false,
  launch_screen: false,
  work_surface_top_height: 8,
  work_surface_side_width: 40,

  // 安全与审批
  approval_policy: 'on-request',
  sandbox_mode: 'read-only',
  allow_shell: false,
  approval_default_selection: 'deny',

  // 子代理
  subagents_max_concurrent: 64,
  subagents_token_budget: 0,
  subagents_api_timeout_secs: 600,
  subagents_heartbeat_timeout_secs: 300,
  subagents_default_model: '',
  subagents_max_depth: 0,
  subagents_launch_concurrency: 64,
  subagents_max_admitted: 1024,
  subagents_worker_model: '',
  subagents_explorer_model: '',
  subagents_awaiter_model: '',
  subagents_review_model: '',
  subagents_custom_model: '',

  // 重试
  retry_enabled: true,
  retry_max_retries: 3,
  retry_initial_delay: 1.0,
  retry_max_delay: 60.0,
  retry_exponential_base: 2.0,

  // 通知
  notifications_method: 'auto',
  notifications_threshold_secs: 30,
  notifications_completion_sound: 'beep',
  notifications_include_summary: false,
  notifications_quiet: false,
  sound_file: '',
  notifications_event_turn_complete: true,
  notifications_event_subagent_terminal: true,
  notifications_event_approval_needed: true,
  notifications_event_input_needed: true,
  notifications_event_elevation_needed: true,
  notifications_event_model_notify: true,
  notifications_event_sound_enabled: false,
  notifications_event_sound_events: ['turn-complete', 'approval-needed'],
  notifications_event_sound_min_interval_ms: 2000,
  notifications_event_sound_quiet: false,

  // 功能开关
  features_shell_tool: true,
  features_subagents: true,
  features_web_search: true,
  features_apply_patch: true,
  features_mcp: true,
  features_exec_policy: true,
  features_vision_model: false,

  // 搜索
  search_provider: 'duckduckgo',
  search_base_url: '',

  // 更新
  update_check_for_updates: true,
  update_uri: '',
  update_check_interval_hours: 1,

  // 容量控制
  capacity_enabled: false,
  capacity_low_risk_max: 0.50,
  capacity_medium_risk_max: 0.62,
  capacity_severe_min_slack: -0.25,
  capacity_severe_violation_ratio: 0.40,
  capacity_refresh_cooldown_turns: 6,
  capacity_replan_cooldown_turns: 5,
  capacity_max_replay_per_turn: 1,
  capacity_min_turns_before_guardrail: 4,
  capacity_profile_window: 8,
  capacity_deepseek_v3_2_chat_prior: 3.9,
  capacity_deepseek_v3_2_reasoner_prior: 4.1,
  capacity_deepseek_v4_pro_prior: 3.5,
  capacity_deepseek_v4_flash_prior: 4.2,
  capacity_fallback_default_prior: 3.8,

  // 上下文管理
  context_enabled: false,
  CODEWHALE_CACHE_MAXIMAL: false,

  // 路径与存储
  skills_scan_codewhale_only: false,
  memory_enabled: false,
  snapshots_enabled: true,
  verifier_enabled: false,
  verifier_verdict_policy: 'hunt',
  snapshots_max_age_days: 7,
  skills_dir: '~/.codewhale/skills',
  mcp_config_path: '~/.codewhale/mcp.json',
  notes_path: '~/.codewhale/notes.txt',
  memory_path: '~/.codewhale/memory.md',

  // 推理
  reasoning_effort: 'medium',

  // 安全
  permissions_toml: '',

  // TUI 界面默认模型覆盖
  default_model: '',
};

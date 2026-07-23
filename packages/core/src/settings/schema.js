// 通用设置 Schema：平铺键到 TOML 嵌套路径的声明式映射
// 新增字段只需在 DEFAULT_SETTINGS 和 PATH_MAP 中各加一行，SCHEMA 自动生成
import { DEFAULT_SETTINGS } from './defaults.js';

// TUI 终端与交互属于 TUI 界面与交互配置的一部分，纳入通用设置管理
const PATH_MAP = {
  // 顶层字段
  default_text_model: 'default_text_model',
  theme: 'theme',
  default_mode: 'default_mode',
  sidebar_focus: 'sidebar_focus',
  show_thinking: 'show_thinking',
  show_tool_details: 'show_tool_details',
  auto_compact: 'auto_compact',
  auto_compact_threshold_percent: 'auto_compact_threshold_percent',
  paste_burst_detection: 'paste_burst_detection',
  mention_menu_limit: 'mention_menu_limit',
  mention_walk_depth: 'mention_walk_depth',
  mention_menu_behavior: 'mention_menu_behavior',
  cost_currency: 'cost_currency',
  background_color: 'background_color',
  max_history: 'max_history',
  verbosity: 'verbosity',
  tui_alternate_screen: 'tui.alternate_screen',
  tui_mouse_capture: 'tui.mouse_capture',
  tui_terminal_probe_timeout_ms: 'tui.terminal_probe_timeout_ms',
  tui_stream_chunk_timeout_secs: 'tui.stream_chunk_timeout_secs',
  tui_osc8_links: 'tui.osc8_links',
  approval_policy: 'approval_policy',
  sandbox_mode: 'sandbox_mode',
  allow_shell: 'allow_shell',
  skills_scan_codewhale_only: 'skills.scan_codewhale_only',
  skills_dir: 'skills_dir',
  mcp_config_path: 'mcp_config_path',
  notes_path: 'notes_path',
  memory_path: 'memory_path',
  default_model: 'default_model',
  locale: 'tui.locale',

  // Subagents
  subagents_max_concurrent: 'subagents.max_concurrent',
  subagents_token_budget: 'subagents.token_budget',
  subagents_api_timeout_secs: 'subagents.api_timeout_secs',
  subagents_heartbeat_timeout_secs: 'subagents.heartbeat_timeout_secs',
  subagents_default_model: 'subagents.default_model',
  subagents_max_depth: 'subagents.max_depth',
  subagents_launch_concurrency: 'subagents.launch_concurrency',
  subagents_max_admitted: 'subagents.max_admitted',
  subagents_worker_model: 'subagents.worker_model',
  subagents_explorer_model: 'subagents.explorer_model',
  subagents_awaiter_model: 'subagents.awaiter_model',
  subagents_review_model: 'subagents.review_model',
  subagents_custom_model: 'subagents.custom_model',

  // Retry
  retry_enabled: 'retry.enabled',
  retry_max_retries: 'retry.max_retries',
  retry_initial_delay: 'retry.initial_delay',
  retry_max_delay: 'retry.max_delay',
  retry_exponential_base: 'retry.exponential_base',

  // Notifications
  notifications_method: 'notifications.method',
  notifications_threshold_secs: 'notifications.threshold_secs',
  notifications_completion_sound: 'notifications.completion_sound',
  notifications_include_summary: 'notifications.include_summary',
  sound_file: 'notifications.sound_file',

  // Features
  features_shell_tool: 'features.shell_tool',
  features_subagents: 'features.subagents',
  features_web_search: 'features.web_search',
  features_apply_patch: 'features.apply_patch',
  features_mcp: 'features.mcp',
  features_exec_policy: 'features.exec_policy',
  features_vision_model: 'features.vision_model',

  // Search
  search_provider: 'search.provider',
  search_base_url: 'search.base_url',

  // Update
  update_check_for_updates: 'update.check_for_updates',
  update_uri: 'update.uri',

  // Capacity
  capacity_enabled: 'capacity.enabled',
  capacity_low_risk_max: 'capacity.low_risk_max',
  capacity_medium_risk_max: 'capacity.medium_risk_max',
  capacity_severe_min_slack: 'capacity.severe_min_slack',
  capacity_severe_violation_ratio: 'capacity.severe_violation_ratio',
  capacity_refresh_cooldown_turns: 'capacity.refresh_cooldown_turns',
  capacity_replan_cooldown_turns: 'capacity.replan_cooldown_turns',
  capacity_max_replay_per_turn: 'capacity.max_replay_per_turn',
  capacity_min_turns_before_guardrail: 'capacity.min_turns_before_guardrail',
  capacity_profile_window: 'capacity.profile_window',
  capacity_deepseek_v3_2_chat_prior: 'capacity.deepseek_v3_2_chat_prior',
  capacity_deepseek_v3_2_reasoner_prior: 'capacity.deepseek_v3_2_reasoner_prior',
  capacity_deepseek_v4_pro_prior: 'capacity.deepseek_v4_pro_prior',
  capacity_deepseek_v4_flash_prior: 'capacity.deepseek_v4_flash_prior',
  capacity_fallback_default_prior: 'capacity.fallback_default_prior',

  // Context
  context_enabled: 'context.enabled',
  CODEWHALE_CACHE_MAXIMAL: 'context.CODEWHALE_CACHE_MAXIMAL',
  context_verbatim_window_turns: 'context.verbatim_window_turns',
  context_l1_threshold: 'context.l1_threshold',
  context_l2_threshold: 'context.l2_threshold',
  context_l3_threshold: 'context.l3_threshold',
  context_seam_model: 'context.seam_model',

  // Memory / Snapshots / Verifier / Reasoning / Permissions
  memory_enabled: 'memory.enabled',
  snapshots_enabled: 'snapshots.enabled',
  verifier_enabled: 'verifier.enabled',
  verifier_verdict_policy: 'verifier.verdict_policy',
  snapshots_max_age_days: 'snapshots.max_age_days',
  reasoning_effort: 'reasoning.effort',
  permissions_toml: 'permissions.toml',
};

// 根据 DEFAULT_SETTINGS 和 PATH_MAP 自动生成 Schema
// 新增字段只需在 DEFAULT_SETTINGS 和 PATH_MAP 中各加一行，无需在 reader/writer 中硬编码
export const SCHEMA = Object.keys(DEFAULT_SETTINGS).map((key) => ({
  key,
  path: PATH_MAP[key] || key,
  default: DEFAULT_SETTINGS[key],
}));

// 通用设置 Schema：平铺键到 TOML 嵌套路径的声明式映射
// 新增字段只需在 DEFAULT_SETTINGS 和 PATH_MAP 中各加一行，SCHEMA 自动生成
import { DEFAULT_SETTINGS, CODEWHALE_DEFAULTS, CONFIG_REQUIRED_KEYS } from './defaults.js';

// ---------- 文件目标常量 ----------
export const FILE_TARGET = {
  CONFIG: 'config',
  SETTINGS: 'settings',
  PERMISSIONS: 'permissions',
};

// ---------- 路径映射 ----------
// 规则：
//   - 值是字符串 → config.toml 嵌套路径（或 settings.toml 平铺键名）
//   - 去 settings.toml 的键使用平铺路径，去 config.toml 的键使用嵌套路径
const PATH_MAP = {
  // ===== 顶层 / 平铺字段 =====
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
  max_input_history: 'max_input_history',
  verbosity: 'verbosity',
  tui_alternate_screen: 'tui_alternate_screen',
  tui_mouse_capture: 'tui_mouse_capture',
  tui_terminal_probe_timeout_ms: 'tui_terminal_probe_timeout_ms',
  tui_stream_chunk_timeout_secs: 'tui_stream_chunk_timeout_secs',
  tui_osc8_links: 'tui_osc8_links',

  thinking_default_expanded: 'thinking_default_expanded',
  inline_diffs: 'inline_diffs',
  focus_texture: 'focus_texture',
  rail_panel: 'rail_panel',
  work_surface_placement: 'work_surface_placement',
  sessions_rail: 'sessions_rail',
  session_auto_resume: 'session_auto_resume',
  launch_screen: 'launch_screen',
  work_surface_top_height: 'work_surface_top_height',
  work_surface_side_width: 'work_surface_side_width',

  // CODEWHALE_DEFAULTS 中的纯平铺键
  calm_mode: 'calm_mode',
  tool_collapse_mode: 'tool_collapse_mode',
  low_motion: 'low_motion',
  fancy_animations: 'fancy_animations',
  ocean_treatment: 'ocean_treatment',
  bracketed_paste: 'bracketed_paste',
  thinking_highlight: 'thinking_highlight',
  composer_density: 'composer_density',
  composer_border: 'composer_border',
  composer_vim_mode: 'composer_vim_mode',
  transcript_spacing: 'transcript_spacing',
  context_panel: 'context_panel',
  status_indicator: 'status_indicator',
  synchronized_output: 'synchronized_output',
  workspace_follow_symlinks: 'workspace_follow_symlinks',
  feature_intro_shown: 'feature_intro_shown',
  yolo_deprecation_shown: 'yolo_deprecation_shown',

  // ===== 安全与审批 =====
  approval_policy: 'approval_policy',
  sandbox_mode: 'sandbox_mode',
  allow_shell: 'allow_shell',
  approval_default_selection: 'approval.default_selection',

  // ===== 路径与存储 =====
  skills_scan_codewhale_only: 'skills.scan_codewhale_only',
  skills_dir: 'skills_dir',
  mcp_config_path: 'mcp_config_path',
  notes_path: 'notes_path',
  memory_path: 'memory_path',
  default_model: 'default_model',
  locale: 'locale',

  // ===== 子代理 =====
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

  // ===== 重试 =====
  retry_enabled: 'retry.enabled',
  retry_max_retries: 'retry.max_retries',
  retry_initial_delay: 'retry.initial_delay',
  retry_max_delay: 'retry.max_delay',
  retry_exponential_base: 'retry.exponential_base',

  // ===== 通知 =====
  notifications_method: 'notifications.method',
  notifications_threshold_secs: 'notifications.threshold_secs',
  notifications_completion_sound: 'notifications.completion_sound',
  notifications_include_summary: 'notifications.include_summary',
  notifications_quiet: 'notifications.quiet',
  sound_file: 'notifications.sound_file',
  notifications_event_turn_complete: 'notifications.events.turn-complete',
  notifications_event_subagent_terminal: 'notifications.events.subagent-terminal',
  notifications_event_approval_needed: 'notifications.events.approval-needed',
  notifications_event_input_needed: 'notifications.events.input-needed',
  notifications_event_elevation_needed: 'notifications.events.elevation-needed',
  notifications_event_model_notify: 'notifications.events.model-notify',
  notifications_event_sound_enabled: 'notifications.event_sound.enabled',
  notifications_event_sound_events: 'notifications.event_sound.events',
  notifications_event_sound_min_interval_ms: 'notifications.event_sound.min_interval_ms',
  notifications_event_sound_quiet: 'notifications.event_sound.quiet',

  // ===== 功能开关 =====
  features_shell_tool: 'features.shell_tool',
  features_subagents: 'features.subagents',
  features_web_search: 'features.web_search',
  features_apply_patch: 'features.apply_patch',
  features_mcp: 'features.mcp',
  features_exec_policy: 'features.exec_policy',
  features_vision_model: 'features.vision_model',

  // ===== 搜索 =====
  search_provider: 'search.provider',
  search_base_url: 'search.base_url',

  // ===== 更新 =====
  update_check_for_updates: 'update.check_for_updates',
  update_uri: 'update.update_uri',
  update_check_interval_hours: 'update.check_interval_hours',

  // ===== 容量控制 =====
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

  // ===== 上下文管理 =====
  context_enabled: 'context.enabled',

  // ===== 记忆/快照/验证器 =====
  memory_enabled: 'memory.enabled',
  snapshots_enabled: 'snapshots.enabled',
  verifier_enabled: 'verifier.enabled',
  verifier_verdict_policy: 'verifier.verdict_policy',
  snapshots_max_age_days: 'snapshots.max_age_days',

  // ===== 权限（独立文件）=====
  permissions_toml: 'permissions.toml',

  // ===== 推理（顶层键）=====
  reasoning_effort: 'reasoning_effort',
};

// ---------- 字段路由表 ----------
// 所有 UI 偏好键 → settings.toml
// 不在 SETTINGS_KEYS 中的键默认 → config.toml
export const SETTINGS_KEYS = new Set([
  ...CODEWHALE_DEFAULTS,
  'sidebar_focus',
  'sessions_rail',
  'session_auto_resume',
  'background_color',
  'auto_compact',
  'auto_compact_threshold_percent',
  'default_model',
  'verbosity',
]);

export const FIELD_ROUTES = {};

for (const key of SETTINGS_KEYS) {
  FIELD_ROUTES[key] = FILE_TARGET.SETTINGS;
}

FIELD_ROUTES.permissions_toml = FILE_TARGET.PERMISSIONS;

/**
 * 判断字段的目标文件
 * 优先级：FIELD_ROUTES > 默认 config
 */
export function getFieldTarget(key) {
  if (FIELD_ROUTES[key]) return FIELD_ROUTES[key];
  return FILE_TARGET.CONFIG;
}

// ---------- 自动生成 SCHEMA ----------
export const SCHEMA = Object.keys(DEFAULT_SETTINGS).map((key) => {
  const path = PATH_MAP[key] || key;
  return {
    key,
    path,
    settingsPath: path.replace(/\./g, '_'),
    default: DEFAULT_SETTINGS[key],
    isCodeWhaleDefault: CODEWHALE_DEFAULTS.includes(key),
    isConfigRequired: CONFIG_REQUIRED_KEYS.includes(key),
  };
});

// ---------- 向后兼容的 UI_PATHS / isUIPath ----------
export const UI_PATHS = new Set([
  ...SETTINGS_KEYS,
]);

/**
 * 判断某路径是否为 UI 路径（向后兼容）
 */
export function isUIPath(path) {
  if (UI_PATHS.has(path)) return true;
  if (path.startsWith('tui.')) return true;
  return false;
}

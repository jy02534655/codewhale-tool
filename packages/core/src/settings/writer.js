/**
 * CodeWhale 通用设置写入器
 *
 * 将前端平铺结构写回 ~/.codewhale/config.toml。
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse, stringify } from 'smol-toml';
import { codeWhalePath } from './reader.js';

/**
 * 将通用设置写入 CodeWhale config.toml
 * @param {{ locale?: string, default_text_model?: string, instructions?: Array<{path: string, content?: string}> }} data
 */
export function writeSettingsToCodeWhale(data) {
  const cwPath = codeWhalePath();
  let cwCfg = {};
  if (existsSync(cwPath)) {
    try {
      cwCfg = parse(readFileSync(cwPath, 'utf-8'));
    } catch { /* 解析失败则保留现有可读部分，后续覆盖写入 */ }
  }

  if (data.locale !== undefined) {
    if (!cwCfg.tui || typeof cwCfg.tui !== 'object') cwCfg.tui = {};
    cwCfg.tui.locale = data.locale;
  }
  if (data.default_text_model !== undefined) {
    cwCfg.default_text_model = data.default_text_model;
  }
  if (Array.isArray(data.instructions)) {
    cwCfg.instructions = data.instructions
      .map((item) => {
        if (typeof item === 'string') return item;
        return item.path || '';
      })
      .filter((p) => !!p);
  }

  // TUI 界面
  if (data.theme !== undefined) cwCfg.theme = data.theme;
  if (data.default_mode !== undefined) cwCfg.default_mode = data.default_mode;
  if (data.sidebar_focus !== undefined) cwCfg.sidebar_focus = data.sidebar_focus;
  if (data.show_thinking !== undefined) cwCfg.show_thinking = data.show_thinking;
  if (data.show_tool_details !== undefined) cwCfg.show_tool_details = data.show_tool_details;
  if (data.auto_compact !== undefined) cwCfg.auto_compact = data.auto_compact;
  if (data.auto_compact_threshold_percent !== undefined) cwCfg.auto_compact_threshold_percent = data.auto_compact_threshold_percent;
  if (data.paste_burst_detection !== undefined) cwCfg.paste_burst_detection = data.paste_burst_detection;
  if (data.mention_menu_limit !== undefined) cwCfg.mention_menu_limit = data.mention_menu_limit;
  if (data.mention_walk_depth !== undefined) cwCfg.mention_walk_depth = data.mention_walk_depth;
  if (data.mention_menu_behavior !== undefined) cwCfg.mention_menu_behavior = data.mention_menu_behavior;
  if (data.cost_currency !== undefined) cwCfg.cost_currency = data.cost_currency;
  if (data.background_color !== undefined) cwCfg.background_color = data.background_color;
  if (data.max_history !== undefined) cwCfg.max_history = data.max_history;
  if (data.default_model !== undefined) cwCfg.default_model = data.default_model;
  if (data.verbosity !== undefined) cwCfg.verbosity = data.verbosity;

  // TUI 终端
  if (!cwCfg.tui || typeof cwCfg.tui !== 'object') cwCfg.tui = {};
  if (data.tui_alternate_screen !== undefined) cwCfg.tui.alternate_screen = data.tui_alternate_screen;
  if (data.tui_mouse_capture !== undefined) cwCfg.tui.mouse_capture = data.tui_mouse_capture;
  if (data.tui_terminal_probe_timeout_ms !== undefined) cwCfg.tui.terminal_probe_timeout_ms = data.tui_terminal_probe_timeout_ms;
  if (data.tui_stream_chunk_timeout_secs !== undefined) cwCfg.tui.stream_chunk_timeout_secs = data.tui_stream_chunk_timeout_secs;
  if (data.tui_osc8_links !== undefined) cwCfg.tui.osc8_links = data.tui_osc8_links;

  // 安全与审批
  if (data.approval_policy !== undefined) cwCfg.approval_policy = data.approval_policy;
  if (data.sandbox_mode !== undefined) cwCfg.sandbox_mode = data.sandbox_mode;
  if (data.allow_shell !== undefined) cwCfg.allow_shell = data.allow_shell;

  // 子代理
  if (!cwCfg.subagents || typeof cwCfg.subagents !== 'object') cwCfg.subagents = {};
  if (data.subagents_max_concurrent !== undefined) cwCfg.subagents.max_concurrent = data.subagents_max_concurrent;
  if (data.subagents_token_budget !== undefined) cwCfg.subagents.token_budget = data.subagents_token_budget;
  if (data.subagents_api_timeout_secs !== undefined) cwCfg.subagents.api_timeout_secs = data.subagents_api_timeout_secs;
  if (data.subagents_heartbeat_timeout_secs !== undefined) cwCfg.subagents.heartbeat_timeout_secs = data.subagents_heartbeat_timeout_secs;
  if (data.subagents_default_model !== undefined) cwCfg.subagents.default_model = data.subagents_default_model;
  if (data.subagents_max_depth !== undefined) cwCfg.subagents.max_depth = data.subagents_max_depth;
  if (data.subagents_launch_concurrency !== undefined) cwCfg.subagents.launch_concurrency = data.subagents_launch_concurrency;
  if (data.subagents_max_admitted !== undefined) cwCfg.subagents.max_admitted = data.subagents_max_admitted;
  if (data.subagents_worker_model !== undefined) cwCfg.subagents.worker_model = data.subagents_worker_model;
  if (data.subagents_explorer_model !== undefined) cwCfg.subagents.explorer_model = data.subagents_explorer_model;
  if (data.subagents_awaiter_model !== undefined) cwCfg.subagents.awaiter_model = data.subagents_awaiter_model;
  if (data.subagents_review_model !== undefined) cwCfg.subagents.review_model = data.subagents_review_model;
  if (data.subagents_custom_model !== undefined) cwCfg.subagents.custom_model = data.subagents_custom_model;

  // 重试
  if (!cwCfg.retry || typeof cwCfg.retry !== 'object') cwCfg.retry = {};
  if (data.retry_enabled !== undefined) cwCfg.retry.enabled = data.retry_enabled;
  if (data.retry_max_retries !== undefined) cwCfg.retry.max_retries = data.retry_max_retries;
  if (data.retry_initial_delay !== undefined) cwCfg.retry.initial_delay = data.retry_initial_delay;
  if (data.retry_max_delay !== undefined) cwCfg.retry.max_delay = data.retry_max_delay;
  if (data.retry_exponential_base !== undefined) cwCfg.retry.exponential_base = data.retry_exponential_base;

  // 通知
  if (!cwCfg.notifications || typeof cwCfg.notifications !== 'object') cwCfg.notifications = {};
  if (data.notifications_method !== undefined) cwCfg.notifications.method = data.notifications_method;
  if (data.notifications_threshold_secs !== undefined) cwCfg.notifications.threshold_secs = data.notifications_threshold_secs;
  if (data.notifications_completion_sound !== undefined) cwCfg.notifications.completion_sound = data.notifications_completion_sound;
  if (data.notifications_include_summary !== undefined) cwCfg.notifications.include_summary = data.notifications_include_summary;
  if (data.sound_file !== undefined) cwCfg.notifications.sound_file = data.sound_file;

  // 功能开关
  if (!cwCfg.features || typeof cwCfg.features !== 'object') cwCfg.features = {};
  if (data.features_shell_tool !== undefined) cwCfg.features.shell_tool = data.features_shell_tool;
  if (data.features_subagents !== undefined) cwCfg.features.subagents = data.features_subagents;
  if (data.features_web_search !== undefined) cwCfg.features.web_search = data.features_web_search;
  if (data.features_apply_patch !== undefined) cwCfg.features.apply_patch = data.features_apply_patch;
  if (data.features_mcp !== undefined) cwCfg.features.mcp = data.features_mcp;
  if (data.features_exec_policy !== undefined) cwCfg.features.exec_policy = data.features_exec_policy;
  if (data.features_vision_model !== undefined) cwCfg.features.vision_model = data.features_vision_model;

  // 搜索
  if (!cwCfg.search || typeof cwCfg.search !== 'object') cwCfg.search = {};
  if (data.search_provider !== undefined) cwCfg.search.provider = data.search_provider;
  if (data.search_base_url !== undefined) cwCfg.search.base_url = data.search_base_url;

  // 更新
  if (!cwCfg.update || typeof cwCfg.update !== 'object') cwCfg.update = {};
  if (data.update_check_for_updates !== undefined) cwCfg.update.check_for_updates = data.update_check_for_updates;
  if (data.update_uri !== undefined) cwCfg.update.uri = data.update_uri;

  // 容量控制
  if (!cwCfg.capacity || typeof cwCfg.capacity !== 'object') cwCfg.capacity = {};
  if (data.capacity_enabled !== undefined) cwCfg.capacity.enabled = data.capacity_enabled;
  if (data.capacity_low_risk_max !== undefined) cwCfg.capacity.low_risk_max = data.capacity_low_risk_max;
  if (data.capacity_medium_risk_max !== undefined) cwCfg.capacity.medium_risk_max = data.capacity_medium_risk_max;
  if (data.capacity_severe_min_slack !== undefined) cwCfg.capacity.severe_min_slack = data.capacity_severe_min_slack;
  if (data.capacity_severe_violation_ratio !== undefined) cwCfg.capacity.severe_violation_ratio = data.capacity_severe_violation_ratio;
  if (data.capacity_refresh_cooldown_turns !== undefined) cwCfg.capacity.refresh_cooldown_turns = data.capacity_refresh_cooldown_turns;
  if (data.capacity_replan_cooldown_turns !== undefined) cwCfg.capacity.replan_cooldown_turns = data.capacity_replan_cooldown_turns;
  if (data.capacity_max_replay_per_turn !== undefined) cwCfg.capacity.max_replay_per_turn = data.capacity_max_replay_per_turn;
  if (data.capacity_min_turns_before_guardrail !== undefined) cwCfg.capacity.min_turns_before_guardrail = data.capacity_min_turns_before_guardrail;
  if (data.capacity_profile_window !== undefined) cwCfg.capacity.profile_window = data.capacity_profile_window;
  if (data.capacity_deepseek_v3_2_chat_prior !== undefined) cwCfg.capacity.deepseek_v3_2_chat_prior = data.capacity_deepseek_v3_2_chat_prior;
  if (data.capacity_deepseek_v3_2_reasoner_prior !== undefined) cwCfg.capacity.deepseek_v3_2_reasoner_prior = data.capacity_deepseek_v3_2_reasoner_prior;
  if (data.capacity_deepseek_v4_pro_prior !== undefined) cwCfg.capacity.deepseek_v4_pro_prior = data.capacity_deepseek_v4_pro_prior;
  if (data.capacity_deepseek_v4_flash_prior !== undefined) cwCfg.capacity.deepseek_v4_flash_prior = data.capacity_deepseek_v4_flash_prior;
  if (data.capacity_fallback_default_prior !== undefined) cwCfg.capacity.fallback_default_prior = data.capacity_fallback_default_prior;

  // 上下文管理
  if (!cwCfg.context || typeof cwCfg.context !== 'object') cwCfg.context = {};
  if (data.context_enabled !== undefined) cwCfg.context.enabled = data.context_enabled;
  if (data.CODEWHALE_CACHE_MAXIMAL !== undefined) cwCfg.context.CODEWHALE_CACHE_MAXIMAL = data.CODEWHALE_CACHE_MAXIMAL;
  if (data.context_verbatim_window_turns !== undefined) cwCfg.context.verbatim_window_turns = data.context_verbatim_window_turns;
  if (data.context_l1_threshold !== undefined) cwCfg.context.l1_threshold = data.context_l1_threshold;
  if (data.context_l2_threshold !== undefined) cwCfg.context.l2_threshold = data.context_l2_threshold;
  if (data.context_l3_threshold !== undefined) cwCfg.context.l3_threshold = data.context_l3_threshold;
  if (data.context_seam_model !== undefined) cwCfg.context.seam_model = data.context_seam_model;

  // 路径与存储
  if (data.skills_scan_codewhale_only !== undefined) cwCfg.skills_scan_codewhale_only = data.skills_scan_codewhale_only;
  if (data.memory_enabled !== undefined) {
    if (!cwCfg.memory || typeof cwCfg.memory !== 'object') cwCfg.memory = {};
    cwCfg.memory.enabled = data.memory_enabled;
  }
  if (data.snapshots_enabled !== undefined) {
    if (!cwCfg.snapshots || typeof cwCfg.snapshots !== 'object') cwCfg.snapshots = {};
    cwCfg.snapshots.enabled = data.snapshots_enabled;
  }
  if (data.verifier_enabled !== undefined) {
    if (!cwCfg.verifier || typeof cwCfg.verifier !== 'object') cwCfg.verifier = {};
    cwCfg.verifier.enabled = data.verifier_enabled;
  }
  if (data.snapshots_max_age_days !== undefined) {
    if (!cwCfg.snapshots || typeof cwCfg.snapshots !== 'object') cwCfg.snapshots = {};
    cwCfg.snapshots.max_age_days = data.snapshots_max_age_days;
  }
  if (data.skills_dir !== undefined) cwCfg.skills_dir = data.skills_dir;
  if (data.mcp_config_path !== undefined) cwCfg.mcp_config_path = data.mcp_config_path;
  if (data.notes_path !== undefined) cwCfg.notes_path = data.notes_path;
  if (data.memory_path !== undefined) cwCfg.memory_path = data.memory_path;

  // 推理
  if (!cwCfg.reasoning || typeof cwCfg.reasoning !== 'object') cwCfg.reasoning = {};
  if (data.reasoning_effort !== undefined) cwCfg.reasoning.effort = data.reasoning_effort;

  // 安全
  if (!cwCfg.permissions || typeof cwCfg.permissions !== 'object') cwCfg.permissions = {};
  if (data.permissions_toml !== undefined) cwCfg.permissions.toml = data.permissions_toml;

  const dir = dirname(cwPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    cwPath,
    '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwCfg),
    'utf-8'
  );
}

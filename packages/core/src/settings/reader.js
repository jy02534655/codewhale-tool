/**
 * CodeWhale 通用设置读取器
 *
 * 从 ~/.codewhale/config.toml 读取通用设置，映射为前端平铺结构。
 */

import { homedir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

/**
 * 获取 CodeWhale 配置文件路径
 * @returns {string}
 */
export function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

/**
 * 将 instruction path 解析为绝对路径
 * @param {string} path
 * @returns {string}
 */
function resolveInstructionPath(path) {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  if (isAbsolute(path)) {
    return path;
  }
  return join(process.cwd(), path);
}

/**
 * 判断是否为全局配置路径（如 ~/.codewhale/global.md）
 * @param {string} path
 * @returns {boolean}
 */
function isGlobalInstructionPath(path) {
  const resolved = resolveInstructionPath(path);
  const globalPath = join(homedir(), '.codewhale', 'global.md');
  return resolved === globalPath;
}

/**
 * 读取 instruction 文件内容
 * @param {string} path
 * @returns {string}
 */
function readInstructionContent(path) {
  const resolvedPath = resolveInstructionPath(path);
  if (existsSync(resolvedPath)) {
    try {
      return readFileSync(resolvedPath, 'utf-8');
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * 从 CodeWhale config.toml 读取通用设置，映射为前端平铺结构
 * @returns {Object}
 */
export function readSettingsFromCodeWhale() {
  const cwPath = codeWhalePath();
  if (!existsSync(cwPath)) {
    return {
      locale: 'zh-Hans',
      default_text_model: 'deepseek-v4-pro',
      instructions: [],
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
      tui_mouse_capture: true,
      tui_stream_chunk_timeout_secs: 300,
      tui_osc8_links: true,
      approval_policy: 'on-request',
      sandbox_mode: 'read-only',
      allow_shell: false,
      subagents_max_concurrent: 20,
      subagents_token_budget: 0,
      subagents_api_timeout_secs: 120,
      subagents_heartbeat_timeout_secs: 300,
      subagents_default_model: '',
      subagents_max_depth: 0,
      subagents_launch_concurrency: 20,
      subagents_max_admitted: 200,
      subagents_worker_model: '',
      subagents_explorer_model: '',
      subagents_awaiter_model: '',
      subagents_review_model: '',
      subagents_custom_model: '',
      retry_enabled: true,
      retry_max_retries: 3,
      retry_initial_delay: 1.0,
      retry_max_delay: 60.0,
      retry_exponential_base: 2.0,
      notifications_method: 'auto',
      notifications_threshold_secs: 30,
      notifications_completion_sound: 'beep',
      notifications_include_summary: false,
      sound_file: '',
      features_shell_tool: true,
      features_subagents: true,
      features_web_search: true,
      features_apply_patch: true,
      features_mcp: true,
      features_exec_policy: true,
      features_vision_model: false,
      search_provider: 'duckduckgo',
      search_base_url: '',
      update_check_for_updates: true,
      update_uri: '',
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
      context_enabled: false,
      CODEWHALE_CACHE_MAXIMAL: false,
      context_verbatim_window_turns: 16,
      context_l1_threshold: 192000,
      context_l2_threshold: 384000,
      context_l3_threshold: 576000,
      context_seam_model: 'deepseek-v4-flash',
      skills_scan_codewhale_only: false,
      memory_enabled: false,
      snapshots_enabled: true,
      verifier_enabled: false,
      snapshots_max_age_days: 7,
      skills_dir: '~/.codewhale/skills',
      mcp_config_path: '~/.codewhale/mcp.json',
      notes_path: '~/.codewhale/notes.txt',
      memory_path: '~/.codewhale/memory.md',
      reasoning_effort: 'medium',
      permissions_toml: '',
      default_model: '',
    };
  }
  try {
    const raw = readFileSync(cwPath, 'utf-8');
    const cwCfg = parse(raw);
    const rawInstructions = cwCfg.instructions || [];
    const instructions = rawInstructions
      .map((item) => {
        let path, content, readonly;
        if (typeof item === 'string') {
          path = item;
          content = '';
          readonly = false;
        } else if (item && typeof item === 'object' && item.path) {
          path = item.path;
          content = item.content || '';
          readonly = !!item.readonly;
        } else {
          return null;
        }

        // 判断是否为全局配置路径
        if (isGlobalInstructionPath(path)) {
          readonly = true;
        }

        // 如果不是只读，尝试读取文件内容
        if (!readonly) {
          content = readInstructionContent(path);
        }

        return { path, content, readonly };
      })
      .filter(Boolean);
    return {
      locale: cwCfg.tui?.locale || cwCfg.locale || 'zh-Hans',
      default_text_model: cwCfg.default_text_model || 'deepseek-v4-pro',
      instructions,
      theme: cwCfg.theme || 'system',
      default_mode: cwCfg.default_mode || 'agent',
      sidebar_focus: cwCfg.sidebar_focus || 'pinned',
      show_thinking: cwCfg.show_thinking ?? true,
      show_tool_details: cwCfg.show_tool_details ?? true,
      auto_compact: cwCfg.auto_compact ?? true,
      auto_compact_threshold_percent: cwCfg.auto_compact_threshold_percent || 80,
      paste_burst_detection: cwCfg.paste_burst_detection ?? true,
      mention_menu_limit: cwCfg.mention_menu_limit || 128,
      mention_walk_depth: cwCfg.mention_walk_depth ?? 6,
      mention_menu_behavior: cwCfg.mention_menu_behavior || 'fuzzy',
      cost_currency: cwCfg.cost_currency || 'usd',
      background_color: cwCfg.background_color || 'default',
      max_history: cwCfg.max_history || 1000,
      verbosity: cwCfg.verbosity || 'normal',
      tui_alternate_screen: cwCfg.tui?.alternate_screen || 'auto',
      tui_mouse_capture: cwCfg.tui?.mouse_capture ?? true,
      tui_terminal_probe_timeout_ms: cwCfg.tui?.terminal_probe_timeout_ms || 500,
      tui_stream_chunk_timeout_secs: cwCfg.tui?.stream_chunk_timeout_secs || 300,
      tui_osc8_links: cwCfg.tui?.osc8_links ?? true,
      approval_policy: cwCfg.approval_policy || 'on-request',
      sandbox_mode: cwCfg.sandbox_mode || 'read-only',
      allow_shell: cwCfg.allow_shell ?? false,
      subagents_max_concurrent: cwCfg.subagents?.max_concurrent || 20,
      subagents_token_budget: cwCfg.subagents?.token_budget || 0,
      subagents_api_timeout_secs: cwCfg.subagents?.api_timeout_secs || 120,
      subagents_heartbeat_timeout_secs: cwCfg.subagents?.heartbeat_timeout_secs || 300,
      subagents_default_model: cwCfg.subagents?.default_model || '',
      subagents_max_depth: cwCfg.subagents?.max_depth || 0,
      subagents_launch_concurrency: cwCfg.subagents?.launch_concurrency || 20,
      subagents_max_admitted: cwCfg.subagents?.max_admitted || 200,
      subagents_worker_model: cwCfg.subagents?.worker_model || '',
      subagents_explorer_model: cwCfg.subagents?.explorer_model || '',
      subagents_awaiter_model: cwCfg.subagents?.awaiter_model || '',
      subagents_review_model: cwCfg.subagents?.review_model || '',
      subagents_custom_model: cwCfg.subagents?.custom_model || '',
      retry_enabled: cwCfg.retry?.enabled ?? true,
      retry_max_retries: cwCfg.retry?.max_retries || 3,
      retry_initial_delay: cwCfg.retry?.initial_delay ?? 1.0,
      retry_max_delay: cwCfg.retry?.max_delay ?? 60.0,
      retry_exponential_base: cwCfg.retry?.exponential_base ?? 2.0,
      notifications_method: cwCfg.notifications?.method || 'auto',
      notifications_threshold_secs: cwCfg.notifications?.threshold_secs || 30,
      notifications_completion_sound: cwCfg.notifications?.completion_sound || 'beep',
      notifications_include_summary: cwCfg.notifications?.include_summary ?? false,
      sound_file: cwCfg.notifications?.sound_file || '',
      features_shell_tool: cwCfg.features?.shell_tool ?? true,
      features_subagents: cwCfg.features?.subagents ?? true,
      features_web_search: cwCfg.features?.web_search ?? true,
      features_apply_patch: cwCfg.features?.apply_patch ?? true,
      features_mcp: cwCfg.features?.mcp ?? true,
      features_exec_policy: cwCfg.features?.exec_policy ?? true,
      features_vision_model: cwCfg.features?.vision_model ?? false,
      search_provider: cwCfg.search?.provider || 'duckduckgo',
      search_base_url: cwCfg.search?.base_url || '',
      update_check_for_updates: cwCfg.update?.check_for_updates ?? true,
      update_uri: cwCfg.update?.uri || '',
      capacity_enabled: cwCfg.capacity?.enabled ?? false,
      capacity_low_risk_max: cwCfg.capacity?.low_risk_max || 0.50,
      capacity_medium_risk_max: cwCfg.capacity?.medium_risk_max || 0.62,
      capacity_severe_min_slack: cwCfg.capacity?.severe_min_slack || -0.25,
      capacity_severe_violation_ratio: cwCfg.capacity?.severe_violation_ratio || 0.40,
      capacity_refresh_cooldown_turns: cwCfg.capacity?.refresh_cooldown_turns || 6,
      capacity_replan_cooldown_turns: cwCfg.capacity?.replan_cooldown_turns || 5,
      capacity_max_replay_per_turn: cwCfg.capacity?.max_replay_per_turn || 1,
      capacity_min_turns_before_guardrail: cwCfg.capacity?.min_turns_before_guardrail || 4,
      capacity_profile_window: cwCfg.capacity?.profile_window || 8,
      capacity_deepseek_v3_2_chat_prior: cwCfg.capacity?.deepseek_v3_2_chat_prior || 3.9,
      capacity_deepseek_v3_2_reasoner_prior: cwCfg.capacity?.deepseek_v3_2_reasoner_prior || 4.1,
      capacity_deepseek_v4_pro_prior: cwCfg.capacity?.deepseek_v4_pro_prior || 3.5,
      capacity_deepseek_v4_flash_prior: cwCfg.capacity?.deepseek_v4_flash_prior || 4.2,
      capacity_fallback_default_prior: cwCfg.capacity?.fallback_default_prior || 3.8,
      context_enabled: cwCfg.context?.enabled ?? false,
      CODEWHALE_CACHE_MAXIMAL: cwCfg.context?.CODEWHALE_CACHE_MAXIMAL ?? false,
      context_verbatim_window_turns: cwCfg.context?.verbatim_window_turns || 16,
      context_l1_threshold: cwCfg.context?.l1_threshold || 192000,
      context_l2_threshold: cwCfg.context?.l2_threshold || 384000,
      context_l3_threshold: cwCfg.context?.l3_threshold || 576000,
      context_seam_model: cwCfg.context?.seam_model || 'deepseek-v4-flash',
      skills_scan_codewhale_only: cwCfg.skills_scan_codewhale_only ?? false,
      memory_enabled: cwCfg.memory?.enabled ?? false,
      snapshots_enabled: cwCfg.snapshots?.enabled ?? true,
      verifier_enabled: cwCfg.verifier?.enabled ?? false,
      snapshots_max_age_days: cwCfg.snapshots?.max_age_days || 7,
      skills_dir: cwCfg.skills_dir || '~/.codewhale/skills',
      mcp_config_path: cwCfg.mcp_config_path || '~/.codewhale/mcp.json',
      notes_path: cwCfg.notes_path || '~/.codewhale/notes.txt',
      memory_path: cwCfg.memory_path || '~/.codewhale/memory.md',
      reasoning_effort: cwCfg.reasoning?.effort || 'medium',
      permissions_toml: cwCfg.permissions?.toml || '',
      default_model: cwCfg.default_model || '',
    };
  } catch {
    return {
      locale: 'zh-Hans',
      default_text_model: 'deepseek-v4-pro',
      instructions: [],
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
      tui_mouse_capture: true,
      tui_terminal_probe_timeout_ms: 500,
      tui_stream_chunk_timeout_secs: 300,
      tui_osc8_links: true,
      approval_policy: 'on-request',
      sandbox_mode: 'read-only',
      allow_shell: false,
      subagents_max_concurrent: 20,
      subagents_token_budget: 0,
      subagents_api_timeout_secs: 120,
      subagents_heartbeat_timeout_secs: 300,
      subagents_default_model: '',
      subagents_max_depth: 0,
      subagents_launch_concurrency: 20,
      subagents_max_admitted: 200,
      subagents_worker_model: '',
      subagents_explorer_model: '',
      subagents_awaiter_model: '',
      subagents_review_model: '',
      subagents_custom_model: '',
      retry_enabled: true,
      retry_max_retries: 3,
      retry_initial_delay: 1.0,
      retry_max_delay: 60.0,
      retry_exponential_base: 2.0,
      notifications_method: 'auto',
      notifications_threshold_secs: 30,
      notifications_completion_sound: 'beep',
      notifications_include_summary: false,
      sound_file: '',
      features_shell_tool: true,
      features_subagents: true,
      features_web_search: true,
      features_apply_patch: true,
      features_mcp: true,
      features_exec_policy: true,
      features_vision_model: false,
      search_provider: 'duckduckgo',
      search_base_url: '',
      update_check_for_updates: true,
      update_uri: '',
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
      context_enabled: false,
      CODEWHALE_CACHE_MAXIMAL: false,
      context_verbatim_window_turns: 16,
      context_l1_threshold: 192000,
      context_l2_threshold: 384000,
      context_l3_threshold: 576000,
      context_seam_model: 'deepseek-v4-flash',
      skills_scan_codewhale_only: false,
      memory_enabled: false,
      snapshots_enabled: true,
      verifier_enabled: false,
      snapshots_max_age_days: 7,
      skills_dir: '~/.codewhale/skills',
      mcp_config_path: '~/.codewhale/mcp.json',
      notes_path: '~/.codewhale/notes.txt',
      memory_path: '~/.codewhale/memory.md',
      reasoning_effort: 'medium',
      permissions_toml: '',
      default_model: '',
    };
  }
}

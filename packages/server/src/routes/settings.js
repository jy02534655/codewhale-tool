/**
 * @codewhale/server — 通用设置路由
 *
 * 挂载路径: /api/settings
 * instructions 直接从 CodeWhale config.toml 读写；
 * locale / default_text_model 同时维护 store.json 与 config.toml 双向一致。
 * 统一通过 guard 包装返回格式。
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';
import { okMsg } from '@codewhale/core';
import { parse, stringify } from 'smol-toml';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, isAbsolute } from 'node:path';

/**
 * 获取 CodeWhale 配置文件路径
 * @returns {string}
 */
function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

/**
 * 从 CodeWhale config.toml 读取通用设置
 * @returns {{ locale: string, default_text_model: string, instructions: Array<{path: string, content: string, readonly: boolean}> }}
 */
function readSettingsFromCodeWhale() {
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
      retry_enabled: true,
      retry_max_retries: 3,
      retry_initial_delay: 1.0,
      retry_max_delay: 60.0,
      retry_exponential_base: 2.0,
      notifications_method: 'auto',
      notifications_threshold_secs: 30,
      notifications_completion_sound: 'beep',
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
      retry_enabled: cwCfg.retry?.enabled ?? true,
      retry_max_retries: cwCfg.retry?.max_retries || 3,
      retry_initial_delay: cwCfg.retry?.initial_delay ?? 1.0,
      retry_max_delay: cwCfg.retry?.max_delay ?? 60.0,
      retry_exponential_base: cwCfg.retry?.exponential_base ?? 2.0,
      notifications_method: cwCfg.notifications?.method || 'auto',
      notifications_threshold_secs: cwCfg.notifications?.threshold_secs || 30,
      notifications_completion_sound: cwCfg.notifications?.completion_sound || 'beep',
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
      retry_enabled: true,
      retry_max_retries: 3,
      retry_initial_delay: 1.0,
      retry_max_delay: 60.0,
      retry_exponential_base: 2.0,
      notifications_method: 'auto',
      notifications_threshold_secs: 30,
      notifications_completion_sound: 'beep',
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
    };
  }
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
 * 将通用设置写入 CodeWhale config.toml
 * @param {{ locale?: string, default_text_model?: string, instructions?: Array<{path: string, content?: string}> }} data
 */
function writeSettingsToCodeWhale(data) {
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

  const dir = dirname(cwPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    cwPath,
    '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwCfg),
    'utf-8'
  );
}

/**
 * @param {import('@codewhale/core').ConfigEngine} engine
 * @returns {import('express').Router}
 */
export function createSettingsRouter(engine) {
  const router = Router();

  /**
   * 获取通用设置（直接从 CodeWhale config.toml 读取 instructions）
   *
   * @returns {{ success: boolean, data: { locale: string, default_text_model: string, instructions: Array<{path: string, content?: string}> }, message?: string }}
   */
  router.get('/', (req, res) => {
    res.json(guard(() => {
      const cw = readSettingsFromCodeWhale();
      // locale / default_text_model 以 store.json 为准，避免 config.toml 被外部工具篡改时影响本地状态
      const store = engine.getSettings();
      return okMsg('', {
        locale: cw.locale || store.data.locale,
        default_text_model: cw.default_text_model || store.data.default_text_model,
        instructions: cw.instructions,
        theme: cw.theme,
        default_mode: cw.default_mode,
        sidebar_focus: cw.sidebar_focus,
        show_thinking: cw.show_thinking,
        show_tool_details: cw.show_tool_details,
        auto_compact: cw.auto_compact,
        auto_compact_threshold_percent: cw.auto_compact_threshold_percent,
        paste_burst_detection: cw.paste_burst_detection,
        mention_menu_limit: cw.mention_menu_limit,
        mention_walk_depth: cw.mention_walk_depth,
        mention_menu_behavior: cw.mention_menu_behavior,
        cost_currency: cw.cost_currency,
        background_color: cw.background_color,
        max_history: cw.max_history,
        verbosity: cw.verbosity,
        tui_alternate_screen: cw.tui_alternate_screen,
        tui_mouse_capture: cw.tui_mouse_capture,
        tui_terminal_probe_timeout_ms: cw.tui_terminal_probe_timeout_ms,
        tui_stream_chunk_timeout_secs: cw.tui_stream_chunk_timeout_secs,
        tui_osc8_links: cw.tui_osc8_links,
        approval_policy: cw.approval_policy,
        sandbox_mode: cw.sandbox_mode,
        allow_shell: cw.allow_shell,
        subagents_max_concurrent: cw.subagents_max_concurrent,
        subagents_token_budget: cw.subagents_token_budget,
        subagents_api_timeout_secs: cw.subagents_api_timeout_secs,
        subagents_heartbeat_timeout_secs: cw.subagents_heartbeat_timeout_secs,
        subagents_default_model: cw.subagents_default_model,
        retry_enabled: cw.retry_enabled,
        retry_max_retries: cw.retry_max_retries,
        retry_initial_delay: cw.retry_initial_delay,
        retry_max_delay: cw.retry_max_delay,
        retry_exponential_base: cw.retry_exponential_base,
        notifications_method: cw.notifications_method,
        notifications_threshold_secs: cw.notifications_threshold_secs,
        notifications_completion_sound: cw.notifications_completion_sound,
        features_shell_tool: cw.features_shell_tool,
        features_subagents: cw.features_subagents,
        features_web_search: cw.features_web_search,
        features_apply_patch: cw.features_apply_patch,
        features_mcp: cw.features_mcp,
        features_exec_policy: cw.features_exec_policy,
        features_vision_model: cw.features_vision_model,
        search_provider: cw.search_provider,
        search_base_url: cw.search_base_url,
        update_check_for_updates: cw.update_check_for_updates,
      });
    }));
  });

  /**
   * 更新通用设置（写入 CodeWhale config.toml，同时同步 store.json）
   *
   * @param {Object} body
   * @param {string} [body.locale]
   * @param {string} [body.default_text_model]
   * @param {Array<{path: string, content?: string}>} [body.instructions]
   */
  router.put('/', (req, res) => {
    res.json(guard(() => {
      const body = req.body || {};
      // 先写 CodeWhale 配置，确保用户修改不丢失
      writeSettingsToCodeWhale(body);
      // 再同步到本地 store.json，保持与其他模块一致
      engine.updateSettings(body);
      // 从 CodeWhale 配置重新读取，返回最新数据
      const cw = readSettingsFromCodeWhale();
      return okMsg('updated', {
        locale: cw.locale,
        default_text_model: cw.default_text_model,
        instructions: cw.instructions,
        theme: cw.theme,
        default_mode: cw.default_mode,
        sidebar_focus: cw.sidebar_focus,
        show_thinking: cw.show_thinking,
        show_tool_details: cw.show_tool_details,
        auto_compact: cw.auto_compact,
        auto_compact_threshold_percent: cw.auto_compact_threshold_percent,
        paste_burst_detection: cw.paste_burst_detection,
        mention_menu_limit: cw.mention_menu_limit,
        mention_walk_depth: cw.mention_walk_depth,
        mention_menu_behavior: cw.mention_menu_behavior,
        cost_currency: cw.cost_currency,
        background_color: cw.background_color,
        max_history: cw.max_history,
        verbosity: cw.verbosity,
        tui_alternate_screen: cw.tui_alternate_screen,
        tui_mouse_capture: cw.tui_mouse_capture,
        tui_terminal_probe_timeout_ms: cw.tui_terminal_probe_timeout_ms,
        tui_stream_chunk_timeout_secs: cw.tui_stream_chunk_timeout_secs,
        tui_osc8_links: cw.tui_osc8_links,
        approval_policy: cw.approval_policy,
        sandbox_mode: cw.sandbox_mode,
        allow_shell: cw.allow_shell,
        subagents_max_concurrent: cw.subagents_max_concurrent,
        subagents_token_budget: cw.subagents_token_budget,
        subagents_api_timeout_secs: cw.subagents_api_timeout_secs,
        subagents_heartbeat_timeout_secs: cw.subagents_heartbeat_timeout_secs,
        subagents_default_model: cw.subagents_default_model,
        retry_enabled: cw.retry_enabled,
        retry_max_retries: cw.retry_max_retries,
        retry_initial_delay: cw.retry_initial_delay,
        retry_max_delay: cw.retry_max_delay,
        retry_exponential_base: cw.retry_exponential_base,
        notifications_method: cw.notifications_method,
        notifications_threshold_secs: cw.notifications_threshold_secs,
        notifications_completion_sound: cw.notifications_completion_sound,
        features_shell_tool: cw.features_shell_tool,
        features_subagents: cw.features_subagents,
        features_web_search: cw.features_web_search,
        features_apply_patch: cw.features_apply_patch,
        features_mcp: cw.features_mcp,
        features_exec_policy: cw.features_exec_policy,
        features_vision_model: cw.features_vision_model,
        search_provider: cw.search_provider,
        search_base_url: cw.search_base_url,
        update_check_for_updates: cw.update_check_for_updates,
      });
    }));
  });

  return router;
}

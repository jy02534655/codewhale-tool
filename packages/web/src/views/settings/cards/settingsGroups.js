/**
 * 通用设置页面：分组配置数据
 * 统一维护可配置项与只读项分组，供 SettingsGroupCard 使用。
 *
 * 字段说明：
 * - key:      唯一标识，对应 formData 中的字段名
 * - tag:      组件标识符，如 el-input / el-input-number / el-switch / SettingsSelect
 * - labelKey:  i18n key，指向 settings.xxx.label
 * - helpKey:   i18n key，指向 settings.xxx.help
 * - optionKey: select 类型专用，对应 SETTINGS_OPTIONS 中的选项映射键
 * - attrs:    组件额外属性（min、max、step、placeholder、disabled 等）
 * - disabled: 是否禁用表单组件（只读项统一禁用）
 */

export const groups = [
  // ========== 可配置分组 ==========
  {
    titleKey: 'settings.basic_title',
    items: [
      { key: 'locale', tag: 'SettingsSelect', labelKey: 'settings.language.label', helpKey: 'settings.language.help', optionKey: 'locale' },
      { key: 'default_text_model', tag: 'el-input', labelKey: 'settings.default_model.label', helpKey: 'settings.default_model.help' },
      { key: 'update_check_for_updates', tag: 'el-switch', labelKey: 'settings.update_check_for_updates.label', helpKey: 'settings.update_check_for_updates.help' }
    ]
  },
  {
    titleKey: 'settings.tui_interface_title',
    items: [
      { key: 'theme', tag: 'SettingsSelect', labelKey: 'settings.theme.label', helpKey: 'settings.theme.help', optionKey: 'theme' },
      { key: 'default_mode', tag: 'SettingsSelect', labelKey: 'settings.default_mode.label', helpKey: 'settings.default_mode.help', optionKey: 'default_mode' },
      { key: 'sidebar_focus', tag: 'SettingsSelect', labelKey: 'settings.sidebar_focus.label', helpKey: 'settings.sidebar_focus.help', optionKey: 'sidebar_focus' },
      { key: 'mention_menu_behavior', tag: 'SettingsSelect', labelKey: 'settings.mention_menu_behavior.label', helpKey: 'settings.mention_menu_behavior.help', optionKey: 'mention_menu_behavior' },
      { key: 'cost_currency', tag: 'SettingsSelect', labelKey: 'settings.cost_currency.label', helpKey: 'settings.cost_currency.help', optionKey: 'cost_currency' },
      { key: 'verbosity', tag: 'SettingsSelect', labelKey: 'settings.verbosity.label', helpKey: 'settings.verbosity.help', optionKey: 'verbosity' },
      { key: 'show_thinking', tag: 'el-switch', labelKey: 'settings.show_thinking.label', helpKey: 'settings.show_thinking.help' },
      { key: 'show_tool_details', tag: 'el-switch', labelKey: 'settings.show_tool_details.label', helpKey: 'settings.show_tool_details.help' },
      { key: 'auto_compact', tag: 'el-switch', labelKey: 'settings.auto_compact.label', helpKey: 'settings.auto_compact.help' },
      { key: 'paste_burst_detection', tag: 'el-switch', labelKey: 'settings.paste_burst_detection.label', helpKey: 'settings.paste_burst_detection.help' },
      { key: 'auto_compact_threshold_percent', tag: 'el-input-number', labelKey: 'settings.auto_compact_threshold_percent.label', helpKey: 'settings.auto_compact_threshold_percent.help', attrs: { min: 10, max: 100 } },
      { key: 'mention_menu_limit', tag: 'el-input-number', labelKey: 'settings.mention_menu_limit.label', helpKey: 'settings.mention_menu_limit.help', attrs: { min: 1 } },
      { key: 'mention_walk_depth', tag: 'el-input-number', labelKey: 'settings.mention_walk_depth.label', helpKey: 'settings.mention_walk_depth.help', attrs: { min: 0 } },
      { key: 'max_history', tag: 'el-input-number', labelKey: 'settings.max_history.label', helpKey: 'settings.max_history.help', attrs: { min: 1 } },
      { key: 'background_color', tag: 'el-input', labelKey: 'settings.background_color.label', helpKey: 'settings.background_color.help' },
      { key: 'default_model', tag: 'el-input', labelKey: 'settings.default_model_override.label', helpKey: 'settings.default_model_override.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.tui_terminal_title',
    items: [
      { key: 'tui_alternate_screen', tag: 'SettingsSelect', labelKey: 'settings.tui_alternate_screen.label', helpKey: 'settings.tui_alternate_screen.help', optionKey: 'tui_alternate_screen' },
      { key: 'tui_mouse_capture', tag: 'el-switch', labelKey: 'settings.tui_mouse_capture.label', helpKey: 'settings.tui_mouse_capture.help' },
      { key: 'tui_terminal_probe_timeout_ms', tag: 'el-input-number', labelKey: 'settings.tui_terminal_probe_timeout_ms.label', helpKey: 'settings.tui_terminal_probe_timeout_ms.help', attrs: { min: 100, max: 5000 } },
      { key: 'tui_stream_chunk_timeout_secs', tag: 'el-input-number', labelKey: 'settings.tui_stream_chunk_timeout_secs.label', helpKey: 'settings.tui_stream_chunk_timeout_secs.help', attrs: { min: 1, max: 3600 } },
      { key: 'tui_osc8_links', tag: 'el-switch', labelKey: 'settings.tui_osc8_links.label', helpKey: 'settings.tui_osc8_links.help' }
    ]
  },
  {
    titleKey: 'settings.security_title',
    items: [
      { key: 'approval_policy', tag: 'SettingsSelect', labelKey: 'settings.approval_policy.label', helpKey: 'settings.approval_policy.help', optionKey: 'approval_policy' },
      { key: 'sandbox_mode', tag: 'SettingsSelect', labelKey: 'settings.sandbox_mode.label', helpKey: 'settings.sandbox_mode.help', optionKey: 'sandbox_mode' },
      { key: 'allow_shell', tag: 'el-switch', labelKey: 'settings.allow_shell.label', helpKey: 'settings.allow_shell.help' }
    ]
  },
  {
    titleKey: 'settings.subagents_title',
    items: [
      { key: 'subagents_max_concurrent', tag: 'el-input-number', labelKey: 'settings.subagents_max_concurrent.label', helpKey: 'settings.subagents_max_concurrent.help', attrs: { min: 1, max: 20 } },
      { key: 'subagents_token_budget', tag: 'el-input-number', labelKey: 'settings.subagents_token_budget.label', helpKey: 'settings.subagents_token_budget.help', attrs: { min: 0 } },
      { key: 'subagents_api_timeout_secs', tag: 'el-input-number', labelKey: 'settings.subagents_api_timeout_secs.label', helpKey: 'settings.subagents_api_timeout_secs.help', attrs: { min: 1, max: 1800 } },
      { key: 'subagents_heartbeat_timeout_secs', tag: 'el-input-number', labelKey: 'settings.subagents_heartbeat_timeout_secs.label', helpKey: 'settings.subagents_heartbeat_timeout_secs.help', attrs: { min: 30, max: 3600 } },
      { key: 'subagents_default_model', tag: 'el-input', labelKey: 'settings.subagents_default_model.label', helpKey: 'settings.subagents_default_model.help' }
    ]
  },
  {
    titleKey: 'settings.retry_title',
    items: [
      { key: 'retry_enabled', tag: 'el-switch', labelKey: 'settings.retry_enabled.label', helpKey: 'settings.retry_enabled.help' },
      { key: 'retry_max_retries', tag: 'el-input-number', labelKey: 'settings.retry_max_retries.label', helpKey: 'settings.retry_max_retries.help', attrs: { min: 0, max: 10 } },
      { key: 'retry_initial_delay', tag: 'el-input-number', labelKey: 'settings.retry_initial_delay.label', helpKey: 'settings.retry_initial_delay.help', attrs: { min: 0, max: 60, step: 0.1 } },
      { key: 'retry_max_delay', tag: 'el-input-number', labelKey: 'settings.retry_max_delay.label', helpKey: 'settings.retry_max_delay.help', attrs: { min: 0, max: 300, step: 0.1 } },
      { key: 'retry_exponential_base', tag: 'el-input-number', labelKey: 'settings.retry_exponential_base.label', helpKey: 'settings.retry_exponential_base.help', attrs: { min: 1, max: 10, step: 0.1 } }
    ]
  },
  {
    titleKey: 'settings.notifications_title',
    items: [
      { key: 'notifications_method', tag: 'SettingsSelect', labelKey: 'settings.notifications_method.label', helpKey: 'settings.notifications_method.help', optionKey: 'notifications_method' },
      { key: 'notifications_threshold_secs', tag: 'el-input-number', labelKey: 'settings.notifications_threshold_secs.label', helpKey: 'settings.notifications_threshold_secs.help', attrs: { min: 0, max: 3600 } },
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', labelKey: 'settings.notifications_completion_sound.label', helpKey: 'settings.notifications_completion_sound.help', optionKey: 'notifications_completion_sound' }
    ]
  },
  {
    titleKey: 'settings.features_title',
    items: [
      { key: 'features_shell_tool', tag: 'el-switch', labelKey: 'settings.features_shell_tool.label', helpKey: 'settings.features_shell_tool.help' },
      { key: 'features_subagents', tag: 'el-switch', labelKey: 'settings.features_subagents.label', helpKey: 'settings.features_subagents.help' },
      { key: 'features_web_search', tag: 'el-switch', labelKey: 'settings.features_web_search.label', helpKey: 'settings.features_web_search.help' },
      { key: 'features_apply_patch', tag: 'el-switch', labelKey: 'settings.features_apply_patch.label', helpKey: 'settings.features_apply_patch.help' },
      { key: 'features_mcp', tag: 'el-switch', labelKey: 'settings.features_mcp.label', helpKey: 'settings.features_mcp.help' },
      { key: 'features_exec_policy', tag: 'el-switch', labelKey: 'settings.features_exec_policy.label', helpKey: 'settings.features_exec_policy.help' },
      { key: 'features_vision_model', tag: 'el-switch', labelKey: 'settings.features_vision_model.label', helpKey: 'settings.features_vision_model.help' }
    ]
  },
  {
    titleKey: 'settings.search_title',
    items: [
      { key: 'search_provider', tag: 'SettingsSelect', labelKey: 'settings.search_provider.label', helpKey: 'settings.search_provider.help', optionKey: 'search_provider' },
      { key: 'search_base_url', tag: 'el-input', labelKey: 'settings.search_base_url.label', helpKey: 'settings.search_base_url.help' }
    ]
  },

  // ========== 只读分组 ==========
  {
    titleKey: 'settings.reasoning',
    items: [
      { key: 'reasoning_effort', tag: 'SettingsSelect', labelKey: 'settings.reasoning_effort.label', helpKey: 'settings.reasoning_effort.help', optionKey: 'reasoning_effort', disabled: true }
    ]
  },
  {
    titleKey: 'settings.context',
    items: [
      { key: 'context.enabled', tag: 'el-switch', labelKey: 'settings.context.enabled.label', helpKey: 'settings.context.enabled.help', disabled: true },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch', labelKey: 'settings.CODEWHALE_CACHE_MAXIMAL.label', helpKey: 'settings.CODEWHALE_CACHE_MAXIMAL.help', disabled: true },
      { key: 'context.verbatim_window_turns', tag: 'el-input-number', labelKey: 'settings.context.verbatim_window_turns.label', helpKey: 'settings.context.verbatim_window_turns.help', disabled: true },
      { key: 'context.l1_threshold', tag: 'el-input-number', labelKey: 'settings.context.l1_threshold.label', helpKey: 'settings.context.l1_threshold.help', disabled: true },
      { key: 'context.l2_threshold', tag: 'el-input-number', labelKey: 'settings.context.l2_threshold.label', helpKey: 'settings.context.l2_threshold.help', disabled: true },
      { key: 'context.l3_threshold', tag: 'el-input-number', labelKey: 'settings.context.l3_threshold.label', helpKey: 'settings.context.l3_threshold.help', disabled: true },
      { key: 'context.seam_model', tag: 'el-input', labelKey: 'settings.context.seam_model.label', helpKey: 'settings.context.seam_model.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.update',
    items: [
      { key: 'update.update_uri', tag: 'el-input', labelKey: 'settings.update.update_uri.label', helpKey: 'settings.update.update_uri.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.security',
    items: [
      { key: 'permissions.toml', tag: 'el-input', labelKey: 'settings.permissions.toml.label', helpKey: 'settings.permissions.toml.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.paths',
    items: [
      { key: 'skills.scan_codewhale_only', tag: 'el-switch', labelKey: 'settings.skills.scan_codewhale_only.label', helpKey: 'settings.skills.scan_codewhale_only.help', disabled: true },
      { key: 'memory.enabled', tag: 'el-switch', labelKey: 'settings.memory.enabled.label', helpKey: 'settings.memory.enabled.help', disabled: true },
      { key: 'snapshots.enabled', tag: 'el-switch', labelKey: 'settings.snapshots.enabled.label', helpKey: 'settings.snapshots.enabled.help', disabled: true },
      { key: 'verifier.enabled', tag: 'el-switch', labelKey: 'settings.verifier.enabled.label', helpKey: 'settings.verifier.enabled.help', disabled: true },
      { key: 'snapshots.max_age_days', tag: 'el-input-number', labelKey: 'settings.snapshots.max_age_days.label', helpKey: 'settings.snapshots.max_age_days.help', disabled: true },
      { key: 'verifier.verdict_policy', tag: 'SettingsSelect', labelKey: 'settings.verifier.verdict_policy.label', helpKey: 'settings.verifier.verdict_policy.help', optionKey: 'verifier_verdict_policy', disabled: true },
      { key: 'skills_dir', tag: 'el-input', labelKey: 'settings.skills_dir.label', helpKey: 'settings.skills_dir.help', disabled: true },
      { key: 'mcp_config_path', tag: 'el-input', labelKey: 'settings.mcp_config_path.label', helpKey: 'settings.mcp_config_path.help', disabled: true },
      { key: 'notes_path', tag: 'el-input', labelKey: 'settings.notes_path.label', helpKey: 'settings.notes_path.help', disabled: true },
      { key: 'memory_path', tag: 'el-input', labelKey: 'settings.memory_path.label', helpKey: 'settings.memory_path.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.capacity',
    items: [
      { key: 'capacity.enabled', tag: 'el-switch', labelKey: 'settings.capacity.enabled.label', helpKey: 'settings.capacity.enabled.help', disabled: true },
      { key: 'capacity.low_risk_max', tag: 'el-input-number', labelKey: 'settings.capacity.low_risk_max.label', helpKey: 'settings.capacity.low_risk_max.help', disabled: true },
      { key: 'capacity.medium_risk_max', tag: 'el-input-number', labelKey: 'settings.capacity.medium_risk_max.label', helpKey: 'settings.capacity.medium_risk_max.help', disabled: true },
      { key: 'capacity.severe_min_slack', tag: 'el-input-number', labelKey: 'settings.capacity.severe_min_slack.label', helpKey: 'settings.capacity.severe_min_slack.help', disabled: true },
      { key: 'capacity.severe_violation_ratio', tag: 'el-input-number', labelKey: 'settings.capacity.severe_violation_ratio.label', helpKey: 'settings.capacity.severe_violation_ratio.help', disabled: true },
      { key: 'capacity.refresh_cooldown_turns', tag: 'el-input-number', labelKey: 'settings.capacity.refresh_cooldown_turns.label', helpKey: 'settings.capacity.refresh_cooldown_turns.help', disabled: true },
      { key: 'capacity.replan_cooldown_turns', tag: 'el-input-number', labelKey: 'settings.capacity.replan_cooldown_turns.label', helpKey: 'settings.capacity.replan_cooldown_turns.help', disabled: true },
      { key: 'capacity.max_replay_per_turn', tag: 'el-input-number', labelKey: 'settings.capacity.max_replay_per_turn.label', helpKey: 'settings.capacity.max_replay_per_turn.help', disabled: true },
      { key: 'capacity.min_turns_before_guardrail', tag: 'el-input-number', labelKey: 'settings.capacity.min_turns_before_guardrail.label', helpKey: 'settings.capacity.min_turns_before_guardrail.help', disabled: true },
      { key: 'capacity.profile_window', tag: 'el-input-number', labelKey: 'settings.capacity.profile_window.label', helpKey: 'settings.capacity.profile_window.help', disabled: true },
      { key: 'capacity.deepseek_v3_2_chat_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v3_2_chat_prior.label', helpKey: 'settings.capacity.deepseek_v3_2_chat_prior.help', disabled: true },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v3_2_reasoner_prior.label', helpKey: 'settings.capacity.deepseek_v3_2_reasoner_prior.help', disabled: true },
      { key: 'capacity.deepseek_v4_pro_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v4_pro_prior.label', helpKey: 'settings.capacity.deepseek_v4_pro_prior.help', disabled: true },
      { key: 'capacity.deepseek_v4_flash_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v4_flash_prior.label', helpKey: 'settings.capacity.deepseek_v4_flash_prior.help', disabled: true },
      { key: 'capacity.fallback_default_prior', tag: 'el-input-number', labelKey: 'settings.capacity.fallback_default_prior.label', helpKey: 'settings.capacity.fallback_default_prior.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.subagents',
    items: [
      { key: 'subagents.max_depth', tag: 'el-input-number', labelKey: 'settings.subagents.max_depth.label', helpKey: 'settings.subagents.max_depth.help', disabled: true },
      { key: 'subagents.launch_concurrency', tag: 'el-input-number', labelKey: 'settings.subagents.launch_concurrency.label', helpKey: 'settings.subagents.launch_concurrency.help', disabled: true },
      { key: 'subagents.max_admitted', tag: 'el-input-number', labelKey: 'settings.subagents.max_admitted.label', helpKey: 'settings.subagents.max_admitted.help', disabled: true },
      { key: 'subagents.worker_model', tag: 'el-input', labelKey: 'settings.subagents.worker_model.label', helpKey: 'settings.subagents.worker_model.help', disabled: true },
      { key: 'subagents.explorer_model', tag: 'el-input', labelKey: 'settings.subagents.explorer_model.label', helpKey: 'settings.subagents.explorer_model.help', disabled: true },
      { key: 'subagents.awaiter_model', tag: 'el-input', labelKey: 'settings.subagents.awaiter_model.label', helpKey: 'settings.subagents.awaiter_model.help', disabled: true },
      { key: 'subagents.review_model', tag: 'el-input', labelKey: 'settings.subagents.review_model.label', helpKey: 'settings.subagents.review_model.help', disabled: true },
      { key: 'subagents.custom_model', tag: 'el-input', labelKey: 'settings.subagents.custom_model.label', helpKey: 'settings.subagents.custom_model.help', disabled: true }
    ]
  },
  {
    titleKey: 'settings.notifications',
    items: [
      { key: 'notifications.include_summary', tag: 'el-switch', labelKey: 'settings.notifications.include_summary.label', helpKey: 'settings.notifications.include_summary.help', disabled: true },
      { key: 'notifications.sound_file', tag: 'el-input', labelKey: 'settings.notifications.sound_file.label', helpKey: 'settings.notifications.sound_file.help', disabled: true }
    ]
  }
];

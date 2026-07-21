/**
 * 通用设置页面：可配置分组数据
 * 统一维护可配置项分组，供 SettingsGroupCard 使用。
 *
 * 字段说明：
 * - key:      唯一标识，对应 formData 中的字段名
 * - tag:      组件标识符，如 el-input / el-input-number / el-switch / SettingsSelect
 * - label:    i18n key 基础路径，SettingsGroupCard 会自动拼接 .label 和 .help
 * - optionKey: select 类型专用，对应 SETTINGS_OPTIONS 中的选项映射键
 * - autoSave: 是否在值变更时自动触发保存（对应原卡片中的 emit('save')）
 * - attrs:    组件额外属性（min、max、step、placeholder、disabled 等）
 */

export const editableGroups = [
  {
    titleKey: 'settings.basic_title',
    items: [
      { key: 'locale', tag: 'SettingsSelect', label: 'settings.language', optionKey: 'locale', autoSave: true },
      { key: 'default_text_model', tag: 'el-input', label: 'settings.default_model', autoSave: true },
      { key: 'update_check_for_updates', tag: 'el-switch', label: 'settings.update_check_for_updates', autoSave: true }
    ]
  },
  {
    titleKey: 'settings.tui_interface_title',
    items: [
      { key: 'theme', tag: 'SettingsSelect', label: 'settings.theme', optionKey: 'theme' },
      { key: 'default_mode', tag: 'SettingsSelect', label: 'settings.default_mode', optionKey: 'default_mode' },
      { key: 'sidebar_focus', tag: 'SettingsSelect', label: 'settings.sidebar_focus', optionKey: 'sidebar_focus' },
      { key: 'mention_menu_behavior', tag: 'SettingsSelect', label: 'settings.mention_menu_behavior', optionKey: 'mention_menu_behavior' },
      { key: 'cost_currency', tag: 'SettingsSelect', label: 'settings.cost_currency', optionKey: 'cost_currency' },
      { key: 'verbosity', tag: 'SettingsSelect', label: 'settings.verbosity', optionKey: 'verbosity' },
      { key: 'show_thinking', tag: 'el-switch', label: 'settings.show_thinking' },
      { key: 'show_tool_details', tag: 'el-switch', label: 'settings.show_tool_details' },
      { key: 'auto_compact', tag: 'el-switch', label: 'settings.auto_compact' },
      { key: 'paste_burst_detection', tag: 'el-switch', label: 'settings.paste_burst_detection' },
      { key: 'auto_compact_threshold_percent', tag: 'el-input-number', label: 'settings.auto_compact_threshold_percent', attrs: { min: 10, max: 100 } },
      { key: 'mention_menu_limit', tag: 'el-input-number', label: 'settings.mention_menu_limit', attrs: { min: 1 } },
      { key: 'mention_walk_depth', tag: 'el-input-number', label: 'settings.mention_walk_depth', attrs: { min: 0 } },
      { key: 'max_history', tag: 'el-input-number', label: 'settings.max_history', attrs: { min: 1 } },
      { key: 'background_color', tag: 'el-input', label: 'settings.background_color' },
      { key: 'default_model', tag: 'el-input', label: 'settings.default_model_override', disabled: true }
    ]
  },
  {
    titleKey: 'settings.tui_terminal_title',
    items: [
      { key: 'tui_alternate_screen', tag: 'SettingsSelect', label: 'settings.tui_alternate_screen', optionKey: 'tui_alternate_screen' },
      { key: 'tui_mouse_capture', tag: 'el-switch', label: 'settings.tui_mouse_capture' },
      { key: 'tui_terminal_probe_timeout_ms', tag: 'el-input-number', label: 'settings.tui_terminal_probe_timeout_ms', attrs: { min: 100, max: 5000 } },
      { key: 'tui_stream_chunk_timeout_secs', tag: 'el-input-number', label: 'settings.tui_stream_chunk_timeout_secs', attrs: { min: 1, max: 3600 } },
      { key: 'tui_osc8_links', tag: 'el-switch', label: 'settings.tui_osc8_links' }
    ]
  },
  {
    titleKey: 'settings.security_title',
    items: [
      { key: 'approval_policy', tag: 'SettingsSelect', label: 'settings.approval_policy', optionKey: 'approval_policy' },
      { key: 'sandbox_mode', tag: 'SettingsSelect', label: 'settings.sandbox_mode', optionKey: 'sandbox_mode' },
      { key: 'allow_shell', tag: 'el-switch', label: 'settings.allow_shell' }
    ]
  },
  {
    titleKey: 'settings.subagents_title',
    items: [
      { key: 'subagents_max_concurrent', tag: 'el-input-number', label: 'settings.subagents_max_concurrent', attrs: { min: 1, max: 20 } },
      { key: 'subagents_token_budget', tag: 'el-input-number', label: 'settings.subagents_token_budget', attrs: { min: 0 } },
      { key: 'subagents_api_timeout_secs', tag: 'el-input-number', label: 'settings.subagents_api_timeout_secs', attrs: { min: 1, max: 1800 } },
      { key: 'subagents_heartbeat_timeout_secs', tag: 'el-input-number', label: 'settings.subagents_heartbeat_timeout_secs', attrs: { min: 30, max: 3600 } },
      { key: 'subagents_default_model', tag: 'el-input', label: 'settings.subagents_default_model' }
    ]
  },
  {
    titleKey: 'settings.retry_title',
    items: [
      { key: 'retry_enabled', tag: 'el-switch', label: 'settings.retry_enabled' },
      { key: 'retry_max_retries', tag: 'el-input-number', label: 'settings.retry_max_retries', attrs: { min: 0, max: 10 } },
      { key: 'retry_initial_delay', tag: 'el-input-number', label: 'settings.retry_initial_delay', attrs: { min: 0, max: 60, step: 0.1 } },
      { key: 'retry_max_delay', tag: 'el-input-number', label: 'settings.retry_max_delay', attrs: { min: 0, max: 300, step: 0.1 } },
      { key: 'retry_exponential_base', tag: 'el-input-number', label: 'settings.retry_exponential_base', attrs: { min: 1, max: 10, step: 0.1 } }
    ]
  },
  {
    titleKey: 'settings.notifications_title',
    items: [
      { key: 'notifications_method', tag: 'SettingsSelect', label: 'settings.notifications_method', optionKey: 'notifications_method' },
      { key: 'notifications_threshold_secs', tag: 'el-input-number', label: 'settings.notifications_threshold_secs', attrs: { min: 0, max: 3600 } },
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', label: 'settings.notifications_completion_sound', optionKey: 'notifications_completion_sound' }
    ]
  },
  {
    titleKey: 'settings.features_title',
    items: [
      { key: 'features_shell_tool', tag: 'el-switch', label: 'settings.features_shell_tool' },
      { key: 'features_subagents', tag: 'el-switch', label: 'settings.features_subagents' },
      { key: 'features_web_search', tag: 'el-switch', label: 'settings.features_web_search' },
      { key: 'features_apply_patch', tag: 'el-switch', label: 'settings.features_apply_patch' },
      { key: 'features_mcp', tag: 'el-switch', label: 'settings.features_mcp' },
      { key: 'features_exec_policy', tag: 'el-switch', label: 'settings.features_exec_policy' },
      { key: 'features_vision_model', tag: 'el-switch', label: 'settings.features_vision_model' }
    ]
  },
  {
    titleKey: 'settings.search_title',
    items: [
      { key: 'search_provider', tag: 'SettingsSelect', label: 'settings.search_provider', optionKey: 'search_provider' },
      { key: 'search_base_url', tag: 'el-input', label: 'settings.search_base_url' }
    ]
  }
];

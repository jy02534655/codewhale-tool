// TUI 界面设置分组：主题、默认模式、侧边栏焦点、菜单行为、货币、详细程度、显示选项
export const tuiInterfaceGroups = [
  {
    titleKey: 'settings.tuiInterface',
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
  }
];

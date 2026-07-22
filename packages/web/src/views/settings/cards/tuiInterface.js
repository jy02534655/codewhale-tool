// TUI 界面设置分组：主题、默认模式、侧边栏焦点、菜单行为、货币、详细程度、显示选项
export const tuiInterfaceGroups = [
  {
    titleKey: 'settings.tuiInterface',
    items: [
      { key: 'theme', tag: 'SettingsSelect', optionKey: 'theme' },
      { key: 'default_mode', tag: 'SettingsSelect', optionKey: 'default_mode' },
      { key: 'sidebar_focus', tag: 'SettingsSelect', optionKey: 'sidebar_focus' },
      { key: 'mention_menu_behavior', tag: 'SettingsSelect', optionKey: 'mention_menu_behavior' },
      { key: 'cost_currency', tag: 'SettingsSelect', optionKey: 'cost_currency' },
      { key: 'verbosity', tag: 'SettingsSelect', optionKey: 'verbosity' },
      { key: 'show_thinking', tag: 'el-switch' },
      { key: 'show_tool_details', tag: 'el-switch' },
      { key: 'auto_compact', tag: 'el-switch' },
      { key: 'paste_burst_detection', tag: 'el-switch' },
      { key: 'auto_compact_threshold_percent', tag: 'el-input-number', attrs: { min: 10, max: 100 } },
      { key: 'mention_menu_limit', tag: 'el-input-number', attrs: { min: 1 } },
      { key: 'mention_walk_depth', tag: 'el-input-number', attrs: { min: 0 } },
      { key: 'max_history', tag: 'el-input-number', attrs: { min: 1 } },
      { key: 'background_color', tag: 'el-input' },
      { key: 'default_model', tag: 'el-input', disabled: true }
    ]
  }
];

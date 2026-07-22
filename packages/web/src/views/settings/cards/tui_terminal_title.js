// TUI 终端设置分组：备用屏幕、鼠标捕获、终端探测超时、流式分块超时、OSC 8 链接
export const tuiTerminalTitleGroups = [
  {
    titleKey: 'settings.tui_terminal_title',
    items: [
      { key: 'tui_alternate_screen', tag: 'SettingsSelect', labelKey: 'settings.tui_alternate_screen.label', helpKey: 'settings.tui_alternate_screen.help', optionKey: 'tui_alternate_screen' },
      { key: 'tui_mouse_capture', tag: 'el-switch', labelKey: 'settings.tui_mouse_capture.label', helpKey: 'settings.tui_mouse_capture.help' },
      { key: 'tui_terminal_probe_timeout_ms', tag: 'el-input-number', labelKey: 'settings.tui_terminal_probe_timeout_ms.label', helpKey: 'settings.tui_terminal_probe_timeout_ms.help', attrs: { min: 100, max: 5000 } },
      { key: 'tui_stream_chunk_timeout_secs', tag: 'el-input-number', labelKey: 'settings.tui_stream_chunk_timeout_secs.label', helpKey: 'settings.tui_stream_chunk_timeout_secs.help', attrs: { min: 1, max: 3600 } },
      { key: 'tui_osc8_links', tag: 'el-switch', labelKey: 'settings.tui_osc8_links.label', helpKey: 'settings.tui_osc8_links.help' }
    ]
  }
];

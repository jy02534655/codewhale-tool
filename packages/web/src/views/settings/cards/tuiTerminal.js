// TUI 终端设置分组：备用屏幕、鼠标捕获、终端探测超时、流式分块超时、OSC 8 链接
export const tuiTerminalGroups = [
  {
    titleKey: 'settings.tuiTerminal',
    items: [
      { key: 'tui_alternate_screen', tag: 'SettingsSelect', optionKey: 'tui_alternate_screen' },
      { key: 'tui_mouse_capture', tag: 'el-switch' },
      { key: 'tui_terminal_probe_timeout_ms', tag: 'el-input-number', attrs: { min: 100, max: 5000 } },
      { key: 'tui_stream_chunk_timeout_secs', tag: 'el-input-number', attrs: { min: 1, max: 3600 } },
      { key: 'tui_osc8_links', tag: 'el-switch' }
    ]
  }
];

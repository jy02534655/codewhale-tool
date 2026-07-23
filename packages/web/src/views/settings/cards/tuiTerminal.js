// TUI 终端设置分组：备用屏幕、鼠标捕获、终端探测超时、流式分块超时、OSC 8 链接
// 配置项顺序：SettingsSelect -> el-switch -> el-input-number -> el-input
export const tuiTerminalGroups = [
  {
    titleKey: 'settings.tuiTerminal',
    items: [
      // 备用屏幕：是否使用终端备用屏幕缓冲
      { key: 'tui_alternate_screen', tag: 'SettingsSelect', optionKey: 'tui_alternate_screen' },
      // 鼠标捕获：是否捕获终端鼠标事件
      { key: 'tui_mouse_capture', tag: 'el-switch' },
      // OSC 8 链接：是否启用 OSC 8 超链接支持
      { key: 'tui_osc8_links', tag: 'el-switch' },
      // 终端探测超时：终端能力探测的超时时间（毫秒）
      { key: 'tui_terminal_probe_timeout_ms', tag: 'el-input-number', attrs: { min: 100, max: 5000 } },
      // 流式分块超时：流式输出分块接收的超时时间（秒）
      { key: 'tui_stream_chunk_timeout_secs', tag: 'el-input-number', attrs: { min: 1, max: 3600 } }
    ]
  }
];
// TUI 界面设置分组：主题、默认模式、侧边栏焦点、菜单行为、货币、详细程度、显示选项、工作栏、会话栏、启动菜单、聚焦纹理、内联 diff
// 配置项顺序：el-switch -> el-input-number -> SettingsSelect -> el-input
export const tuiInterfaceGroups = [
  {
    titleKey: 'settings.tuiInterface',
    items: [
      // 显示思考过程：是否在界面中展示模型思考过程
      { key: 'show_thinking', tag: 'el-switch' },
      // 思考块默认展开：show_thinking 开启时是否默认展开 thinking 块
      { key: 'thinking_default_expanded', tag: 'SettingsSelect', optionKey: 'thinking_default_expanded' },
      // 显示工具详情：是否展示工具调用的详细参数
      { key: 'show_tool_details', tag: 'el-switch' },
      // 自动压缩：上下文超限时自动压缩历史
      { key: 'auto_compact', tag: 'el-switch' },
      // 粘贴突发检测：检测大量粘贴内容并自动处理
      { key: 'paste_burst_detection', tag: 'el-switch' },
      // 自动压缩阈值：上下文占用超过该百分比时触发压缩
      { key: 'auto_compact_threshold_percent', tag: 'el-input-number', attrs: { min: 10, max: 100 } },
      // 提及菜单限制：@ 提及菜单的最大显示数量
      { key: 'mention_menu_limit', tag: 'el-input-number', attrs: { min: 1 } },
      // 提及遍历深度：@ 提及内容解析的最大深度
      { key: 'mention_walk_depth', tag: 'el-input-number', attrs: { min: 0 } },
      // 最大历史记录数：终端保留的最大历史轮数
      { key: 'max_history', tag: 'el-input-number', attrs: { min: 1 } },
      // 主题：终端界面主题风格
      { key: 'theme', tag: 'SettingsSelect', optionKey: 'theme' },
      // 默认模式：终端的默认交互模式
      { key: 'default_mode', tag: 'SettingsSelect', optionKey: 'default_mode' },
      // 侧边栏焦点：侧边栏的默认焦点位置
      { key: 'sidebar_focus', tag: 'SettingsSelect', optionKey: 'sidebar_focus' },
      // 提及菜单行为：@ 提及菜单的展开行为
      { key: 'mention_menu_behavior', tag: 'SettingsSelect', optionKey: 'mention_menu_behavior' },
      // 成本货币：显示成本时的货币单位
      { key: 'cost_currency', tag: 'SettingsSelect', optionKey: 'cost_currency' },
      // 详细程度：终端输出的详细程度
      { key: 'verbosity', tag: 'SettingsSelect', optionKey: 'verbosity' },
      // 背景颜色：终端背景的自定义颜色
      { key: 'background_color', tag: 'el-input' },
      // 默认模型：终端默认使用的模型 ID
      { key: 'default_model', tag: 'el-input' },
      // 内联 diff 展示：显示完整的红/绿 diff 和语义统计
      { key: 'inline_diffs', tag: 'SettingsSelect', optionKey: 'inline_diffs' },
      // 聚焦纹理：模态视图外背景纹理
      { key: 'focus_texture', tag: 'SettingsSelect', optionKey: 'focus_texture' },
      // 工作栏位置：工作栏位于对话记录上方/左侧/右侧/隐藏
      { key: 'work_surface_placement', tag: 'SettingsSelect', optionKey: 'work_surface_placement' },
      // 工作栏默认面板：工作栏默认显示的面板
      { key: 'rail_panel', tag: 'SettingsSelect', optionKey: 'rail_panel' },
      // 会话栏显示：是否显示会话栏
      { key: 'sessions_rail', tag: 'el-switch' },
      // 自动恢复会话：是否自动恢复上次会话
      { key: 'session_auto_resume', tag: 'el-switch' },
      // 启动菜单：是否显示启动菜单
      { key: 'launch_screen', tag: 'el-switch' },
      // 顶部工作栏高度上限：顶部工作栏最大高度
      { key: 'work_surface_top_height', tag: 'el-input-number', attrs: { min: 2, max: 16 } },
      // 侧边工作栏宽度上限：侧边工作栏最大宽度
      { key: 'work_surface_side_width', tag: 'el-input-number', attrs: { min: 26, max: 80 } }
    ]
  }
];
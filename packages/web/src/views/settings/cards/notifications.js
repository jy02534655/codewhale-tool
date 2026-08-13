// 通知设置分组：通知方式、触发阈值、完成声音、包含摘要、静音、事件开关、事件声音
// 配置项顺序：el-switch -> el-input-number -> SettingsSelect -> el.input
export const notificationsGroups = [
  {
    titleKey: 'settings.notifications',
    items: [
      // 包含摘要：通知内容是否包含任务摘要
      { key: 'notifications_include_summary', tag: 'el-switch' },
      // 静音所有通知：抑制所有桌面通知和事件声音
      { key: 'notifications_quiet', tag: 'el-switch' },
      // 回合完成：代理回合完成通知
      { key: 'notifications_event_turn_complete', tag: 'el-switch' },
      // 子代理终止：子代理到达终止状态通知
      { key: 'notifications_event_subagent_terminal', tag: 'el-switch' },
      // 需要审批：工具调用等待审批通知
      { key: 'notifications_event_approval_needed', tag: 'el-switch' },
      // 需要输入：代理提问等待输入通知
      { key: 'notifications_event_input_needed', tag: 'el-switch' },
      // 需要提升：沙箱拒绝需要决策通知
      { key: 'notifications_event_elevation_needed', tag: 'el-switch' },
      // 模型通知：模型调用 notify 工具通知
      { key: 'notifications_event_model_notify', tag: 'el-switch' },
      // 启用事件声音：为通知事件播放提示音
      { key: 'notifications_event_sound_enabled', tag: 'el-switch' },
      // 事件声音静音：抑制事件声音提示
      { key: 'notifications_event_sound_quiet', tag: 'el-switch' },
      // 通知触发阈值：超过该秒数无响应后触发通知
      { key: 'notifications_threshold_secs', tag: 'el-input-number', attrs: { min: 0, max: 3600 } },
      // 事件声音最小间隔：事件声音最小间隔（毫秒）
      { key: 'notifications_event_sound_min_interval_ms', tag: 'el-input-number', attrs: { min: 0, max: 60000 } },
      // 通知方式：选择通知触发方式
      { key: 'notifications_method', tag: 'SettingsSelect', optionKey: 'notifications_method' },
      // 完成声音：任务完成后播放的声音类型
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', optionKey: 'notifications_completion_sound' },
      // 声音文件路径：自定义通知声音文件路径
      { key: 'sound_file', tag: 'el-input' }
    ]
  }
];
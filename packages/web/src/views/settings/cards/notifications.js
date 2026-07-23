// 通知设置分组：通知方式、触发阈值、完成声音、包含摘要、声音文件
// 配置项顺序：el-switch -> el-input-number -> SettingsSelect -> el-input
export const notificationsGroups = [
  {
    titleKey: 'settings.notifications',
    items: [
      // 包含摘要：通知内容是否包含任务摘要
      { key: 'notifications_include_summary', tag: 'el-switch' },
      // 通知触发阈值：超过该秒数无响应后触发通知
      { key: 'notifications_threshold_secs', tag: 'el-input-number', attrs: { min: 0, max: 3600 } },
      // 通知方式：选择通知触发方式
      { key: 'notifications_method', tag: 'SettingsSelect', optionKey: 'notifications_method' },
      // 完成声音：任务完成后播放的声音类型
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', optionKey: 'notifications_completion_sound' },
      // 声音文件路径：自定义通知声音文件路径
      { key: 'sound_file', tag: 'el-input' }
    ]
  }
];
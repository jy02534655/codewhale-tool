// 通知设置分组：通知方式、触发阈值、完成声音、包含摘要、声音文件
export const notificationsGroups = [
  {
    titleKey: 'settings.notifications',
    items: [
      { key: 'notifications_method', tag: 'SettingsSelect', optionKey: 'notifications_method' },
      { key: 'notifications_threshold_secs', tag: 'el-input-number', attrs: { min: 0, max: 3600 } },
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', optionKey: 'notifications_completion_sound' },
      { key: 'notifications_include_summary', tag: 'el-switch' },
      { key: 'sound_file', tag: 'el-input' }
    ]
  }
];

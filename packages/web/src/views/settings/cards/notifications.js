// 通知设置分组：通知方式、触发阈值、完成声音、包含摘要、声音文件
export const notificationsGroups = [
  {
    titleKey: 'settings.notifications',
    items: [
      { key: 'notifications_method', tag: 'SettingsSelect', labelKey: 'settings.notifications_method.label', helpKey: 'settings.notifications_method.help', optionKey: 'notifications_method' },
      { key: 'notifications_threshold_secs', tag: 'el-input-number', labelKey: 'settings.notifications_threshold_secs.label', helpKey: 'settings.notifications_threshold_secs.help', attrs: { min: 0, max: 3600 } },
      { key: 'notifications_completion_sound', tag: 'SettingsSelect', labelKey: 'settings.notifications_completion_sound.label', helpKey: 'settings.notifications_completion_sound.help', optionKey: 'notifications_completion_sound' },
      { key: 'notifications.include_summary', tag: 'el-switch', labelKey: 'settings.notifications.include_summary.label', helpKey: 'settings.notifications.include_summary.help', disabled: true },
      { key: 'notifications.sound_file', tag: 'el-input', labelKey: 'settings.notifications.sound_file.label', helpKey: 'settings.notifications.sound_file.help', disabled: true }
    ]
  }
];

// 基础设置分组：语言、默认模型、更新检查、自定义更新镜像
export const basicGroups = [
  {
    titleKey: 'settings.basic',
    items: [
      { key: 'locale', tag: 'SettingsSelect', labelKey: 'settings.language.label', helpKey: 'settings.language.help', optionKey: 'locale' },
      { key: 'default_text_model', tag: 'el-input', labelKey: 'settings.default_model.label', helpKey: 'settings.default_model.help' },
      { key: 'update_check_for_updates', tag: 'el-switch', labelKey: 'settings.update_check_for_updates.label', helpKey: 'settings.update_check_for_updates.help' },
      { key: 'update_uri', tag: 'el-input', labelKey: 'settings.basic.update_uri.label', helpKey: 'settings.basic.update_uri.help', disabled: true }
    ]
  }
];

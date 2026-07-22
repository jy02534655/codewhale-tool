// 基础设置分组：语言、默认模型、更新检查
export const basicTitleGroups = [
  {
    titleKey: 'settings.basic_title',
    items: [
      { key: 'locale', tag: 'SettingsSelect', labelKey: 'settings.language.label', helpKey: 'settings.language.help', optionKey: 'locale' },
      { key: 'default_text_model', tag: 'el-input', labelKey: 'settings.default_model.label', helpKey: 'settings.default_model.help' },
      { key: 'update_check_for_updates', tag: 'el-switch', labelKey: 'settings.update_check_for_updates.label', helpKey: 'settings.update_check_for_updates.help' }
    ]
  }
];

// 基础设置分组：语言、默认模型、更新检查、自定义更新镜像
export const basicGroups = [
  {
    titleKey: 'settings.basic',
    items: [
      { key: 'locale', tag: 'SettingsSelect', optionKey: 'locale' },
      { key: 'default_text_model', tag: 'el-input' },
      { key: 'update_check_for_updates', tag: 'el-switch' },
      { key: 'update_uri', tag: 'el-input', disabled: true }
    ]
  }
];

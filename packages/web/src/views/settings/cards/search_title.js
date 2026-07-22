// 搜索设置分组：搜索引擎、基础 URL
export const searchTitleGroups = [
  {
    titleKey: 'settings.search_title',
    items: [
      { key: 'search_provider', tag: 'SettingsSelect', labelKey: 'settings.search_provider.label', helpKey: 'settings.search_provider.help', optionKey: 'search_provider' },
      { key: 'search_base_url', tag: 'el-input', labelKey: 'settings.search_base_url.label', helpKey: 'settings.search_base_url.help' }
    ]
  }
];

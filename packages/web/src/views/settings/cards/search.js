// 搜索设置分组：搜索引擎、基础 URL
// 配置项顺序：SettingsSelect -> el-input
export const searchGroups = [
  {
    titleKey: 'settings.search',
    items: [
      // 搜索引擎：网络搜索使用的搜索引擎
      { key: 'search_provider', tag: 'SettingsSelect', optionKey: 'search_provider' },
      // 搜索基础 URL：搜索引擎的 API 基础地址
      { key: 'search_base_url', tag: 'el-input' }
    ]
  }
];
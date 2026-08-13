// 基础设置分组：语言、默认模型、更新检查、更新检查间隔、自定义更新镜像
// 配置项顺序：el-switch -> SettingsSelect -> el-input -> el-input-number
export const basicGroups = [
  {
    titleKey: 'settings.basic',
    items: [
      // 检查更新：启动时自动检查新版本
      { key: 'update_check_for_updates', tag: 'el-switch' },
      // 更新检查间隔：网络更新检查的缓存间隔（小时）
      { key: 'update_check_interval_hours', tag: 'el-input-number', attrs: { min: 0, max: 168 } },
      // 语言选择：界面显示语言
      { key: 'locale', tag: 'SettingsSelect', optionKey: 'locale' },
      // 引擎默认文本模型：CodeWhale 引擎默认使用的文本模型 ID
      { key: 'default_text_model', tag: 'el-input' },
      // 自定义更新镜像：手动指定更新镜像地址
      { key: 'update_uri', tag: 'el-input' }
    ]
  }
];
// 重试设置分组：重试开关、最大重试次数、初始延迟、最大延迟、指数基数
// 配置项顺序：el-switch -> el-input-number
export const retryGroups = [
  {
    titleKey: 'settings.retry',
    items: [
      // 启用重试：开启失败后自动重试
      { key: 'retry_enabled', tag: 'el-switch' },
      // 最大重试次数：单次请求失败后的最大重试次数
      { key: 'retry_max_retries', tag: 'el-input-number', attrs: { min: 0, max: 10 } },
      // 初始延迟：首次重试前的等待时间（秒）
      { key: 'retry_initial_delay', tag: 'el-input-number', attrs: { min: 0, max: 60, step: 0.1 } },
      // 最大延迟：重试等待时间的上限（秒）
      { key: 'retry_max_delay', tag: 'el-input-number', attrs: { min: 0, max: 300, step: 0.1 } },
      // 指数退避基数：重试延迟的指数增长基数
      { key: 'retry_exponential_base', tag: 'el-input-number', attrs: { min: 1, max: 10, step: 0.1 } }
    ]
  }
];
// 重试设置分组：重试开关、最大重试次数、初始延迟、最大延迟、指数基数
export const retryGroups = [
  {
    titleKey: 'settings.retry',
    items: [
      { key: 'retry_enabled', tag: 'el-switch' },
      { key: 'retry_max_retries', tag: 'el-input-number', attrs: { min: 0, max: 10 } },
      { key: 'retry_initial_delay', tag: 'el-input-number', attrs: { min: 0, max: 60, step: 0.1 } },
      { key: 'retry_max_delay', tag: 'el-input-number', attrs: { min: 0, max: 300, step: 0.1 } },
      { key: 'retry_exponential_base', tag: 'el-input-number', attrs: { min: 1, max: 10, step: 0.1 } }
    ]
  }
];

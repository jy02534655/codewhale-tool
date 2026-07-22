// 子代理分组：最大并发数、令牌预算、API 超时、心跳超时、默认模型，以及深度、并发上限、各类角色模型
export const subagentsGroups = [
  {
    titleKey: 'settings.subagents',
    items: [
      { key: 'subagents_max_concurrent', tag: 'el-input-number', labelKey: 'settings.subagents_max_concurrent.label', helpKey: 'settings.subagents_max_concurrent.help', attrs: { min: 1, max: 20 } },
      { key: 'subagents_token_budget', tag: 'el-input-number', labelKey: 'settings.subagents_token_budget.label', helpKey: 'settings.subagents_token_budget.help', attrs: { min: 0 } },
      { key: 'subagents_api_timeout_secs', tag: 'el-input-number', labelKey: 'settings.subagents_api_timeout_secs.label', helpKey: 'settings.subagents_api_timeout_secs.help', attrs: { min: 1, max: 1800 } },
      { key: 'subagents_heartbeat_timeout_secs', tag: 'el-input-number', labelKey: 'settings.subagents_heartbeat_timeout_secs.label', helpKey: 'settings.subagents_heartbeat_timeout_secs.help', attrs: { min: 30, max: 3600 } },
      { key: 'subagents_default_model', tag: 'el-input', labelKey: 'settings.subagents_default_model.label', helpKey: 'settings.subagents_default_model.help' },
      { key: 'subagents.max_depth', tag: 'el-input-number', labelKey: 'settings.subagents.max_depth.label', helpKey: 'settings.subagents.max_depth.help', disabled: true },
      { key: 'subagents.launch_concurrency', tag: 'el-input-number', labelKey: 'settings.subagents.launch_concurrency.label', helpKey: 'settings.subagents.launch_concurrency.help', disabled: true },
      { key: 'subagents.max_admitted', tag: 'el-input-number', labelKey: 'settings.subagents.max_admitted.label', helpKey: 'settings.subagents.max_admitted.help', disabled: true },
      { key: 'subagents.worker_model', tag: 'el-input', labelKey: 'settings.subagents.worker_model.label', helpKey: 'settings.subagents.worker_model.help', disabled: true },
      { key: 'subagents.explorer_model', tag: 'el-input', labelKey: 'settings.subagents.explorer_model.label', helpKey: 'settings.subagents.explorer_model.help', disabled: true },
      { key: 'subagents.awaiter_model', tag: 'el-input', labelKey: 'settings.subagents.awaiter_model.label', helpKey: 'settings.subagents.awaiter_model.help', disabled: true },
      { key: 'subagents.review_model', tag: 'el-input', labelKey: 'settings.subagents.review_model.label', helpKey: 'settings.subagents.review_model.help', disabled: true },
      { key: 'subagents.custom_model', tag: 'el-input', labelKey: 'settings.subagents.custom_model.label', helpKey: 'settings.subagents.custom_model.help', disabled: true }
    ]
  }
];

// 子代理分组：最大并发数、令牌预算、API 超时、心跳超时、默认模型，以及深度、并发上限、各类角色模型
export const subagentsGroups = [
  {
    titleKey: 'settings.subagents',
    items: [
      { key: 'subagents_max_concurrent', tag: 'el-input-number', attrs: { min: 1, max: 20 } },
      { key: 'subagents_token_budget', tag: 'el-input-number', attrs: { min: 0 } },
      { key: 'subagents_api_timeout_secs', tag: 'el-input-number', attrs: { min: 1, max: 1800 } },
      { key: 'subagents_heartbeat_timeout_secs', tag: 'el-input-number', attrs: { min: 30, max: 3600 } },
      { key: 'subagents_default_model', tag: 'el-input' },
      { key: 'subagents.max_depth', tag: 'el-input-number', disabled: true },
      { key: 'subagents.launch_concurrency', tag: 'el-input-number', disabled: true },
      { key: 'subagents.max_admitted', tag: 'el-input-number', disabled: true },
      { key: 'subagents.worker_model', tag: 'el-input', disabled: true },
      { key: 'subagents.explorer_model', tag: 'el-input', disabled: true },
      { key: 'subagents.awaiter_model', tag: 'el-input', disabled: true },
      { key: 'subagents.review_model', tag: 'el-input', disabled: true },
      { key: 'subagents.custom_model', tag: 'el-input', disabled: true }
    ]
  }
];

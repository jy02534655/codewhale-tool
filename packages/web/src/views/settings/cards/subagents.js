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
      { key: 'subagents_max_depth', tag: 'el-input-number' },
      { key: 'subagents_launch_concurrency', tag: 'el-input-number' },
      { key: 'subagents_max_admitted', tag: 'el-input-number' },
      { key: 'subagents_worker_model', tag: 'el-input' },
      { key: 'subagents_explorer_model', tag: 'el-input' },
      { key: 'subagents_awaiter_model', tag: 'el-input' },
      { key: 'subagents_review_model', tag: 'el-input' },
      { key: 'subagents_custom_model', tag: 'el-input' }
    ]
  }
];

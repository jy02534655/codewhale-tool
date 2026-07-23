// 子代理分组：最大并发数、令牌预算、API 超时、心跳超时、默认模型，以及深度、并发上限、各类角色模型
// 配置项顺序：el-input-number -> el-input
export const subagentsGroups = [
  {
    titleKey: 'settings.subagents',
    items: [
      // 最大并发数：同时运行的子代理最大数量
      { key: 'subagents_max_concurrent', tag: 'el-input-number', attrs: { min: 1, max: 20 } },
      // Token 预算：子代理任务的总 Token 预算上限
      { key: 'subagents_token_budget', tag: 'el-input-number', attrs: { min: 0 } },
      // API 超时：子代理 API 请求的超时时间（秒）
      { key: 'subagents_api_timeout_secs', tag: 'el-input-number', attrs: { min: 1, max: 1800 } },
      // 心跳超时：子代理心跳检测超时时间（秒）
      { key: 'subagents_heartbeat_timeout_secs', tag: 'el-input-number', attrs: { min: 30, max: 3600 } },
      // 最大深度：子代理任务的最大递归深度
      { key: 'subagents_max_depth', tag: 'el-input-number' },
      // 启动并发数：子代理启动时的并发数
      { key: 'subagents_launch_concurrency', tag: 'el-input-number' },
      // 最大接纳数：单轮最多接纳的子代理数量
      { key: 'subagents_max_admitted', tag: 'el-input-number' },
      // 默认模型：子代理默认使用的模型 ID
      { key: 'subagents_default_model', tag: 'el-input' },
      // Worker 模型：Worker 角色子代理使用的模型 ID
      { key: 'subagents_worker_model', tag: 'el-input' },
      // Explorer 模型：Explorer 角色子代理使用的模型 ID
      { key: 'subagents_explorer_model', tag: 'el-input' },
      // Awaiter 模型：Awaiter 角色子代理使用的模型 ID
      { key: 'subagents_awaiter_model', tag: 'el-input' },
      // Reviewer 模型：Reviewer 角色子代理使用的模型 ID
      { key: 'subagents_review_model', tag: 'el-input' },
      // 自定义模型：自定义角色子代理使用的模型 ID
      { key: 'subagents_custom_model', tag: 'el-input' }
    ]
  }
];
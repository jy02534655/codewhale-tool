/**
 * 通用设置页面：只读分组数据
 * 统一维护不可配置项分组，供 ReadOnlyGroupCard 使用。
 */

export const readonlyGroups = [
  {
    titleKey: 'settings.readonly.reasoning',
    items: [
      { key: 'reasoning_effort', label: '推理强度', type: 'select', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.context',
    items: [
      { key: 'context.enabled', label: '启用 Fin 快速路径管理', type: 'switch', value: '' },
      { key: 'context.verbatim_window_turns', label: '完整保留轮数', type: 'number', value: '' },
      { key: 'context.l1_threshold', label: 'L1 上下文压力阈值', type: 'number', value: '' },
      { key: 'context.l2_threshold', label: 'L2 上下文压力阈值', type: 'number', value: '' },
      { key: 'context.l3_threshold', label: 'L3 上下文压力阈值', type: 'number', value: '' },
      { key: 'context.seam_model', label: '接缝模型', type: 'text', value: '' },
      { key: 'CODEWHALE_CACHE_MAXIMAL', label: '缓存最大化模式', type: 'switch', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.update',
    items: [
      { key: 'update.update_uri', label: '自定义更新镜像', type: 'text', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.security',
    items: [
      { key: 'permissions.toml', label: '权限规则文件', type: 'text', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.paths',
    items: [
      { key: 'skills_dir', label: '技能目录', type: 'text', value: '' },
      { key: 'skills.scan_codewhale_only', label: '仅扫描 CodeWhale 技能', type: 'switch', value: '' },
      { key: 'mcp_config_path', label: 'MCP 配置文件路径', type: 'text', value: '' },
      { key: 'notes_path', label: '笔记文件路径', type: 'text', value: '' },
      { key: 'memory_path', label: '记忆文件路径', type: 'text', value: '' },
      { key: 'memory.enabled', label: '启用记忆', type: 'switch', value: '' },
      { key: 'snapshots.enabled', label: '启用快照', type: 'switch', value: '' },
      { key: 'snapshots.max_age_days', label: '快照保留天数', type: 'number', value: '' },
      { key: 'verifier.enabled', label: '启用验证器', type: 'switch', value: '' },
      { key: 'verifier.verdict_policy', label: '验证器裁决策略', type: 'select', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.capacity',
    items: [
      { key: 'capacity.enabled', label: '启用容量控制器', type: 'switch', value: '' },
      { key: 'capacity.low_risk_max', label: '低风险上限比例', type: 'number', value: '' },
      { key: 'capacity.medium_risk_max', label: '中风险上限比例', type: 'number', value: '' },
      { key: 'capacity.severe_min_slack', label: '严重风险最小余量', type: 'number', value: '' },
      { key: 'capacity.severe_violation_ratio', label: '严重违规比例', type: 'number', value: '' },
      { key: 'capacity.refresh_cooldown_turns', label: '刷新冷却轮数', type: 'number', value: '' },
      { key: 'capacity.replan_cooldown_turns', label: '重规划冷却轮数', type: 'number', value: '' },
      { key: 'capacity.max_replay_per_turn', label: '每轮最大重放', type: 'number', value: '' },
      { key: 'capacity.min_turns_before_guardrail', label: '护栏前最小轮数', type: 'number', value: '' },
      { key: 'capacity.profile_window', label: '分析窗口', type: 'number', value: '' },
      { key: 'capacity.deepseek_v3_2_chat_prior', label: 'V3.2 Chat 优先级', type: 'number', value: '' },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', label: 'V3.2 Reasoner 优先级', type: 'number', value: '' },
      { key: 'capacity.deepseek_v4_pro_prior', label: 'V4 Pro 优先级', type: 'number', value: '' },
      { key: 'capacity.deepseek_v4_flash_prior', label: 'V4 Flash 优先级', type: 'number', value: '' },
      { key: 'capacity.fallback_default_prior', label: '回退默认优先级', type: 'number', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.subagents',
    items: [
      { key: 'subagents.max_depth', label: '最大嵌套深度', type: 'number', value: '' },
      { key: 'subagents.launch_concurrency', label: '同时启动数', type: 'number', value: '' },
      { key: 'subagents.max_admitted', label: '排队+运行总数上限', type: 'number', value: '' },
      { key: 'subagents.worker_model', label: 'Worker 模型', type: 'text', value: '' },
      { key: 'subagents.explorer_model', label: 'Explorer 模型', type: 'text', value: '' },
      { key: 'subagents.awaiter_model', label: 'Awaiter 模型', type: 'text', value: '' },
      { key: 'subagents.review_model', label: 'Review 模型', type: 'text', value: '' },
      { key: 'subagents.custom_model', label: '自定义角色模型', type: 'text', value: '' },
    ],
  },
  {
    titleKey: 'settings.readonly.notifications',
    items: [
      { key: 'notifications.include_summary', label: '通知包含摘要', type: 'switch', value: '' },
      { key: 'notifications.sound_file', label: '自定义声音文件', type: 'text', value: '' },
    ],
  },
];

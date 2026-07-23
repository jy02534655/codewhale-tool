// 容量控制分组：启用开关、风险阈值、冷却时间、重放次数、模型优先级
// 配置项顺序：el-switch -> el-input-number
export const capacityGroups = [
  {
    titleKey: 'settings.capacity',
    items: [
      // 启用容量控制：开启后启用容量保护与优先级调度
      { key: 'capacity_enabled', tag: 'el-switch' },
      // 低风险最大并发数：低风险场景下的最大并发任务数
      { key: 'capacity_low_risk_max', tag: 'el-input-number' },
      // 中风险最大并发数：中风险场景下的最大并发任务数
      { key: 'capacity_medium_risk_max', tag: 'el-input-number' },
      // 严重风险最小余量：严重风险下必须保留的最小余量
      { key: 'capacity_severe_min_slack', tag: 'el-input-number' },
      // 严重风险违规比例：严重风险违规比例阈值
      { key: 'capacity_severe_violation_ratio', tag: 'el-input-number' },
      // 刷新冷却轮数：刷新前的冷却轮数
      { key: 'capacity_refresh_cooldown_turns', tag: 'el-input-number' },
      // 重规划冷却轮数：重规划前的冷却轮数
      { key: 'capacity_replan_cooldown_turns', tag: 'el-input-number' },
      // 每轮最大重放次数：每轮最多允许的重放次数
      { key: 'capacity_max_replay_per_turn', tag: 'el-input-number' },
      // 护栏前最小轮数：启用护栏前的最小轮数
      { key: 'capacity_min_turns_before_guardrail', tag: 'el-input-number' },
      // 配置分析窗口：容量配置分析的时间窗口
      { key: 'capacity_profile_window', tag: 'el-input-number' },
      // DeepSeek V3.2 Chat 优先级：该模型的调度优先级权重
      { key: 'capacity_deepseek_v3_2_chat_prior', tag: 'el-input-number' },
      // DeepSeek V3.2 Reasoner 优先级：该模型的调度优先级权重
      { key: 'capacity_deepseek_v3_2_reasoner_prior', tag: 'el-input-number' },
      // DeepSeek V4 Pro 优先级：该模型的调度优先级权重
      { key: 'capacity_deepseek_v4_pro_prior', tag: 'el-input-number' },
      // DeepSeek V4 Flash 优先级：该模型的调度优先级权重
      { key: 'capacity_deepseek_v4_flash_prior', tag: 'el-input-number' },
      // 回退默认优先级：回退模型的默认优先级权重
      { key: 'capacity_fallback_default_prior', tag: 'el-input-number' }
    ]
  }
];
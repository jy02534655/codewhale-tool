// 容量控制分组：启用开关、风险阈值、冷却时间、重放次数、模型优先级
export const capacityGroups = [
  {
    titleKey: 'settings.capacity',
    items: [
      { key: 'capacity_enabled', tag: 'el-switch' },
      { key: 'capacity_low_risk_max', tag: 'el-input-number' },
      { key: 'capacity_medium_risk_max', tag: 'el-input-number' },
      { key: 'capacity_severe_min_slack', tag: 'el-input-number' },
      { key: 'capacity_severe_violation_ratio', tag: 'el-input-number' },
      { key: 'capacity_refresh_cooldown_turns', tag: 'el-input-number' },
      { key: 'capacity_replan_cooldown_turns', tag: 'el-input-number' },
      { key: 'capacity_max_replay_per_turn', tag: 'el-input-number' },
      { key: 'capacity_min_turns_before_guardrail', tag: 'el-input-number' },
      { key: 'capacity_profile_window', tag: 'el-input-number' },
      { key: 'capacity_deepseek_v3_2_chat_prior', tag: 'el-input-number' },
      { key: 'capacity_deepseek_v3_2_reasoner_prior', tag: 'el-input-number' },
      { key: 'capacity_deepseek_v4_pro_prior', tag: 'el-input-number' },
      { key: 'capacity_deepseek_v4_flash_prior', tag: 'el-input-number' },
      { key: 'capacity_fallback_default_prior', tag: 'el-input-number' }
    ]
  }
];

// 容量控制分组：启用开关、风险阈值、冷却时间、重放次数、模型优先级
export const capacityGroups = [
  {
    titleKey: 'settings.capacity',
    items: [
      { key: 'enabled', tag: 'el-switch', disabled: true },
      { key: 'low_risk_max', tag: 'el-input-number', disabled: true },
      { key: 'medium_risk_max', tag: 'el-input-number', disabled: true },
      { key: 'severe_min_slack', tag: 'el-input-number', disabled: true },
      { key: 'severe_violation_ratio', tag: 'el-input-number', disabled: true },
      { key: 'refresh_cooldown_turns', tag: 'el-input-number', disabled: true },
      { key: 'replan_cooldown_turns', tag: 'el-input-number', disabled: true },
      { key: 'max_replay_per_turn', tag: 'el-input-number', disabled: true },
      { key: 'min_turns_before_guardrail', tag: 'el-input-number', disabled: true },
      { key: 'profile_window', tag: 'el-input-number', disabled: true },
      { key: 'deepseek_v3_2_chat_prior', tag: 'el-input-number', disabled: true },
      { key: 'deepseek_v3_2_reasoner_prior', tag: 'el-input-number', disabled: true },
      { key: 'deepseek_v4_pro_prior', tag: 'el-input-number', disabled: true },
      { key: 'deepseek_v4_flash_prior', tag: 'el-input-number', disabled: true },
      { key: 'fallback_default_prior', tag: 'el-input-number', disabled: true }
    ]
  }
];

// 容量控制分组：启用开关、风险阈值、冷却时间、重放次数、模型优先级
export const capacityGroups = [
  {
    titleKey: 'settings.capacity',
    items: [
      { key: 'capacity.enabled', tag: 'el-switch', labelKey: 'settings.capacity.enabled.label', helpKey: 'settings.capacity.enabled.help', disabled: true },
      { key: 'capacity.low_risk_max', tag: 'el-input-number', labelKey: 'settings.capacity.low_risk_max.label', helpKey: 'settings.capacity.low_risk_max.help', disabled: true },
      { key: 'capacity.medium_risk_max', tag: 'el-input-number', labelKey: 'settings.capacity.medium_risk_max.label', helpKey: 'settings.capacity.medium_risk_max.help', disabled: true },
      { key: 'capacity.severe_min_slack', tag: 'el-input-number', labelKey: 'settings.capacity.severe_min_slack.label', helpKey: 'settings.capacity.severe_min_slack.help', disabled: true },
      { key: 'capacity.severe_violation_ratio', tag: 'el-input-number', labelKey: 'settings.capacity.severe_violation_ratio.label', helpKey: 'settings.capacity.severe_violation_ratio.help', disabled: true },
      { key: 'capacity.refresh_cooldown_turns', tag: 'el-input-number', labelKey: 'settings.capacity.refresh_cooldown_turns.label', helpKey: 'settings.capacity.refresh_cooldown_turns.help', disabled: true },
      { key: 'capacity.replan_cooldown_turns', tag: 'el-input-number', labelKey: 'settings.capacity.replan_cooldown_turns.label', helpKey: 'settings.capacity.replan_cooldown_turns.help', disabled: true },
      { key: 'capacity.max_replay_per_turn', tag: 'el-input-number', labelKey: 'settings.capacity.max_replay_per_turn.label', helpKey: 'settings.capacity.max_replay_per_turn.help', disabled: true },
      { key: 'capacity.min_turns_before_guardrail', tag: 'el-input-number', labelKey: 'settings.capacity.min_turns_before_guardrail.label', helpKey: 'settings.capacity.min_turns_before_guardrail.help', disabled: true },
      { key: 'capacity.profile_window', tag: 'el-input-number', labelKey: 'settings.capacity.profile_window.label', helpKey: 'settings.capacity.profile_window.help', disabled: true },
      { key: 'capacity.deepseek_v3_2_chat_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v3_2_chat_prior.label', helpKey: 'settings.capacity.deepseek_v3_2_chat_prior.help', disabled: true },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v3_2_reasoner_prior.label', helpKey: 'settings.capacity.deepseek_v3_2_reasoner_prior.help', disabled: true },
      { key: 'capacity.deepseek_v4_pro_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v4_pro_prior.label', helpKey: 'settings.capacity.deepseek_v4_pro_prior.help', disabled: true },
      { key: 'capacity.deepseek_v4_flash_prior', tag: 'el-input-number', labelKey: 'settings.capacity.deepseek_v4_flash_prior.label', helpKey: 'settings.capacity.deepseek_v4_flash_prior.help', disabled: true },
      { key: 'capacity.fallback_default_prior', tag: 'el-input-number', labelKey: 'settings.capacity.fallback_default_prior.label', helpKey: 'settings.capacity.fallback_default_prior.help', disabled: true }
    ]
  }
];

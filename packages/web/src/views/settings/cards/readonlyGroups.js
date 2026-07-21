/**
 * 通用设置页面：只读分组数据
 * 统一维护不可配置项分组，供 SettingsGroupCard 使用。
 *
 * 字段说明：
 * - key:      唯一标识，也用于 v-for :key
 * - tag:      直接使用组件标识符，如 el-input / el-input-number / el-switch / SettingsSelect
 * - label:    i18n key，指向 settings.xxx
 * - value:    当前值（只读展示）
 * - optionKey: select 类型专用，对应 SETTINGS_OPTIONS 中的选项映射键
 * - disabled: 是否禁用表单组件（只读项统一禁用）
 *
 * 排序规则：el-switch → el-input-number → SettingsSelect → el-input
 */

export const readonlyGroups = [
  {
    titleKey: 'settings.groups.reasoning',
    items: [{ key: 'reasoning_effort', tag: 'SettingsSelect', label: 'settings.reasoning_effort', optionKey: 'reasoning_effort', value: '', disabled: true }]
  },
  {
    titleKey: 'settings.groups.context',
    items: [
      { key: 'context.enabled', tag: 'el-switch', label: 'settings.context.enabled', value: '', disabled: true },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch', label: 'settings.CODEWHALE_CACHE_MAXIMAL', value: '', disabled: true },
      { key: 'context.verbatim_window_turns', tag: 'el-input-number', label: 'settings.context.verbatim_window_turns', value: '', disabled: true },
      { key: 'context.l1_threshold', tag: 'el-input-number', label: 'settings.context.l1_threshold', value: '', disabled: true },
      { key: 'context.l2_threshold', tag: 'el-input-number', label: 'settings.context.l2_threshold', value: '', disabled: true },
      { key: 'context.l3_threshold', tag: 'el-input-number', label: 'settings.context.l3_threshold', value: '', disabled: true },
      { key: 'context.seam_model', tag: 'el-input', label: 'settings.context.seam_model', value: '', disabled: true }
    ]
  },
  {
    titleKey: 'settings.groups.update',
    items: [{ key: 'update.update_uri', tag: 'el-input', label: 'settings.update.update_uri', value: '', disabled: true }]
  },
  {
    titleKey: 'settings.groups.security',
    items: [{ key: 'permissions.toml', tag: 'el-input', label: 'settings.permissions.toml', value: '', disabled: true }]
  },
  {
    titleKey: 'settings.groups.paths',
    items: [
      { key: 'skills.scan_codewhale_only', tag: 'el-switch', label: 'settings.skills.scan_codewhale_only', value: '', disabled: true },
      { key: 'memory.enabled', tag: 'el-switch', label: 'settings.memory.enabled', value: '', disabled: true },
      { key: 'snapshots.enabled', tag: 'el-switch', label: 'settings.snapshots.enabled', value: '', disabled: true },
      { key: 'verifier.enabled', tag: 'el-switch', label: 'settings.verifier.enabled', value: '', disabled: true },
      { key: 'snapshots.max_age_days', tag: 'el-input-number', label: 'settings.snapshots.max_age_days', value: '', disabled: true },
      { key: 'verifier.verdict_policy', tag: 'SettingsSelect', label: 'settings.verifier.verdict_policy', optionKey: 'verifier_verdict_policy', value: '', disabled: true },
      { key: 'skills_dir', tag: 'el-input', label: 'settings.skills_dir', value: '', disabled: true },
      { key: 'mcp_config_path', tag: 'el-input', label: 'settings.mcp_config_path', value: '', disabled: true },
      { key: 'notes_path', tag: 'el-input', label: 'settings.notes_path', value: '', disabled: true },
      { key: 'memory_path', tag: 'el-input', label: 'settings.memory_path', value: '', disabled: true }
    ]
  },
  {
    titleKey: 'settings.groups.capacity',
    items: [
      { key: 'capacity.enabled', tag: 'el-switch', label: 'settings.capacity.enabled', value: '', disabled: true },
      { key: 'capacity.low_risk_max', tag: 'el-input-number', label: 'settings.capacity.low_risk_max', value: '', disabled: true },
      { key: 'capacity.medium_risk_max', tag: 'el-input-number', label: 'settings.capacity.medium_risk_max', value: '', disabled: true },
      { key: 'capacity.severe_min_slack', tag: 'el-input-number', label: 'settings.capacity.severe_min_slack', value: '', disabled: true },
      { key: 'capacity.severe_violation_ratio', tag: 'el-input-number', label: 'settings.capacity.severe_violation_ratio', value: '', disabled: true },
      { key: 'capacity.refresh_cooldown_turns', tag: 'el-input-number', label: 'settings.capacity.refresh_cooldown_turns', value: '', disabled: true },
      { key: 'capacity.replan_cooldown_turns', tag: 'el-input-number', label: 'settings.capacity.replan_cooldown_turns', value: '', disabled: true },
      { key: 'capacity.max_replay_per_turn', tag: 'el-input-number', label: 'settings.capacity.max_replay_per_turn', value: '', disabled: true },
      { key: 'capacity.min_turns_before_guardrail', tag: 'el-input-number', label: 'settings.capacity.min_turns_before_guardrail', value: '', disabled: true },
      { key: 'capacity.profile_window', tag: 'el-input-number', label: 'settings.capacity.profile_window', value: '', disabled: true },
      { key: 'capacity.deepseek_v3_2_chat_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v3_2_chat_prior', value: '', disabled: true },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v3_2_reasoner_prior', value: '', disabled: true },
      { key: 'capacity.deepseek_v4_pro_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v4_pro_prior', value: '', disabled: true },
      { key: 'capacity.deepseek_v4_flash_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v4_flash_prior', value: '', disabled: true },
      { key: 'capacity.fallback_default_prior', tag: 'el-input-number', label: 'settings.capacity.fallback_default_prior', value: '', disabled: true }
    ]
  },
  {
    titleKey: 'settings.groups.subagents',
    items: [
      { key: 'subagents.max_depth', tag: 'el-input-number', label: 'settings.subagents.max_depth', value: '', disabled: true },
      { key: 'subagents.launch_concurrency', tag: 'el-input-number', label: 'settings.subagents.launch_concurrency', value: '', disabled: true },
      { key: 'subagents.max_admitted', tag: 'el-input-number', label: 'settings.subagents.max_admitted', value: '', disabled: true },
      { key: 'subagents.worker_model', tag: 'el-input', label: 'settings.subagents.worker_model', value: '', disabled: true },
      { key: 'subagents.explorer_model', tag: 'el-input', label: 'settings.subagents.explorer_model', value: '', disabled: true },
      { key: 'subagents.awaiter_model', tag: 'el-input', label: 'settings.subagents.awaiter_model', value: '', disabled: true },
      { key: 'subagents.review_model', tag: 'el-input', label: 'settings.subagents.review_model', value: '', disabled: true },
      { key: 'subagents.custom_model', tag: 'el-input', label: 'settings.subagents.custom_model', value: '', disabled: true }
    ]
  },
  {
    titleKey: 'settings.groups.notifications',
    items: [
      { key: 'notifications.include_summary', tag: 'el-switch', label: 'settings.notifications.include_summary', value: '', disabled: true },
      { key: 'notifications.sound_file', tag: 'el-input', label: 'settings.notifications.sound_file', value: '', disabled: true }
    ]
  }
];

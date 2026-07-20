/**
 * 通用设置页面：只读分组数据
 * 统一维护不可配置项分组，供 ReadOnlyGroupCard 使用。
 *
 * 字段说明：
 * - key:      唯一标识，也用于 v-for :key
 * - tag:      直接使用组件标识符，如 el-input / el-input-number / el-switch / ReadOnlySelect
 * - label:    i18n key，指向 settings.xxx
 * - value:    当前值（只读展示）
 * - optionKey: select 类型专用，对应 SETTINGS_OPTIONS 中的选项映射键
 */

export const readonlyGroups = [
  {
    titleKey: 'settings.groups.reasoning',
    items: [
      { key: 'reasoning_effort', tag: 'SettingsSelect', label: 'settings.reasoning_effort', optionKey: 'reasoning_effort', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.context',
    items: [
      { key: 'context.enabled', tag: 'el-switch', label: 'settings.context.enabled', value: '' },
      { key: 'context.verbatim_window_turns', tag: 'el-input-number', label: 'settings.context.verbatim_window_turns', value: '' },
      { key: 'context.l1_threshold', tag: 'el-input-number', label: 'settings.context.l1_threshold', value: '' },
      { key: 'context.l2_threshold', tag: 'el-input-number', label: 'settings.context.l2_threshold', value: '' },
      { key: 'context.l3_threshold', tag: 'el-input-number', label: 'settings.context.l3_threshold', value: '' },
      { key: 'context.seam_model', tag: 'el-input', label: 'settings.context.seam_model', value: '' },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch', label: 'settings.CODEWHALE_CACHE_MAXIMAL', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.update',
    items: [
      { key: 'update.update_uri', tag: 'el-input', label: 'settings.update.update_uri', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.security',
    items: [
      { key: 'permissions.toml', tag: 'el-input', label: 'settings.permissions.toml', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.paths',
    items: [
      { key: 'skills_dir', tag: 'el-input', label: 'settings.skills_dir', value: '' },
      { key: 'skills.scan_codewhale_only', tag: 'el-switch', label: 'settings.skills.scan_codewhale_only', value: '' },
      { key: 'mcp_config_path', tag: 'el-input', label: 'settings.mcp_config_path', value: '' },
      { key: 'notes_path', tag: 'el-input', label: 'settings.notes_path', value: '' },
      { key: 'memory_path', tag: 'el-input', label: 'settings.memory_path', value: '' },
      { key: 'memory.enabled', tag: 'el-switch', label: 'settings.memory.enabled', value: '' },
      { key: 'snapshots.enabled', tag: 'el-switch', label: 'settings.snapshots.enabled', value: '' },
      { key: 'snapshots.max_age_days', tag: 'el-input-number', label: 'settings.snapshots.max_age_days', value: '' },
      { key: 'verifier.enabled', tag: 'el-switch', label: 'settings.verifier.enabled', value: '' },
      { key: 'verifier.verdict_policy', tag: 'SettingsSelect', label: 'settings.verifier.verdict_policy', optionKey: 'verifier_verdict_policy', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.capacity',
    items: [
      { key: 'capacity.enabled', tag: 'el-switch', label: 'settings.capacity.enabled', value: '' },
      { key: 'capacity.low_risk_max', tag: 'el-input-number', label: 'settings.capacity.low_risk_max', value: '' },
      { key: 'capacity.medium_risk_max', tag: 'el-input-number', label: 'settings.capacity.medium_risk_max', value: '' },
      { key: 'capacity.severe_min_slack', tag: 'el-input-number', label: 'settings.capacity.severe_min_slack', value: '' },
      { key: 'capacity.severe_violation_ratio', tag: 'el-input-number', label: 'settings.capacity.severe_violation_ratio', value: '' },
      { key: 'capacity.refresh_cooldown_turns', tag: 'el-input-number', label: 'settings.capacity.refresh_cooldown_turns', value: '' },
      { key: 'capacity.replan_cooldown_turns', tag: 'el-input-number', label: 'settings.capacity.replan_cooldown_turns', value: '' },
      { key: 'capacity.max_replay_per_turn', tag: 'el-input-number', label: 'settings.capacity.max_replay_per_turn', value: '' },
      { key: 'capacity.min_turns_before_guardrail', tag: 'el-input-number', label: 'settings.capacity.min_turns_before_guardrail', value: '' },
      { key: 'capacity.profile_window', tag: 'el-input-number', label: 'settings.capacity.profile_window', value: '' },
      { key: 'capacity.deepseek_v3_2_chat_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v3_2_chat_prior', value: '' },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v3_2_reasoner_prior', value: '' },
      { key: 'capacity.deepseek_v4_pro_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v4_pro_prior', value: '' },
      { key: 'capacity.deepseek_v4_flash_prior', tag: 'el-input-number', label: 'settings.capacity.deepseek_v4_flash_prior', value: '' },
      { key: 'capacity.fallback_default_prior', tag: 'el-input-number', label: 'settings.capacity.fallback_default_prior', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.subagents',
    items: [
      { key: 'subagents.max_depth', tag: 'el-input-number', label: 'settings.subagents.max_depth', value: '' },
      { key: 'subagents.launch_concurrency', tag: 'el-input-number', label: 'settings.subagents.launch_concurrency', value: '' },
      { key: 'subagents.max_admitted', tag: 'el-input-number', label: 'settings.subagents.max_admitted', value: '' },
      { key: 'subagents.worker_model', tag: 'el-input', label: 'settings.subagents.worker_model', value: '' },
      { key: 'subagents.explorer_model', tag: 'el-input', label: 'settings.subagents.explorer_model', value: '' },
      { key: 'subagents.awaiter_model', tag: 'el-input', label: 'settings.subagents.awaiter_model', value: '' },
      { key: 'subagents.review_model', tag: 'el-input', label: 'settings.subagents.review_model', value: '' },
      { key: 'subagents.custom_model', tag: 'el-input', label: 'settings.subagents.custom_model', value: '' },
    ],
  },
  {
    titleKey: 'settings.groups.notifications',
    items: [
      { key: 'notifications.include_summary', tag: 'el-switch', label: 'settings.notifications.include_summary', value: '' },
      { key: 'notifications.sound_file', tag: 'el-input', label: 'settings.notifications.sound_file', value: '' },
    ],
  },
];

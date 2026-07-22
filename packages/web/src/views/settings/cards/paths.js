// 路径与存储分组：技能扫描范围、记忆、快照、验证器、技能目录、MCP 配置、笔记、记忆路径
export const pathsGroups = [
  {
    titleKey: 'settings.paths',
    items: [
      { key: 'skills.scan_codewhale_only', tag: 'el-switch', labelKey: 'settings.skills.scan_codewhale_only.label', helpKey: 'settings.skills.scan_codewhale_only.help', disabled: true },
      { key: 'memory.enabled', tag: 'el-switch', labelKey: 'settings.memory.enabled.label', helpKey: 'settings.memory.enabled.help', disabled: true },
      { key: 'snapshots.enabled', tag: 'el-switch', labelKey: 'settings.snapshots.enabled.label', helpKey: 'settings.snapshots.enabled.help', disabled: true },
      { key: 'verifier.enabled', tag: 'el-switch', labelKey: 'settings.verifier.enabled.label', helpKey: 'settings.verifier.enabled.help', disabled: true },
      { key: 'snapshots.max_age_days', tag: 'el-input-number', labelKey: 'settings.snapshots.max_age_days.label', helpKey: 'settings.snapshots.max_age_days.help', disabled: true },
      { key: 'verifier.verdict_policy', tag: 'SettingsSelect', labelKey: 'settings.verifier.verdict_policy.label', helpKey: 'settings.verifier.verdict_policy.help', optionKey: 'verifier_verdict_policy', disabled: true },
      { key: 'skills_dir', tag: 'el-input', labelKey: 'settings.skills_dir.label', helpKey: 'settings.skills_dir.help', disabled: true },
      { key: 'mcp_config_path', tag: 'el-input', labelKey: 'settings.mcp_config_path.label', helpKey: 'settings.mcp_config_path.help', disabled: true },
      { key: 'notes_path', tag: 'el-input', labelKey: 'settings.notes_path.label', helpKey: 'settings.notes_path.help', disabled: true },
      { key: 'memory_path', tag: 'el-input', labelKey: 'settings.memory_path.label', helpKey: 'settings.memory_path.help', disabled: true }
    ]
  }
];

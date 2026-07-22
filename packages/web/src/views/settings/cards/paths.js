// 路径与存储分组：技能扫描范围、记忆、快照、验证器、技能目录、MCP 配置、笔记、记忆路径
export const pathsGroups = [
  {
    titleKey: 'settings.paths',
    items: [
      { key: 'skills.scan_codewhale_only', tag: 'el-switch', disabled: true },
      { key: 'memory.enabled', tag: 'el-switch', disabled: true },
      { key: 'snapshots.enabled', tag: 'el-switch', disabled: true },
      { key: 'verifier.enabled', tag: 'el-switch', disabled: true },
      { key: 'snapshots.max_age_days', tag: 'el-input-number', disabled: true },
      { key: 'verifier.verdict_policy', tag: 'SettingsSelect', optionKey: 'verifier_verdict_policy', disabled: true },
      { key: 'skills_dir', tag: 'el-input', disabled: true },
      { key: 'mcp_config_path', tag: 'el-input', disabled: true },
      { key: 'notes_path', tag: 'el-input', disabled: true },
      { key: 'memory_path', tag: 'el-input', disabled: true }
    ]
  }
];

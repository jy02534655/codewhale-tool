// 路径与存储分组：技能扫描范围、记忆、快照、验证器、技能目录、MCP 配置、笔记、记忆路径
export const pathsGroups = [
  {
    titleKey: 'settings.paths',
    items: [
      { key: 'skills_scan_codewhale_only', tag: 'el-switch' },
      { key: 'memory_enabled', tag: 'el-switch' },
      { key: 'snapshots_enabled', tag: 'el-switch' },
      { key: 'verifier_enabled', tag: 'el-switch' },
      { key: 'snapshots_max_age_days', tag: 'el-input-number' },
      { key: 'verifier_verdict_policy', tag: 'SettingsSelect', optionKey: 'verifier_verdict_policy', disabled: true },
      { key: 'skills_dir', tag: 'el-input' },
      { key: 'mcp_config_path', tag: 'el-input' },
      { key: 'notes_path', tag: 'el-input' },
      { key: 'memory_path', tag: 'el-input' }
    ]
  }
];

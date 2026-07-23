// 路径与存储分组：技能扫描范围、记忆、快照、验证器、技能目录、MCP 配置、笔记、记忆路径
// 配置项顺序：el-switch -> el-input-number -> SettingsSelect -> el-input
export const pathsGroups = [
  {
    titleKey: 'settings.paths',
    items: [
      // 仅扫描 CodeWhale 技能：限制技能扫描范围为 CodeWhale 官方技能
      { key: 'skills_scan_codewhale_only', tag: 'el-switch' },
      // 启用记忆功能：开启后持久化对话记忆
      { key: 'memory_enabled', tag: 'el-switch' },
      // 启用快照：开启后自动保存会话快照
      { key: 'snapshots_enabled', tag: 'el-switch' },
      // 启用验证器：开启后启用输出验证器
      { key: 'verifier_enabled', tag: 'el-switch' },
      // 快照最大保留天数：快照文件的最长保留时间
      { key: 'snapshots_max_age_days', tag: 'el-input-number' },
      // 验证器判定策略：验证器输出结果的判定策略
      { key: 'verifier_verdict_policy', tag: 'SettingsSelect', optionKey: 'verifier_verdict_policy', disabled: true },
      // 技能目录：自定义技能安装目录路径
      { key: 'skills_dir', tag: 'el-input' },
      // MCP 配置文件路径：Model Context Protocol 配置文件路径
      { key: 'mcp_config_path', tag: 'el-input' },
      // 笔记路径：对话笔记存储路径
      { key: 'notes_path', tag: 'el-input' },
      // 记忆路径：对话记忆数据存储路径
      { key: 'memory_path', tag: 'el-input' }
    ]
  }
];
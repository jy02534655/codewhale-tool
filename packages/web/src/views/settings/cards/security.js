// 安全与权限分组：审批策略、沙箱模式、Shell 权限、权限规则文件
export const securityGroups = [
  {
    titleKey: 'settings.security',
    items: [
      { key: 'approval_policy', tag: 'SettingsSelect', labelKey: 'settings.approval_policy.label', helpKey: 'settings.approval_policy.help', optionKey: 'approval_policy' },
      { key: 'sandbox_mode', tag: 'SettingsSelect', labelKey: 'settings.sandbox_mode.label', helpKey: 'settings.sandbox_mode.help', optionKey: 'sandbox_mode' },
      { key: 'allow_shell', tag: 'el-switch', labelKey: 'settings.allow_shell.label', helpKey: 'settings.allow_shell.help' },
      { key: 'permissions.toml', tag: 'el-input', labelKey: 'settings.permissions.toml.label', helpKey: 'settings.permissions.toml.help', disabled: true }
    ]
  }
];

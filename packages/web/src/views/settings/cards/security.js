// 安全与权限分组：审批策略、沙箱模式、Shell 权限、权限规则文件
export const securityGroups = [
  {
    titleKey: 'settings.security',
    items: [
      { key: 'approval_policy', tag: 'SettingsSelect', optionKey: 'approval_policy' },
      { key: 'sandbox_mode', tag: 'SettingsSelect', optionKey: 'sandbox_mode' },
      { key: 'allow_shell', tag: 'el-switch' },
      { key: 'permissions_toml', tag: 'el-input' }
    ]
  }
];

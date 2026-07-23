// 安全与权限分组：审批策略、沙箱模式、Shell 权限、权限规则文件
// 配置项顺序：el-switch -> SettingsSelect -> el-input
export const securityGroups = [
  {
    titleKey: 'settings.security',
    items: [
      // 允许 Shell：是否允许执行 Shell 命令
      { key: 'allow_shell', tag: 'el-switch' },
      // 审批策略：命令执行前的审批策略级别
      { key: 'approval_policy', tag: 'SettingsSelect', optionKey: 'approval_policy' },
      // 沙箱模式：代码执行的沙箱隔离模式
      { key: 'sandbox_mode', tag: 'SettingsSelect', optionKey: 'sandbox_mode' },
      // 权限规则文件：权限规则的 TOML 配置文件路径
      { key: 'permissions_toml', tag: 'el-input' }
    ]
  }
];
// 功能开关分组：Shell 工具、子代理、Web 搜索、Apply Patch、MCP、执行策略、视觉模型
export const featuresGroups = [
  {
    titleKey: 'settings.features',
    items: [
      { key: 'features_shell_tool', tag: 'el-switch', labelKey: 'settings.features_shell_tool.label', helpKey: 'settings.features_shell_tool.help' },
      { key: 'features_subagents', tag: 'el-switch', labelKey: 'settings.features_subagents.label', helpKey: 'settings.features_subagents.help' },
      { key: 'features_web_search', tag: 'el-switch', labelKey: 'settings.features_web_search.label', helpKey: 'settings.features_web_search.help' },
      { key: 'features_apply_patch', tag: 'el-switch', labelKey: 'settings.features_apply_patch.label', helpKey: 'settings.features_apply_patch.help' },
      { key: 'features_mcp', tag: 'el-switch', labelKey: 'settings.features_mcp.label', helpKey: 'settings.features_mcp.help' },
      { key: 'features_exec_policy', tag: 'el-switch', labelKey: 'settings.features_exec_policy.label', helpKey: 'settings.features_exec_policy.help' },
      { key: 'features_vision_model', tag: 'el-switch', labelKey: 'settings.features_vision_model.label', helpKey: 'settings.features_vision_model.help' }
    ]
  }
];

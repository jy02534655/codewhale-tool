// 功能开关分组：Shell 工具、子代理、Web 搜索、Apply Patch、MCP、执行策略、视觉模型
// 配置项顺序：el-switch
export const featuresGroups = [
  {
    titleKey: 'settings.features',
    items: [
      // Shell 工具：启用或禁用 Shell 命令行工具
      { key: 'features_shell_tool', tag: 'el-switch' },
      // 子代理：启用或禁用子代理能力
      { key: 'features_subagents', tag: 'el-switch' },
      // Web 搜索：启用或禁用网络搜索功能
      { key: 'features_web_search', tag: 'el-switch' },
      // Apply Patch：启用或禁用 Apply Patch 补丁应用功能
      { key: 'features_apply_patch', tag: 'el-switch' },
      // MCP：启用或禁用 Model Context Protocol 支持
      { key: 'features_mcp', tag: 'el-switch' },
      // 执行策略：启用或禁用执行策略控制
      { key: 'features_exec_policy', tag: 'el-switch' },
      // 视觉模型：启用或禁用视觉模型支持
      { key: 'features_vision_model', tag: 'el-switch' }
    ]
  }
];
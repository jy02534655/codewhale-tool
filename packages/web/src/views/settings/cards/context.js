// 上下文管理分组：启用 Fin 快速路径、缓存最大化
// 配置项顺序：el-switch
export const contextGroups = [
  {
    titleKey: 'settings.context',
    items: [
      // 启用上下文管理：开启后启用上下文窗口管理
      { key: 'context_enabled', tag: 'el-switch' },
      // 最大化缓存：启用后使用最大化缓存策略
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch' }
    ]
  }
];
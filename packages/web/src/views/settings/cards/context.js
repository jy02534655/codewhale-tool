// 上下文管理分组：启用 Fin 快速路径、缓存最大化、完整保留轮数、L1/L2/L3 阈值、接缝模型
// 配置项顺序：el-switch -> el-input-number -> el-input
export const contextGroups = [
  {
    titleKey: 'settings.context',
    items: [
      // 启用上下文管理：开启后启用上下文窗口管理
      { key: 'context_enabled', tag: 'el-switch' },
      // 最大化缓存：启用后使用最大化缓存策略
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch' },
      // 逐字保留轮数：完整保留上下文的轮数
      { key: 'context_verbatim_window_turns', tag: 'el-input-number' },
      // L1 阈值：上下文第一层压缩阈值
      { key: 'context_l1_threshold', tag: 'el-input-number' },
      // L2 阈值：上下文第二层压缩阈值
      { key: 'context_l2_threshold', tag: 'el-input-number' },
      // L3 阈值：上下文第三层压缩阈值
      { key: 'context_l3_threshold', tag: 'el-input-number' },
      // 接缝模型：上下文接缝处使用的模型 ID
      { key: 'context_seam_model', tag: 'el-input' }
    ]
  }
];
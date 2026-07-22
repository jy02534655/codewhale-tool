// 上下文管理分组：启用 Fin 快速路径、缓存最大化、完整保留轮数、L1/L2/L3 阈值、接缝模型
export const contextGroups = [
  {
    titleKey: 'settings.context',
    items: [
      { key: 'context_enabled', tag: 'el-switch' },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch' },
      { key: 'context_verbatim_window_turns', tag: 'el-input-number' },
      { key: 'context_l1_threshold', tag: 'el-input-number' },
      { key: 'context_l2_threshold', tag: 'el-input-number' },
      { key: 'context_l3_threshold', tag: 'el-input-number' },
      { key: 'context_seam_model', tag: 'el-input' }
    ]
  }
];

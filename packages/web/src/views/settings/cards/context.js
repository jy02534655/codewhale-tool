// 上下文管理分组：启用 Fin 快速路径、缓存最大化、完整保留轮数、L1/L2/L3 阈值、接缝模型
export const contextGroups = [
  {
    titleKey: 'settings.context',
    items: [
      { key: 'enabled', tag: 'el-switch', disabled: true },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch', disabled: true },
      { key: 'verbatim_window_turns', tag: 'el-input-number', disabled: true },
      { key: 'l1_threshold', tag: 'el-input-number', disabled: true },
      { key: 'l2_threshold', tag: 'el-input-number', disabled: true },
      { key: 'l3_threshold', tag: 'el-input-number', disabled: true },
      { key: 'seam_model', tag: 'el-input', disabled: true }
    ]
  }
];

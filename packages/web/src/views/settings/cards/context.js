// 上下文管理分组：启用 Fin 快速路径、缓存最大化、完整保留轮数、L1/L2/L3 阈值、接缝模型
export const contextGroups = [
  {
    titleKey: 'settings.context',
    items: [
      { key: 'context.enabled', tag: 'el-switch', labelKey: 'settings.context.enabled.label', helpKey: 'settings.context.enabled.help', disabled: true },
      { key: 'CODEWHALE_CACHE_MAXIMAL', tag: 'el-switch', labelKey: 'settings.CODEWHALE_CACHE_MAXIMAL.label', helpKey: 'settings.CODEWHALE_CACHE_MAXIMAL.help', disabled: true },
      { key: 'context.verbatim_window_turns', tag: 'el-input-number', labelKey: 'settings.context.verbatim_window_turns.label', helpKey: 'settings.context.verbatim_window_turns.help', disabled: true },
      { key: 'context.l1_threshold', tag: 'el-input-number', labelKey: 'settings.context.l1_threshold.label', helpKey: 'settings.context.l1_threshold.help', disabled: true },
      { key: 'context.l2_threshold', tag: 'el-input-number', labelKey: 'settings.context.l2_threshold.label', helpKey: 'settings.context.l2_threshold.help', disabled: true },
      { key: 'context.l3_threshold', tag: 'el-input-number', labelKey: 'settings.context.l3_threshold.label', helpKey: 'settings.context.l3_threshold.help', disabled: true },
      { key: 'context.seam_model', tag: 'el-input', labelKey: 'settings.context.seam_model.label', helpKey: 'settings.context.seam_model.help', disabled: true }
    ]
  }
];

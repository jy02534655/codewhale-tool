// 通用设置下拉选项 i18n 配置（集中管理，不依赖 locales 的 settings.*_options）
const SETTINGS_OPTIONS = {
  theme: {
    'zh-Hans': { system: '系统默认', dark: '深色', light: '浅色', grayscale: '灰度', 'catppuccin-mocha': 'Catppuccin Mocha', 'tokyo-night': 'Tokyo Night', dracula: 'Dracula', 'gruvbox-dark': 'Gruvbox Dark' },
    en: { system: 'System', dark: 'Dark', light: 'Light', grayscale: 'Grayscale', 'catppuccin-mocha': 'Catppuccin Mocha', 'tokyo-night': 'Tokyo Night', dracula: 'Dracula', 'gruvbox-dark': 'Gruvbox Dark' },
    ja: { system: 'システム', dark: 'ダーク', light: 'ライト', grayscale: 'グレースケール', 'catppuccin-mocha': 'Catppuccin Mocha', 'tokyo-night': 'Tokyo Night', dracula: 'Dracula', 'gruvbox-dark': 'Gruvbox Dark' },
    'pt-BR': { system: 'Sistema', dark: 'Escuro', light: 'Claro', grayscale: 'Cinza', 'catppuccin-mocha': 'Catppuccin Mocha', 'tokyo-night': 'Tokyo Night', dracula: 'Dracula', 'gruvbox-dark': 'Gruvbox Dark' }
  },
  default_mode: {
    'zh-Hans': { agent: '智能体', plan: '规划', yolo: '直出' },
    en: { agent: 'Agent', plan: 'Plan', yolo: 'Yolo' },
    ja: { agent: 'エージェント', plan: '計画', yolo: '直出' },
    'pt-BR': { agent: 'Agente', plan: 'Planejamento', yolo: 'Direto' }
  },
  sidebar_focus: {
    'zh-Hans': { pinned: '固定', auto: '自动', tasks: '任务', agents: '智能体', context: '上下文', hidden: '隐藏' },
    en: { pinned: 'Pinned', auto: 'Auto', tasks: 'Tasks', agents: 'Agents', context: 'Context', hidden: 'Hidden' },
    ja: { pinned: '固定', auto: '自動', tasks: 'タスク', agents: 'エージェント', context: 'コンテキスト', hidden: '非表示' },
    'pt-BR': { pinned: 'Fixado', auto: 'Auto', tasks: 'Tarefas', agents: 'Agentes', context: 'Contexto', hidden: 'Oculto' }
  },
  mention_menu_behavior: {
    'zh-Hans': { fuzzy: '模糊匹配', browser: '浏览器' },
    en: { fuzzy: 'Fuzzy', browser: 'Browser' },
    ja: { fuzzy: 'ファジー', browser: 'ブラウザ' },
    'pt-BR': { fuzzy: 'Fuzzy', browser: 'Navegador' }
  },
  cost_currency: {
    'zh-Hans': { usd: '美元', cny: '人民币', rmb: '人民币', yuan: '元' },
    en: { usd: 'USD', cny: 'CNY', rmb: 'RMB', yuan: 'Yuan' },
    ja: { usd: 'USD', cny: '人民元', rmb: '人民元', yuan: '元' },
    'pt-BR': { usd: 'USD', cny: 'RMB', rmb: 'RMB', yuan: 'Yuan' }
  },
  verbosity: {
    'zh-Hans': { normal: '标准', concise: '简洁' },
    en: { normal: 'Normal', concise: 'Concise' },
    ja: { normal: '標準', concise: '簡潔' },
    'pt-BR': { normal: 'Normal', concise: 'Conciso' }
  },
  tui_alternate_screen: {
    'zh-Hans': { auto: '自动', always: '始终', never: '从不' },
    en: { auto: 'Auto', always: 'Always', never: 'Never' },
    ja: { auto: '自動', always: '常時', never: 'しない' },
    'pt-BR': { auto: 'Auto', always: 'Sempre', never: 'Nunca' }
  },
  approval_policy: {
    'zh-Hans': { 'on-request': '请求时审批', untrusted: '不信任时审批', never: '永不审批' },
    en: { 'on-request': 'On Request', untrusted: 'Untrusted', never: 'Never' },
    ja: { 'on-request': 'リクエスト時', untrusted: '信頼不能時', never: 'なし' },
    'pt-BR': { 'on-request': 'Sob solicitação', untrusted: 'Não confiável', never: 'Nunca' }
  },
  sandbox_mode: {
    'zh-Hans': { 'read-only': '只读', 'workspace-write': '工作区可写', 'danger-full-access': '完全访问', 'external-sandbox': '外部沙箱' },
    en: { 'read-only': 'Read-only', 'workspace-write': 'Workspace Write', 'danger-full-access': 'Full Access', 'external-sandbox': 'External Sandbox' },
    ja: { 'read-only': '読み取り専用', 'workspace-write': 'ワークスペース書き込み', 'danger-full-access': 'フルアクセス', 'external-sandbox': '外部サンドボックス' },
    'pt-BR': { 'read-only': 'Somente leitura', 'workspace-write': 'Gravação no workspace', 'danger-full-access': 'Acesso total', 'external-sandbox': 'Sandbox externo' }
  },
  notifications_method: {
    'zh-Hans': { auto: '自动', osc9: 'OSC 9', bel: '系统提示音', off: '关闭' },
    en: { auto: 'Auto', osc9: 'OSC 9', bel: 'Bell', off: 'Off' },
    ja: { auto: '自動', osc9: 'OSC 9', bel: 'ベル', off: 'なし' },
    'pt-BR': { auto: 'Auto', osc9: 'OSC 9', bel: 'Sino', off: 'Desligado' }
  },
  notifications_completion_sound: {
    'zh-Hans': { beep: '提示音', off: '关闭', bell: '铃声', file: '自定义文件' },
    en: { beep: 'Beep', off: 'Off', bell: 'Bell', file: 'Custom File' },
    ja: { beep: 'ビープ', off: 'なし', bell: 'ベル', file: 'カスタムファイル' },
    'pt-BR': { beep: 'Bip', off: 'Desligado', bell: 'Sino', file: 'Arquivo customizado' }
  },
  locale: {
    'zh-Hans': { auto: '自动', 'zh-Hans': '简体中文', en: 'English', ja: '日本語', 'pt-BR': 'Português (BR)' },
    en: { auto: 'Auto', 'zh-Hans': 'Simplified Chinese', en: 'English', ja: '日本語', 'pt-BR': 'Português (BR)' },
    ja: { auto: '自動', 'zh-Hans': '簡体中文', en: 'English', ja: '日本語', 'pt-BR': 'Português (BR)' },
    'pt-BR': { auto: 'Auto', 'zh-Hans': 'Chinês Simplificado', en: 'English', ja: '日本語', 'pt-BR': 'Português (BR)' }
  },
  reasoning_effort: {
    'zh-Hans': { off: '关闭', low: '低', medium: '中', high: '高', max: '最大', xhigh: '超高', ultracode: '极限' },
    en: { off: 'Off', low: 'Low', medium: 'Medium', high: 'High', max: 'Max', xhigh: 'XHigh', ultracode: 'Ultra' },
    ja: { off: 'オフ', low: '低', medium: '中', high: '高', max: '最大', xhigh: '超', ultracode: 'ウルトラ' },
    'pt-BR': { off: 'Desligado', low: 'Baixo', medium: 'Médio', high: 'Alto', max: 'Máximo', xhigh: 'Super', ultracode: 'Ultra' }
  },
  verifier_verdict_policy: {
    'zh-Hans': { hunt: ' Hunt' },
    en: { hunt: ' Hunt' },
    ja: { hunt: ' Hunt' },
    'pt-BR': { hunt: ' Hunt' }
  },
  thinking_default_expanded: {
    'zh-Hans': { 'true': '展开', 'false': '折叠' },
    en: { 'true': 'On', 'false': 'Off' },
    ja: { 'true': '展開', 'false': '折りたたむ' },
    'pt-BR': { 'true': 'Abrir', 'false': 'Fechar' }
  },
  inline_diffs: {
    'zh-Hans': { full: '完整', summary: '统计', off: '关闭' },
    en: { full: 'Full', summary: 'Summary', off: 'Off' },
    ja: { full: '完全', summary: '統計', off: 'なし' },
    'pt-BR': { full: 'Completo', summary: 'Resumo', off: 'Desligado' }
  },
  focus_texture: {
    'zh-Hans': { off: '无', scrim: '遮罩', grain: '颗粒' },
    en: { off: 'Off', scrim: 'Scrim', grain: 'Grain' },
    ja: { off: 'なし', scrim: 'Scrim', grain: 'Grain' },
    'pt-BR': { off: 'Desligado', scrim: 'Scrim', grain: 'Grain' }
  },
  rail_panel: {
    'zh-Hans': { tasks: '任务', agents: '智能体', context: '上下文', pinned: '固定' },
    en: { tasks: 'Tasks', agents: 'Agents', context: 'Context', pinned: 'Pinned' },
    ja: { tasks: 'タスク', agents: 'エージェント', context: 'コンテキスト', pinned: '固定' },
    'pt-BR': { tasks: 'Tarefas', agents: 'Agentes', context: 'Contexto', pinned: 'Fixado' }
  },
  work_surface_placement: {
    'zh-Hans': { top: '顶部', left: '左侧', right: '右侧', off: '隐藏' },
    en: { top: 'Top', left: 'Left', right: 'Right', off: 'Off' },
    ja: { top: '上部', left: '左', right: '右', off: '非表示' },
    'pt-BR': { top: 'Superior', left: 'Esquerda', right: 'Direita', off: 'Oculto' }
  },
  approval_default_selection: {
    'zh-Hans': { deny: '拒绝', allow_once: '允许一次' },
    en: { deny: 'Deny', allow_once: 'Allow Once' },
    ja: { deny: '拒否', allow_once: '一度許可' },
    'pt-BR': { deny: 'Negar', allow_once: 'Permitir uma vez' }
  },
  search_provider: {
    'zh-Hans': { duckduckgo: 'DuckDuckGo', bing: 'Bing', tavily: 'Tavily', bocha: 'Bocha', metaso: '秘塔', searxng: 'SearXNG', baidu: '百度', volcengine: '火山引擎', sofya: 'Sofya' },
    en: { duckduckgo: 'DuckDuckGo', bing: 'Bing', tavily: 'Tavily', bocha: 'Bocha', metaso: 'Metaso', searxng: 'SearXNG', baidu: 'Baidu', volcengine: 'Volcengine', sofya: 'Sofya' },
    ja: { duckduckgo: 'DuckDuckGo', bing: 'Bing', tavily: 'Tavily', bocha: 'Bocha', metaso: 'Metaso', searxng: 'SearXNG', baidu: '百度', volcengine: 'Volcengine', sofya: 'Sofya' },
    'pt-BR': { duckduckgo: 'DuckDuckGo', bing: 'Bing', tavily: 'Tavily', bocha: 'Bocha', metaso: 'Metaso', searxng: 'SearXNG', baidu: 'Baidu', volcengine: 'Volcengine', sofya: 'Sofya' }
  }
};

export function getSettingsOptions(key, loc) {
  const map = SETTINGS_OPTIONS[key];
  if (!map) return [];
  const langMap = map[loc] || map['zh-Hans'] || {};
  return Object.entries(langMap).map(([value, label]) => {
    return { value: value, label: label };
  });
}

export function getSettingsLabel(key, value, loc) {
  const map = SETTINGS_OPTIONS[key];
  if (!map) return value;
  const langMap = map[loc] || map['zh-Hans'] || {};
  return langMap[value] || value;
}

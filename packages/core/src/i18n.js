/**
 * i18n 多语言核心模块
 *
 * 提供供应商名称、UI 文案的多语言映射。
 * 支持语言：zh-Hans（默认）、en、ja、pt-BR
 *
 * @module i18n
 */

/** @typedef {'zh-Hans'|'en'|'ja'|'pt-BR'} Locale */

/** @type {Locale[]} */
export const SUPPORTED_LOCALES = ['zh-Hans', 'en', 'ja', 'pt-BR'];

/** @type {Record<Locale, string>} */
export const LOCALE_LABELS = {
  'zh-Hans': '简体中文',
  'en':      'English',
  'ja':      '日本語',
  'pt-BR':   'Português (BR)',
};

/**
 * 供应商多语言映射
 * key = provider id，value = Record<Locale, string>
 */
export const PROVIDER_I18N = {
  deepseek:    { 'zh-Hans': 'DeepSeek',       en: 'DeepSeek',       ja: 'DeepSeek',       'pt-BR': 'DeepSeek' },
  siliconflow: { 'zh-Hans': '硅基流动',        en: 'SiliconFlow',    ja: 'SiliconFlow',    'pt-BR': 'SiliconFlow' },
  openrouter:  { 'zh-Hans': 'OpenRouter',     en: 'OpenRouter',     ja: 'OpenRouter',     'pt-BR': 'OpenRouter' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM',    en: 'NVIDIA NIM',    ja: 'NVIDIA NIM',    'pt-BR': 'NVIDIA NIM' },
  atlascloud:  { 'zh-Hans': 'AtlasCloud',     en: 'AtlasCloud',     ja: 'AtlasCloud',     'pt-BR': 'AtlasCloud' },
  'wanjie-ark': { 'zh-Hans': '万界方舟',       en: 'Wanjie Ark',     ja: '万界方舟',        'pt-BR': 'Wanjie Ark' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo',     en: 'Xiaomi MiMo',    ja: 'Xiaomi MiMo',    'pt-BR': 'Xiaomi MiMo' },
  novita:      { 'zh-Hans': 'Novita',        en: 'Novita',        ja: 'Novita',        'pt-BR': 'Novita' },
  fireworks:   { 'zh-Hans': 'Fireworks',     en: 'Fireworks',     ja: 'Fireworks',     'pt-BR': 'Fireworks' },
  openai:      { 'zh-Hans': 'OpenAI（兼容）',  en: 'OpenAI / Compat', ja: 'OpenAI（互換）',  'pt-BR': 'OpenAI / Compat' },
  sglang:      { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)',  ja: 'SGLang（自前）',  'pt-BR': 'SGLang (Self)' },
  vllm:        { 'zh-Hans': 'vLLM（自托管）',   en: 'vLLM (Self)',    ja: 'vLLM（自前）',    'pt-BR': 'vLLM (Self)' },
  ollama:      { 'zh-Hans': 'Ollama（本地）',   en: 'Ollama (Local)',  ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

/**
 * 获取供应商在指定语言下的 label
 * @param {string} providerId
 * @param {Locale} locale
 * @returns {string}
 */
export function getProviderI18nLabel(providerId, locale) {
  const map = PROVIDER_I18N[providerId];
  if (!map) return providerId;
  return map[locale] || map['zh-Hans'] || providerId;
}

/**
 * 获取所有供应商列表（指定语言）
 * @param {Locale} locale
 * @returns {{id:string, label:string}[]}
 */
export function getKnownProviders(locale) {
  return Object.entries(PROVIDER_I18N).map(([id, labels]) => ({
    id,
    label: labels[locale] || labels['zh-Hans'] || id,
  }));
}

/**
 * 根据 provider id 获取默认 base_url
 * @param {string} providerId
 * @returns {string}
 */
export function getDefaultBaseUrl(providerId) {
  const urls = {
    deepseek:    'https://api.deepseek.com',
    siliconflow: 'https://api.siliconflow.cn/v1',
    openrouter:  'https://openrouter.ai/api/v1',
    openai:      'https://api.openai.com/v1',
    novita:      'https://api.novita.ai/v3/openai',
    fireworks:   'https://api.fireworks.ai/inference/v1',
  };
  return urls[providerId] || '';
}
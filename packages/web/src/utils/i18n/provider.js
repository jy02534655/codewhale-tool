// 供应商 i18n 配置（集中管理，不依赖 core 包）
export const PROVIDER_I18N = {
  siliconflow: { 'zh-Hans': '硅基流动', en: 'SiliconFlow', ja: 'SiliconFlow', 'pt-BR': 'SiliconFlow' },
  'siliconflow-CN': { 'zh-Hans': '硅基流动（中国）', en: 'SiliconFlow China', ja: 'SiliconFlow（中国）', 'pt-BR': 'SiliconFlow China' },
  'wanjie-ark': { 'zh-Hans': '万界方舟', en: 'Wanjie Ark', ja: '万界方舟', 'pt-BR': 'Wanjie Ark' },
  volcengine: { 'zh-Hans': '火山引擎', en: 'Volcengine', ja: 'Volcengine', 'pt-BR': 'Volcengine' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo', en: 'Xiaomi MiMo', ja: '小米 MiMo', 'pt-BR': 'Xiaomi MiMo' },
  qianfan: { 'zh-Hans': '千帆', en: 'Qianfan', ja: '千帆', 'pt-BR': 'Qianfan' },
  stepfun: { 'zh-Hans': '阶跃星辰', en: 'StepFun', ja: 'StepFun', 'pt-BR': 'StepFun' },
  openai: { 'zh-Hans': 'OpenAI（兼容）', en: 'OpenAI / Compat', ja: 'OpenAI（互換）', 'pt-BR': 'OpenAI / Compat' },
  atlascloud: { 'zh-Hans': 'AtlasCloud', en: 'AtlasCloud', ja: 'AtlasCloud', 'pt-BR': 'AtlasCloud' },
  novita: { 'zh-Hans': 'Novita', en: 'Novita', ja: 'Novita', 'pt-BR': 'Novita' },
  moonshot: { 'zh-Hans': 'Moonshot', en: 'Moonshot', ja: 'Moonshot', 'pt-BR': 'Moonshot' },
  minimax: { 'zh-Hans': 'MiniMax', en: 'MiniMax', ja: 'MiniMax', 'pt-BR': 'MiniMax' },
  zai: { 'zh-Hans': 'Z.ai', en: 'Z.ai', ja: 'Z.ai', 'pt-BR': 'Z.ai' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM', en: 'NVIDIA NIM', ja: 'NVIDIA NIM', 'pt-BR': 'NVIDIA NIM' },
  openrouter: { 'zh-Hans': 'OpenRouter', en: 'OpenRouter', ja: 'OpenRouter', 'pt-BR': 'OpenRouter' },
  fireworks: { 'zh-Hans': 'Fireworks', en: 'Fireworks', ja: 'Fireworks', 'pt-BR': 'Fireworks' },
  arcee: { 'zh-Hans': 'Arcee', en: 'Arcee', ja: 'Arcee', 'pt-BR': 'Arcee' },
  huggingface: { 'zh-Hans': 'Hugging Face', en: 'Hugging Face', ja: 'Hugging Face', 'pt-BR': 'Hugging Face' },
  together: { 'zh-Hans': 'Together', en: 'Together', ja: 'Together', 'pt-BR': 'Together' },
  'openai-codex': { 'zh-Hans': 'OpenAI Codex', en: 'OpenAI Codex', ja: 'OpenAI Codex', 'pt-BR': 'OpenAI Codex' },
  anthropic: { 'zh-Hans': 'Anthropic', en: 'Anthropic', 'ja': 'Anthropic', 'pt-BR': 'Anthropic' },
  openmodel: { 'zh-Hans': 'OpenModel', en: 'OpenModel', 'ja': 'OpenModel', 'pt-BR': 'OpenModel' },
  deepinfra: { 'zh-Hans': 'DeepInfra', en: 'DeepInfra', 'ja': 'DeepInfra', 'pt-BR': 'DeepInfra' },
  sakana: { 'zh-Hans': 'Sakana', en: 'Sakana', 'ja': 'Sakana', 'pt-BR': 'Sakana' },
  sglang: { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)', ja: 'SGLang（自前）', 'pt-BR': 'SGLang (Self)' },
  vllm: { 'zh-Hans': 'vLLM（自托管）', en: 'vLLM (Self)', ja: 'vLLM（自前）', 'pt-BR': 'vLLM (Self)' },
  ollama: { 'zh-Hans': 'Ollama（本地）', en: 'Ollama (Local)', ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

export function getVendorLabel(id, loc) {
  const map = PROVIDER_I18N[id];
  return map ? (map[loc] || map['zh-Hans'] || id) : id;
}

export function getVendorOptions(loc) {
  return Object.entries(PROVIDER_I18N).map(([id, labels]) => {
    return { id: id, label: labels[loc] || labels['zh-Hans'] || id };
  });
}

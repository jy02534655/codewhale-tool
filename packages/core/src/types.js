/**
 * 核心类型定义（JSDoc 类型注释，供 IDE 智能提示使用）
 *
 * 本地存储使用 JSON 格式（store.json），
 * CodeWhale 运行时使用 TOML 格式（~/.codewhale/config.toml），
 * 两者通过 SyncManager 实时双向同步。
 *
 * @module types
 */

/**
 * @typedef {object} ModelEntry
 * @property {string}  name   - 模型名称，如 "deepseek-ai/DeepSeek-V4-Pro"
 * @property {boolean} active - 是否当前激活的模型（同一 provider 下只有一个）
 */

/**
 * @typedef {object} ProviderEntry
 * @property {string}      id       - 主键：provider + ":" + api_key，如 "siliconflow:sk-abc"
 * @property {string}      provider - provider 类型标识，如 "siliconflow"
 * @property {string}      label    - 显示名称
 * @property {string}      api_key  - API key 明文
 * @property {string}      base_url - 自定义 API 基础 URL
 * @property {ModelEntry[]} models  - 该 provider 下的模型列表
 * @property {boolean}     active   - 该 provider 是否全局激活（第三方开关已开 + 当前选中）
 */

/**
 * @typedef {object} SkillEntry
 * @property {string}  id      - Skill 唯一标识符，如 "pdf"
 * @property {string}  path    - Skill 在磁盘上的完整路径
 * @property {boolean} enabled - 是否启用
 * @property {string}  source  - 来源：'community' | 'local' | 'custom'
 * @property {string}  [version] - 版本号（可选）
 */

/**
 * @typedef {object} SkillsConfig
 * @property {boolean}      enabled   - 全局 skill 开关
 * @property {SkillEntry[]} installed - 已安装的 skill 列表
 */

/**
 * @typedef {object} StoreData
 * @property {ProviderEntry[]} providers - 第三方 provider 列表
 * @property {SkillsConfig}    skills    - Skill 配置
 * @property {string}          official_api_key - DeepSeek 官方 API key
 */

/** CodeWhale 官方支持的 provider 列表 */
export const KNOWN_PROVIDERS = [
  { id: 'deepseek',    label: 'DeepSeek' },
  { id: 'nvidia-nim',  label: 'NVIDIA NIM' },
  { id: 'atlascloud',  label: 'AtlasCloud' },
  { id: 'wanjie-ark',  label: 'Wanjie Ark (万界方舟)' },
  { id: 'openrouter',  label: 'OpenRouter' },
  { id: 'xiaomi-mimo', label: 'Xiaomi MiMo' },
  { id: 'novita',      label: 'Novita' },
  { id: 'fireworks',   label: 'Fireworks' },
  { id: 'siliconflow', label: 'SiliconFlow (硅基流动)' },
  { id: 'openai',      label: 'OpenAI / 兼容端点' },
  { id: 'sglang',      label: 'SGLang (自托管)' },
  { id: 'vllm',        label: 'vLLM (自托管)' },
  { id: 'ollama',      label: 'Ollama (本地)' },
];

/**
 * 根据 provider id 获取默认 label
 * @param {string} providerId
 * @returns {string}
 */
export function getProviderLabel(providerId) {
  const found = KNOWN_PROVIDERS.find((p) => p.id === providerId);
  return found ? found.label : providerId;
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

export {};

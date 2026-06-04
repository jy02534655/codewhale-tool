/**
 * 核心类型定义（JSDoc 类型注释，供 IDE 智能提示使用）
 *
 * 此文件不导出任何运行时代码，仅提供 JSDoc typedef，
 * 其他模块通过 `@typedef` 引用这些类型。
 *
 * @module types
 */

/**
 * @typedef {object} ActiveConfig
 * @property {string} active_provider - 当前使用的 provider 名称，如 "deepseek"
 * @property {string} active_api_key  - 当前使用的 API key 别名，如 "personal"
 * @property {string} active_model    - 当前使用的模型标识符，如 "deepseek-ai/DeepSeek-V4-Pro"
 */

/**
 * @typedef {object} ApiKeyEntry
 * @property {string}   key           - 实际的 API key 字符串
 * @property {string}   label         - 该 key 的显示名称/备注
 * @property {string[]} models        - 该 key 可用的模型列表
 * @property {string}   default_model - 该 key 的默认模型
 * @property {string}   [base_url]    - 自定义 API 基础 URL（可选）
 */

/**
 * @typedef {object} ProviderConfig
 * @property {string}                     label    - Provider 显示名称
 * @property {Record<string, ApiKeyEntry>} api_keys - key 别名 → ApiKeyEntry 的映射
 * @property {string}                     [api_key] - 旧格式兼容：直接的 API key
 * @property {string}                     [model]   - 旧格式兼容：直接的 model
 * @property {string}                     [base_url]- 旧格式兼容：直接的 base_url
 */

/**
 * @typedef {object} SkillEntry
 * @property {string}  id      - Skill 唯一标识符，如 "pdf"
 * @property {string}  path    - Skill 在磁盘上的完整路径
 * @property {boolean} enabled - 是否启用
 * @property {string}  source  - 来源：'community' | 'local' | 'custom'
 * @property {string}  [version] - 版本号（可选）
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

export {};
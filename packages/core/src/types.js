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
 * @typedef {object} OfficialKeyEntry
 * @property {string}  id      - 主键："official:" + api_key
 * @property {string}  alias   - 别名/标签
 * @property {string}  api_key - API key 明文
 * @property {boolean} active  - 是否当前激活
 */

/**
 * @typedef {object} ModelEntry
 * @property {string}  name   - 模型名称
 * @property {boolean} active - 是否当前激活的模型
 */

/**
 * @typedef {object} ProviderEntry
 * @property {string}       id       - 主键："供应商类型:api_key"
 * @property {string}       provider - 供应商类型标识，如 "siliconflow"
 * @property {string}       label    - 别名
 * @property {string}       api_key  - API key 明文
 * @property {string}       base_url - 自定义 API 基础 URL
 * @property {ModelEntry[]} models   - 该供应商下的模型列表
 * @property {boolean}      active   - 该供应商是否全局激活
 */

/**
 * @typedef {object} SkillEntry
 * @property {string}  id      - Skill 唯一标识符
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
 * @property {OfficialKeyEntry[]} official_keys - 官方 DeepSeek API key 列表
 * @property {ProviderEntry[]}   providers     - 第三方供应商列表
 * @property {SkillsConfig}      skills        - Skill 配置
 */

export {};
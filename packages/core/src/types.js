/**
 * 核心类型定义（JSDoc 类型注释，供 IDE 智能提示使用）
 *
 * 本地存储使用 JSON 格式（store.json / skills.json），
 * CodeWhale 运行时使用 TOML 格式（~/.codewhale/config.toml），
 * 两者通过 SyncManager 实时双向同步。
 *
 * @module types
 */

/**
 * @typedef {object} ProxyAuth
 * @property {string} [username] - 代理认证用户名
 * @property {string} [password] - 代理认证密码
 */

/**
 * @typedef {object} ProxyEntry
 * @property {string}  id       - 主键："proxy:" + uuid
 * @property {string}  alias    - 显示别名，如下拉框展示
 * @property {'http'|'socks5'} type - 代理协议
 * @property {string}  host     - 代理主机地址
 * @property {number}  port     - 代理端口
 * @property {ProxyAuth} [auth] - 代理认证（可选）
 * @property {boolean} [default] - 是否默认选中
 */

/**
 * @typedef {object} TokenEntry
 * @property {string}  id      - 主键："token:" + uuid
 * @property {string}  alias   - 显示别名，如下拉框展示
 * @property {string}  token   - GitHub Token 明文
 * @property {boolean} [default] - 是否默认选中
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
 * @property {string}   id            - 唯一标识
 * @property {string}   [name]        - 从 SKILL.md 自动提取的显示名
 * @property {string}   [description] - 从 SKILL.md 自动提取的描述
 * @property {string}   [alias]       - 用户自定义别名（左侧显示优先使用此字段）
 * @property {string}   [remark]      - 用户自定义备注（中文注解）
 * @property {string[]} [tags]        - 用户自定义标签
 * @property {string}   path          - 磁盘路径
 * @property {boolean}  enabled       - 是否启用
 * @property {string}   source        - 来源：community | local | custom
 * @property {string}   [version]     - 版本号
 * @property {string[]} [depends_on]  - 依赖的 skill id 列表（预留）
 * @property {number}   [installed_at] - 安装时间戳（ms）
 * @property {number}   [updated_at]   - 更新时间戳（ms）
 */

/**
 * @typedef {object} SkillsConfig
 * @property {boolean}                    enabled         - 全局 skill 开关
 * @property {SkillEntry[]}              installed        - 已安装的 skill 列表
 * @property {Array<{id:string}>}        [community_cache] - 社区 skill 列表缓存
 * @property {number}                    [cached_at]      - 缓存时间戳（ms），0 表示未缓存
 */

/**
 * @typedef {object} ProjectSkillsConfig
 * @property {boolean}   enabled    - 是否启用
 * @property {string[]}  installed  - 已安装的 skill id 列表
 */

/**
 * @typedef {object} ProjectEntry
 * @property {string}  id      - 主键："project:" + uuid
 * @property {string}  alias   - 显示别名
 * @property {string}  path    - 项目目录路径
 * @property {boolean} [default] - 是否默认项目
 */

/**
 * @typedef {object} StoreData
 * @property {OfficialKeyEntry[]} official_keys - 官方 DeepSeek API key 列表
 * @property {ProviderEntry[]}   providers     - 第三方供应商列表
 * @property {ProxyEntry[]}      proxies       - 代理配置列表
 * @property {TokenEntry[]}      tokens        - GitHub Token 列表
 * @property {ProjectEntry[]}    projects      - 项目目录列表
 * @property {Object<string, ProjectSkillsConfig>} [project_skills] - 项目级 Skill 配置，key 为项目 id
 * @property {SkillsConfig}      skills        - Skill 配置
 * @property {string}            [locale]      - 语言偏好，如 'zh-Hans'
 * @property {string}            [default_text_model] - 全局默认文本模型
 * @property {Array<{path: string, content?: string}>} [instructions] - 指令文件配置列表
 */
export {};

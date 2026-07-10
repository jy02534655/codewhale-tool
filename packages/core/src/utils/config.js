/**
 * ConfigEngine — 本地 JSON 存储引擎
 *
 * 管理 codewhale-tool 自身的 store.json 文件。
 * 使用 Node 原生 JSON.parse/stringify，零外部依赖。
 *
 * 存储路径查找顺序：
 *   1. 显式传入的路径
 *   2. 当前工作目录下的 store.json
 *   3. 用户主目录下的 .codewhale/store.json
 *
 * 通俗理解：
 * 这个类就像整个应用的“记事本”。所有配置（供应商、代理、Token 等）
 * 都存在一个 JSON 文件里，ConfigEngine 负责安全地读写这个文件。
 * 读写前会自动备份，读取失败会回退到默认值，避免程序崩溃。
 *
 * @module config
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

/**
 * @typedef {import('../types.js').ProviderEntry} ProviderEntry
 * @typedef {import('../types.js').OfficialKeyEntry} OfficialKeyEntry
 * @typedef {import('../types.js').StoreData} StoreData
 * @typedef {import('../types.js').SkillsConfig} SkillsConfig
 */

/** @type {StoreData} 默认存储骨架 */
const DEFAULT_STORE = {
  locale: 'zh-Hans',
  official_keys: [],
  providers: [],
  proxies: [],
  tokens: [],
  projects: [],
  project_skills: {},
  skills: {
    enabled: true,
    installed: [],
    community_cache: [],
    cached_at: 0,
  },
};

export class ConfigEngine {
  /**
   * 创建配置引擎实例
   *
   * @param {string} [storePath] - 显式指定的 store.json 文件路径。如果省略，会自动探测路径。
   */
  constructor(storePath) {
    this._path = storePath || ConfigEngine.detectPath();
  }

  // ─── 路径探测 ──────────────────────────────────────────────

  /**
   * 自动查找 store.json 的存放路径。
   *
   * 优先检查当前项目下的 data/store.json，其次检查用户主目录下的 .codewhale/store.json。
   * 如果都不存在，则默认返回当前项目下的 data/store.json 路径（后续首次写入时会自动创建目录和文件）。
   *
   * @returns {string} 最终选定的 store.json 路径
   */
  static detectPath() {
    const cwd = join(process.cwd(), 'data', 'store.json');
    if (existsSync(cwd)) return cwd;
    const home = join(homedir(), '.codewhale', 'store.json');
    if (existsSync(home)) return home;
    return cwd;
  }

  /** @returns {string} 当前使用的 store.json 路径 */
  get path() { return this._path; }

  // ─── 读写核心 ──────────────────────────────────────────────

  /**
   * 从磁盘读取完整配置数据。
   *
   * 如果文件不存在或解析失败，会返回一个基于默认骨架的干净副本，避免程序因脏数据崩溃。
   *
   * @returns {StoreData} 当前存储的全部配置数据
   */
  read() {
    if (!existsSync(this._path)) {
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
    try {
      const data = JSON.parse(readFileSync(this._path, 'utf-8'));
      return this._mergeDefaults(data);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
  }

  /**
   * 将完整配置数据写入磁盘。
   *
   * 写入前会自动备份旧文件为 .bak，并确保目标目录存在。
   *
   * @param {StoreData} data 要持久化的完整配置对象
   */
  write(data) {
    this._backup();
    const dir = dirname(this._path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this._path, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 以“读-改-写”方式更新配置。
   *
   * 先读取当前数据，传给 updater 函数得到新数据，再整体写回。
   * 这是 ConfigEngine 最常用的原子更新方式，避免读写之间被其他代码插入修改。
   *
   * @param {(data: StoreData) => StoreData} updater 接收当前数据、返回新数据的函数
   */
  update(updater) {
    const data = this.read();
    this.write(updater(data));
  }

  /**
   * 将当前 store.json 备份为同名 .bak 文件。
   *
   * 备份在每次写入前自动执行，用于意外恢复。
   */
  _backup() {
    if (existsSync(this._path)) copyFileSync(this._path, this._path + '.bak');
  }

  /**
   * 合并默认值，补齐缺失字段。
   *
   * 如果用户手动编辑 store.json 导致某些字段缺失，这里会把默认值补回去，
   * 防止后续代码访问 undefined 而报错。
   *
   * @param {StoreData} data 从文件读取的原始数据
   * @returns {StoreData} 补齐默认值后的完整数据
   */
  _mergeDefaults(data) {
    const def = JSON.parse(JSON.stringify(DEFAULT_STORE));
    return {
      locale: data.locale || def.locale,
      official_keys: Array.isArray(data.official_keys) ? data.official_keys : def.official_keys,
      providers: Array.isArray(data.providers) ? data.providers : def.providers,
      proxies: Array.isArray(data.proxies) ? data.proxies : def.proxies,
      tokens: Array.isArray(data.tokens) ? data.tokens : def.tokens,
      projects: Array.isArray(data.projects) ? data.projects : def.projects,
      project_skills: data.project_skills && typeof data.project_skills === 'object' ? data.project_skills : def.project_skills,
      skills: {
        enabled: data.skills?.enabled ?? def.skills.enabled,
        installed: Array.isArray(data.skills?.installed) ? data.skills.installed : def.skills.installed,
        community_cache: Array.isArray(data.skills?.community_cache)
          ? data.skills.community_cache
          : def.skills.community_cache,
        cached_at: data.skills?.cached_at ?? def.skills.cached_at,
      },
    };
  }

  // ─── 官方 Key 方法 ─────────────────────────────────────────

  /**
   * 获取所有官方 API Key 条目。
   *
   * @returns {OfficialKeyEntry[]}
   */
  getOfficialKeys() { return this.read().official_keys; }

  /**
   * 整体替换官方 API Key 列表。
   *
   * @param {OfficialKeyEntry[]} keys 新的官方 Key 数组
   */
  setOfficialKeys(keys) {
    this.update((d) => { d.official_keys = keys; return d; });
  }

  /**
   * 根据 id 查找单个官方 Key。
   *
   * @param {string} id 要查找的官方 Key 唯一标识
   * @returns {OfficialKeyEntry | undefined}
   */
  findOfficialKey(id) {
    return this.read().official_keys.find((k) => k.id === id);
  }

  // ─── Provider 方法 ─────────────────────────────────────────

  /**
   * 获取所有供应商条目。
   *
   * @returns {ProviderEntry[]}
   */
  getProviders() { return this.read().providers; }

  /**
   * 整体替换供应商列表。
   *
   * @param {ProviderEntry[]} providers 新的供应商数组
   */
  setProviders(providers) {
    this.update((d) => { d.providers = providers; return d; });
  }

  /**
   * 根据 id 查找单个供应商。
   *
   * @param {string} id 要查找的供应商唯一标识
   * @returns {ProviderEntry | undefined}
   */
  findProvider(id) {
    return this.read().providers.find((p) => p.id === id);
  }

  /**
   * 按供应商类型查找所有匹配的供应商。
   *
   * @param {string} providerType 供应商类型，如 'deepseek'、'openai' 等
   * @returns {ProviderEntry[]}
   */
  findProvidersByType(providerType) {
    return this.read().providers.filter((p) => p.provider === providerType);
  }

  // ─── Proxy 方法 ────────────────────────────────────────────

  /**
   * 获取所有代理配置条目。
   *
   * @returns {import('../types.js').ProxyEntry[]}
   */
  getProxies() { return this.read().proxies; }

  /**
   * 整体替换代理列表。
   *
   * @param {import('../types.js').ProxyEntry[]} proxies 新的代理数组
   */
  setProxies(proxies) {
    this.update((d) => { d.proxies = proxies; return d; });
  }

  /**
   * 根据 id 查找单个代理配置。
   *
   * @param {string} id 要查找的代理唯一标识
   * @returns {import('../types.js').ProxyEntry | undefined}
   */
  findProxy(id) {
    return this.read().proxies.find((p) => p.id === id);
  }

  // ─── Token 方法 ────────────────────────────────────────────

  /**
   * 获取所有 Token 条目。
   *
   * @returns {import('../types.js').TokenEntry[]}
   */
  getTokens() { return this.read().tokens; }

  /**
   * 整体替换 Token 列表。
   *
   * @param {import('../types.js').TokenEntry[]} tokens 新的 Token 数组
   */
  setTokens(tokens) {
    this.update((d) => { d.tokens = tokens; return d; });
  }

  /**
   * 根据 id 查找单个 Token。
   *
   * @param {string} id 要查找的 Token 唯一标识
   * @returns {import('../types.js').TokenEntry | undefined}
   */
  findToken(id) {
    return this.read().tokens.find((t) => t.id === id);
  }

  // ─── Project 方法 ────────────────────────────────────────────

  /**
   * 获取所有项目条目。
   *
   * @returns {import('../types.js').ProjectEntry[]}
   */
  getProjects() { return this.read().projects; }

  /**
   * 整体替换项目列表。
   *
   * @param {import('../types.js').ProjectEntry[]} projects 新的项目数组
   */
  setProjects(projects) {
    this.update((d) => { d.projects = projects; return d; });
  }

  /**
   * 根据 id 查找单个项目。
   *
   * @param {string} id 要查找的项目唯一标识
   * @returns {import('../types.js').ProjectEntry | undefined}
   */
  findProject(id) {
    return this.read().projects.find((p) => p.id === id);
  }

  /**
   * 获取指定项目的 Skill 配置。
   *
   * @param {string} projectId 项目唯一标识
   * @returns {Object} 该项目的 Skill 配置，若不存在则返回默认结构
   */
  getProjectSkills(projectId) {
    return this.read().project_skills?.[projectId] || { enabled: true, installed: [] };
  }

  /**
   * 设置指定项目的 Skill 配置。
   *
   * @param {string} projectId 项目唯一标识
   * @param {Object} config 要保存的 Skill 配置对象
   */
  setProjectSkills(projectId, config) {
    this.update((d) => {
      d.project_skills = d.project_skills || {};
      d.project_skills[projectId] = config;
      return d;
    });
  }

  // ─── Skill 方法 ────────────────────────────────────────────

  /**
   * 获取全局 Skill 配置。
   *
   * @returns {SkillsConfig}
   */
  getSkills() { return this.read().skills; }

  /**
   * 整体替换全局 Skill 配置。
   *
   * @param {SkillsConfig} skills 新的 Skill 配置对象
   */
  setSkills(skills) {
    this.update((d) => { d.skills = skills; return d; });
  }

  // ─── Locale 方法 ────────────────────────────────────────────

  /**
   * 获取持久化的语言偏好。
   *
   * @returns {string} 语言代码，如 'zh-Hans'、'en' 等
   */
  getLocale() {
    return this.read().locale || 'zh-Hans';
  }

  /**
   * 持久化语言偏好。
   *
   * @param {string} locale 语言代码，如 'zh-Hans'、'en' 等
   */
  setLocale(locale) {
    this.update((d) => { d.locale = locale; return d; });
  }
}

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
 * @module config
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

/**
 * @typedef {import('./types.js').ProviderEntry} ProviderEntry
 * @typedef {import('./types.js').StoreData} StoreData
 * @typedef {import('./types.js').SkillsConfig} SkillsConfig
 */

/** @type {StoreData} 默认存储骨架 */
const DEFAULT_STORE = {
  official_api_key: '',
  providers: [],
  skills: {
    enabled: true,
    installed: [],
  },
};

export class ConfigEngine {
  /**
   * @param {string} [storePath] - 显式指定的 store.json 路径，不传则自动探测
   */
  constructor(storePath) {
    this._path = storePath || ConfigEngine.detectPath();
  }

  // ─── 路径探测 ──────────────────────────────────────────────

  /**
   * 自动探测 store.json 位置
   * 优先级：cwd/store.json → ~/.codewhale/store.json → cwd/store.json（新建）
   * @returns {string}
   */
  static detectPath() {
    const cwd = join(process.cwd(), 'store.json');
    if (existsSync(cwd)) return cwd;

    const home = join(homedir(), '.codewhale', 'store.json');
    if (existsSync(home)) return home;

    return cwd;
  }

  /** @returns {string} 当前存储文件路径 */
  get path() {
    return this._path;
  }

  // ─── 读写核心 ──────────────────────────────────────────────

  /**
   * 读取完整 StoreData
   * @returns {StoreData}
   */
  read() {
    if (!existsSync(this._path)) {
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
    const raw = readFileSync(this._path, 'utf-8');
    try {
      const data = JSON.parse(raw);
      // 深度合并默认值，保证新增字段不丢失
      return this._mergeDefaults(data);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
  }

  /**
   * 写入完整 StoreData
   * 写入前自动备份为 store.json.bak
   * @param {StoreData} data
   */
  write(data) {
    this._backup();
    const dir = dirname(this._path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const json = JSON.stringify(data, null, 2);
    writeFileSync(this._path, json, 'utf-8');
  }

  /**
   * 原地修改：读取 → 回调修改 → 写回
   * @param {(data: StoreData) => StoreData} updater
   */
  update(updater) {
    const data = this.read();
    const updated = updater(data);
    this.write(updated);
  }

  /**
   * 备份当前文件为 .bak
   * @private
   */
  _backup() {
    if (existsSync(this._path)) {
      copyFileSync(this._path, this._path + '.bak');
    }
  }

  /**
   * 深度合并默认值
   * @param {object} data
   * @returns {StoreData}
   * @private
   */
  _mergeDefaults(data) {
    const def = JSON.parse(JSON.stringify(DEFAULT_STORE));
    return {
      official_api_key: data.official_api_key ?? def.official_api_key,
      providers: Array.isArray(data.providers) ? data.providers : def.providers,
      skills: {
        enabled: data.skills?.enabled ?? def.skills.enabled,
        installed: Array.isArray(data.skills?.installed) ? data.skills.installed : def.skills.installed,
      },
    };
  }

  // ─── Provider 快捷方法 ─────────────────────────────────────

  /**
   * 获取所有 provider
   * @returns {ProviderEntry[]}
   */
  getProviders() {
    return this.read().providers;
  }

  /**
   * 设置整个 provider 列表
   * @param {ProviderEntry[]} providers
   */
  setProviders(providers) {
    this.update((data) => {
      data.providers = providers;
      return data;
    });
  }

  /**
   * 根据主键 ID 查找 provider
   * @param {string} id - provider 主键，格式 "provider类型:api_key"
   * @returns {ProviderEntry|undefined}
   */
  findProvider(id) {
    return this.read().providers.find((p) => p.id === id);
  }

  /**
   * 根据 provider 类型查找所有 provider
   * @param {string} providerType - 如 "siliconflow"
   * @returns {ProviderEntry[]}
   */
  findProvidersByType(providerType) {
    return this.read().providers.filter((p) => p.provider === providerType);
  }

  // ─── Skill 快捷方法 ────────────────────────────────────────

  /**
   * 获取 skills 配置
   * @returns {SkillsConfig}
   */
  getSkills() {
    return this.read().skills;
  }

  /**
   * 设置 skills 配置
   * @param {SkillsConfig} skills
   */
  setSkills(skills) {
    this.update((data) => {
      data.skills = skills;
      return data;
    });
  }

  // ─── 官方 API Key ──────────────────────────────────────────

  /**
   * 获取官方 API key
   * @returns {string}
   */
  getOfficialApiKey() {
    return this.read().official_api_key;
  }

  /**
   * 设置官方 API key
   * @param {string} apiKey
   */
  setOfficialApiKey(apiKey) {
    this.update((data) => {
      data.official_api_key = apiKey;
      return data;
    });
  }
}

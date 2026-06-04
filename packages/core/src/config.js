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
 * @typedef {import('./types.js').OfficialKeyEntry} OfficialKeyEntry
 * @typedef {import('./types.js').StoreData} StoreData
 * @typedef {import('./types.js').SkillsConfig} SkillsConfig
 */

/** @type {StoreData} 默认存储骨架 */
const DEFAULT_STORE = {
  official_keys: [],
  providers: [],
  skills: {
    enabled: true,
    installed: [],
  },
};

export class ConfigEngine {
  /**
   * @param {string} [storePath] - 显式指定的 store.json 路径
   */
  constructor(storePath) {
    this._path = storePath || ConfigEngine.detectPath();
  }

  // ─── 路径探测 ──────────────────────────────────────────────

  static detectPath() {
    const cwd = join(process.cwd(), 'store.json');
    if (existsSync(cwd)) return cwd;
    const home = join(homedir(), '.codewhale', 'store.json');
    if (existsSync(home)) return home;
    return cwd;
  }

  /** @returns {string} */
  get path() { return this._path; }

  // ─── 读写核心 ──────────────────────────────────────────────

  /** @returns {StoreData} */
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

  /** @param {StoreData} data */
  write(data) {
    this._backup();
    const dir = dirname(this._path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this._path, JSON.stringify(data, null, 2), 'utf-8');
  }

  /** @param {(data: StoreData) => StoreData} updater */
  update(updater) {
    const data = this.read();
    this.write(updater(data));
  }

  _backup() {
    if (existsSync(this._path)) copyFileSync(this._path, this._path + '.bak');
  }

  _mergeDefaults(data) {
    const def = JSON.parse(JSON.stringify(DEFAULT_STORE));
    return {
      official_keys: Array.isArray(data.official_keys) ? data.official_keys : def.official_keys,
      providers: Array.isArray(data.providers) ? data.providers : def.providers,
      skills: {
        enabled: data.skills?.enabled ?? def.skills.enabled,
        installed: Array.isArray(data.skills?.installed) ? data.skills.installed : def.skills.installed,
      },
    };
  }

  // ─── 官方 Key 方法 ─────────────────────────────────────────

  /** @returns {OfficialKeyEntry[]} */
  getOfficialKeys() { return this.read().official_keys; }

  /** @param {OfficialKeyEntry[]} keys */
  setOfficialKeys(keys) {
    this.update((d) => { d.official_keys = keys; return d; });
  }

  /** @param {string} id */
  findOfficialKey(id) {
    return this.read().official_keys.find((k) => k.id === id);
  }

  // ─── Provider 方法 ─────────────────────────────────────────

  /** @returns {ProviderEntry[]} */
  getProviders() { return this.read().providers; }

  /** @param {ProviderEntry[]} providers */
  setProviders(providers) {
    this.update((d) => { d.providers = providers; return d; });
  }

  /** @param {string} id */
  findProvider(id) {
    return this.read().providers.find((p) => p.id === id);
  }

  /** @param {string} providerType */
  findProvidersByType(providerType) {
    return this.read().providers.filter((p) => p.provider === providerType);
  }

  // ─── Skill 方法 ────────────────────────────────────────────

  /** @returns {SkillsConfig} */
  getSkills() { return this.read().skills; }

  /** @param {SkillsConfig} skills */
  setSkills(skills) {
    this.update((d) => { d.skills = skills; return d; });
  }
}

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

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { cloneDeep, defaultsDeep, get as lodashGet, set as lodashSet, find as lodashFind } from 'lodash-es';

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
    cached_at: 0
  }
};

/**
 * 原子写入：先写临时文件，再 rename 覆盖目标文件
 * 避免写入过程中进程崩溃导致文件损坏
 * @param {string} filePath 目标文件路径
 * @param {string} content 要写入的内容
 */
export function atomicWriteSync(filePath, content) {
  const tmpPath = filePath + '.tmp-' + randomUUID();
  try {
    writeFileSync(tmpPath, content, 'utf-8');
    renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export class ConfigEngine {
  /**
   * 创建配置引擎实例
   *
   * @param {string} [storePath] - 显式指定的 store.json 文件路径。如果省略，会自动探测路径。
   */
  constructor(storePath) {
    this._path = storePath || ConfigEngine.detectPath();
    this._cache = null;
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
  get path() {
    return this._path;
  }

  // ─── 读写核心 ──────────────────────────────────────────────

  /**
   * 从磁盘读取完整配置数据。
   *
   * 如果文件不存在或解析失败，会返回一个基于默认骨架的干净副本，避免程序因脏数据崩溃。
   *
   * @returns {StoreData} 当前存储的全部配置数据
   */
  read() {
    if (this._cache) {
      return cloneDeep(this._cache);
    }
    if (!existsSync(this._path)) {
      const result = cloneDeep(DEFAULT_STORE);
      this._cache = result;
      return result;
    }
    try {
      const data = JSON.parse(readFileSync(this._path, 'utf-8'));
      const result = this._mergeDefaults(data);
      this._cache = result;
      return result;
    } catch {
      const result = cloneDeep(DEFAULT_STORE);
      this._cache = result;
      return result;
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
    atomicWriteSync(this._path, JSON.stringify(data, null, 2));
    this._cache = cloneDeep(data);
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
   * 读取缓存数据（如果可用）。
   *
   * 优先返回内存中的缓存副本，避免重复磁盘 I/O。
   * 如果缓存不存在，则回退到 read() 并填充缓存。
   *
   * @returns {StoreData} 当前存储的全部配置数据
   */
  readCached() {
    if (!this._cache) {
      this.read();
    }
    return cloneDeep(this._cache);
  }

  /**
   * 清除内存缓存，强制下一次 read() 从磁盘重新加载。
   */
  clearCache() {
    this._cache = null;
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
   * 采用 schema-driven 设计：新增字段只需在 STORE_SCHEMA / SKILLS_SCHEMA 中声明，
   * 无需修改本方法的合并逻辑。
   *
   * @param {StoreData} data 从文件读取的原始数据
   * @returns {StoreData} 补齐默认值后的完整数据
   */
  _mergeDefaults(data) {
    const result = defaultsDeep({}, data, DEFAULT_STORE);
    if (!result.locale) {
      result.locale = DEFAULT_STORE.locale;
    }
    return result;
  }
  // ─── 通用属性访问 ──────────────────────────────────────────────

  /**
   * 使用 lodash get 读取嵌套属性，避免重复 this.read() 调用。
   * @param {string} path - lodash 属性路径，如 'providers' 或 'project_skills.xxx'
   * @returns {*} 属性值
   */
  get(path) {
    return lodashGet(this.read(), path);
  }

  /**
   * 使用 lodash set 写入嵌套属性，通过 update 保证原子性。
   * @param {string} path - lodash 属性路径
   * @param {*} value - 要设置的值
   */
  set(path, value) {
    this.update((d) => {
      lodashSet(d, path, value);
      return d;
    });
  }

  /**
   * 使用 lodash find 在集合中查找第一个匹配项。
   * @param {string} path - 集合属性路径
   * @param {Function} predicate - 判断函数
   * @returns {*|undefined}
   */
  find(path, predicate) {
    return lodashFind(this.get(path), predicate);
  }
}

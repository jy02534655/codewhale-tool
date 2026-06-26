/**
 * ProjectSkillEngine — 项目级 skill 存储引擎
 *
 * 管理项目根目录下的 .codewhale/skills.json 文件。
 * 与 ConfigEngine 结构一致但作用于不同文件，
 * 让项目可以独立维护自己的 skill 注册表。
 *
 * 路径探测：
 *   1. 显式传入的路径
 *   2. 从当前工作目录向上查找 .codewhale/skills.json
 *   3. 不存在则返回当前目录 .codewhale/skills.json
 *
 * @module project-skill
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

/**
 * @typedef {import('../types.js').SkillsConfig} SkillsConfig
 */

/** @type {SkillsConfig} 默认项目 skill 配置 */
const DEFAULT_SKILLS = {
  enabled: true,
  installed: [],
};

export class ProjectSkillEngine {
  /**
   * @param {string} [projectPath] - 显式指定的项目根目录或 skills.json 路径
   */
  constructor(projectPath) {
    this._path = projectPath
      ? (projectPath.endsWith('skills.json') ? projectPath : join(projectPath, '.codewhale', 'skills.json'))
      : ProjectSkillEngine.detectPath();
  }

  // ─── 路径探测 ──────────────────────────────────────────────

  /**
   * 从当前工作目录向上查找 .codewhale/skills.json
   * @returns {string}
   */
  static detectPath() {
    const cwd = process.cwd();
    let dir = cwd;
     
    while (true) {
      const candidate = join(dir, '.codewhale', 'skills.json');
      if (existsSync(candidate)) return candidate;
      const parent = resolve(dir, '..');
      if (parent === dir) break; // 到达根目录
      dir = parent;
    }
    // 没找到则回退到当前目录
    return join(cwd, '.codewhale', 'skills.json');
  }

  /** @returns {string} */
  get path() { return this._path; }

  // ─── 读写核心 ──────────────────────────────────────────────

  /** @returns {SkillsConfig} */
  read() {
    if (!existsSync(this._path)) {
      return JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    }
    try {
      const data = JSON.parse(readFileSync(this._path, 'utf-8'));
      return this._mergeDefaults(data);
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_SKILLS));
    }
  }

  /** @param {SkillsConfig} data */
  write(data) {
    this._backup();
    const dir = dirname(this._path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this._path, JSON.stringify(data, null, 2), 'utf-8');
  }

  /** @param {(data: SkillsConfig) => SkillsConfig} updater */
  update(updater) {
    const data = this.read();
    this.write(updater(data));
  }

  _backup() {
    if (existsSync(this._path)) copyFileSync(this._path, this._path + '.bak');
  }

  _mergeDefaults(data) {
    return {
      enabled: data.enabled ?? true,
      installed: Array.isArray(data.installed) ? data.installed : [],
    };
  }

  // ─── Skill 方法 ────────────────────────────────────────────

  /** @returns {import('../types.js').SkillEntry[]} */
  getInstalled() {
    return this.read().installed;
  }

  /** @param {import('./types.js').SkillEntry[]} installed */
  setInstalled(installed) {
    this.update((d) => { d.installed = installed; return d; });
  }

  /** @param {string} id @returns {import('../types.js').SkillEntry|undefined} */
  find(id) {
    return this.read().installed.find((s) => s.id === id);
  }

  /**
   * 获取当前项目信息
   * @returns {{name: string, path: string, skills_count: number}}
   */
  getProjectInfo() {
    const p = this._path;
    const parts = p.split(/[/\\]/);
    const idx = parts.indexOf('.codewhale');
    const name = idx > 0 ? parts[idx - 1] : 'unknown';
    return { name, path: p, skills_count: this.getInstalled().length };
  }
}
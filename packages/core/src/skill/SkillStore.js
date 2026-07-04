/**
 * SkillStore — Skill 数据持久化层
 *
 * 集中管理所有 skill 配置的读写、查询、变更和安装待办。
 * 是 SkillManager 和子模块之间的唯一数据通道。
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { okMsg, failMsg } from '../utils/result.js';

export class SkillStore {
  /**
   * @param {ConfigEngine} engine
   * @param {any} [projectEngine]
   * @param {string} [skillsDir]
   */
  constructor(engine, projectEngine, skillsDir) {
    this.engine = engine;
    this.projectEngine = projectEngine || null;
    this.skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    this.projectSkillsDir = 'skills';
    this._pendingInstalls = new Map();
  }

  // ------------------------------------------------------------------ //
  // skills.json — 项目级 skill 配置读写
  // ------------------------------------------------------------------ //

  /** @returns {string} */
  _skillsJsonPath() {
    return join(process.cwd(), 'data', 'skills.json');
  }

  /**
   * @returns {Object[]}
   */
  readSkillsJson() {
    const path = this._skillsJsonPath();
    if (!existsSync(path)) return [];
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      return Array.isArray(data.installed) ? data.installed : [];
    } catch {
      return [];
    }
  }

  /**
   * @param {Object[]} entries
   */
  writeSkillsJson(entries) {
    const path = this._skillsJsonPath();
    let data = { enabled: true, installed: [] };
    if (existsSync(path)) {
      try { data = JSON.parse(readFileSync(path, 'utf-8')); } catch { /* 从头开始 */ }
    }
    data.installed = entries;
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ------------------------------------------------------------------ //
  // 查询方法
  // ------------------------------------------------------------------ //

  /** @returns {Object[]} */
  getGlobalInstalled() {
    return (this.engine.getSkills().installed || []).slice();
  }

  /** @returns {Object[]} */
  getProjectInstalled() {
    if (this.projectEngine) {
      return this.projectEngine.getInstalled().slice();
    }
    return this.readSkillsJson();
  }

  /**
   * @param {string} level
   * @returns {Object[]}
   */
  getLevelInstalled(level) {
    return level === 'project' ? this.getProjectInstalled() : this.getGlobalInstalled();
  }

  /**
   * @param {string} skillId
   * @param {string} [level]
   * @returns {Object|null}
   */
  findEntry(skillId, level) {
    if (level === 'global') return this.getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (level === 'project') return this.getProjectInstalled().find((s) => s.id === skillId) || null;
    let entry = this.getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (!entry) {
      entry = this.getProjectInstalled().find((s) => s.id === skillId) || null;
    }
    return entry;
  }

  /**
   * @param {string} rootDir
   * @param {string} skillId
   * @returns {string|null}
   */
  findSkillDir(rootDir, skillId) {
    if (!existsSync(rootDir)) return null;
    const parts = skillId.split('/');
    let current = rootDir;
    for (const part of parts) {
      const joined = join(current, part);
      if (!existsSync(joined)) return null;
      current = joined;
    }
    if (existsSync(join(current, 'SKILL.md'))) return current;
    return null;
  }

  // ------------------------------------------------------------------ //
  // 变更方法
  // ------------------------------------------------------------------ //

  /**
   * @param {string} level
   * @param {Object[]} entries
   */
  setLevelInstalled(level, entries) {
    if (level === 'project') {
      if (this.projectEngine) {
        this.projectEngine.setInstalled(entries);
      } else {
        this.writeSkillsJson(entries);
      }
    } else {
      const skillsCfg = this.engine.getSkills();
      skillsCfg.installed = entries;
      this.engine.setSkills(skillsCfg);
    }
  }

  /**
   * @param {Object} entry
   * @param {string} level
   */
  addToConfig(entry, level) {
    if (level === 'project') {
      if (this.projectEngine) {
        const installed = this.projectEngine.getInstalled();
        installed.push(entry);
        this.projectEngine.setInstalled(installed);
      } else {
        const installed = this.readSkillsJson();
        installed.push(entry);
        this.writeSkillsJson(installed);
      }
    } else {
      const skillsCfg = this.engine.getSkills();
      const installed = skillsCfg.installed || [];
      installed.push(entry);
      skillsCfg.installed = installed;
      this.engine.setSkills(skillsCfg);
    }
  }

  /**
   * 核心变更入口 — 查找、执行回调、持久化
   * @param {string} skillId
   * @param {Function} fn — (entries, idx, entry, level, engine) => result
   * @param {string} [hintLevel]
   */
  mutate(skillId, fn, hintLevel) {
    if (hintLevel) {
      const engine = hintLevel === 'project' ? (this.projectEngine || this.engine) : this.engine;
      const entries = this.getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = fn(entries, idx, entries[idx], hintLevel, engine);
      this.setLevelInstalled(hintLevel, entries);
      return result;
    }

    const globalEntries = this.getGlobalInstalled();
    const idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this.engine);
      this.setLevelInstalled('global', globalEntries);
      return result;
    }
    const projectEntries = this.getProjectInstalled();
    const pIdx = projectEntries.findIndex((s) => s.id === skillId);
    if (pIdx !== -1) {
      const result = fn(projectEntries, pIdx, projectEntries[pIdx], 'project', this.engine);
      this.setLevelInstalled('project', projectEntries);
      return result;
    }
    return failMsg('SKILL_NOT_FOUND');
  }

  /**
   * @param {string} skillId
   * @param {boolean} enabled
   * @param {string} [hintLevel]
   */
  toggle(skillId, enabled, hintLevel) {
    return this.mutate(skillId, function (entries, idx) {
      entries[idx].enabled = enabled;
      return okMsg('updated');
    }, hintLevel);
  }

  // ------------------------------------------------------------------ //
  // 安装待办
  // ------------------------------------------------------------------ //

  /**
   * @param {Object} opts
   * @returns {string} streamId
   */
  createPendingInstall(opts) {
    const streamId = randomUUID();
    this._pendingInstalls.set(streamId, { ...opts, createdAt: Date.now() });
    return streamId;
  }

  createPendingUpdate(opts) {
    if (!opts || !opts.skillId) {
      throw new Error('skillId is required');
    }
    return this.createPendingInstall(opts);
  }

  /**
   * @param {string} streamId
   * @returns {Object|undefined}
   */
  getPendingInstall(streamId) {
    const pending = this._pendingInstalls.get(streamId);
    if (!pending) return undefined;
    this._pendingInstalls.delete(streamId);
    return pending;
  }

  // ------------------------------------------------------------------ //
  // 文件系统工具
  // ------------------------------------------------------------------ //

  /**
   * @param {string} src
   * @param {string} dst
   */
  copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const dstPath = join(dst, entry.name);
      if (entry.isDirectory()) {
        this.copyDir(srcPath, dstPath);
      } else {
        copyFileSync(srcPath, dstPath);
      }
    }
  }
}
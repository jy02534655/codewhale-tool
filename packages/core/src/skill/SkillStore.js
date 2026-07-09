/**
 * SkillStore — Skill 数据持久化层
 *
 * 集中管理所有 skill 配置的读写、查询、变更和安装待办。
 * 是 SkillManager 和子模块之间的唯一数据通道。
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { failMsg } from '../utils/result.js';
import { _extractMeta } from './shared.js';

export class SkillStore {
  /**
   * @param {ConfigEngine} engine
   * @param {string} [skillsDir]
   */
  constructor(engine, skillsDir) {
    this.engine = engine;
    this.skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    this.projectSkillsDir = 'skills';
    this._pendingInstalls = new Map();
  }

  // ------------------------------------------------------------------ //
  // 查询方法
  // ------------------------------------------------------------------ //

  /** @returns {string|null} */
  getCurrentProjectId() {
    if (this.engine.projectManager) {
      return this.engine.projectManager.getDefaultProjectId();
    }
    return null;
  }

  /**
   * @param {string} projectPath
   * @returns {string|null}
   */
  getProjectIdByPath(projectPath) {
    if (!projectPath || !this.engine.projectManager) return null;
    return this.engine.projectManager.findProjectByPath(projectPath);
  }

  /**
   * @param {string} [projectId]
   * @returns {Object[]}
   */
  getProjectInstalled(projectId) {
    const targetProjectId = projectId || this.getCurrentProjectId();
    if (!targetProjectId) return [];
    return (this.engine.getProjectSkills(targetProjectId).installed || []).slice();
  }

  /** @returns {Object[]} */
  getGlobalInstalled() {
    return (this.engine.getSkills().installed || []).slice();
  }

  /**
   * @param {string} level
   * @param {string} [projectId]
   * @returns {Object[]}
   */
  getLevelInstalled(level, projectId) {
    return level === 'project' ? this.getProjectInstalled(projectId) : this.getGlobalInstalled();
  }

  /**
   * @param {string} skillId
   * @param {string} [level]
   * @param {string} [projectId]
   * @returns {Object|null}
   */
  findEntry(skillId, level, projectId) {
    if (level === 'global') {
      let entry = this.getGlobalInstalled().find((s) => s.id === skillId) || null;
      if (!entry) entry = this._resolveLocalEntry(skillId, level, projectId);
      return entry;
    }
    if (level === 'project') {
      let entry = this.getProjectInstalled(projectId).find((s) => s.id === skillId) || null;
      if (!entry) entry = this._resolveLocalEntry(skillId, level, projectId);
      return entry;
    }
    let entry = this.getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (!entry) {
      entry = this.getProjectInstalled(projectId).find((s) => s.id === skillId) || null;
    }
    if (!entry) {
      entry = this._resolveLocalEntry(skillId, 'global', projectId) || this._resolveLocalEntry(skillId, 'project', projectId) || null;
    }
    return entry;
  }

  /**
   * 解析手动安装在目录下但未注册到 store 的 skill
   * @param {string} skillId
   * @param {string} level
   * @param {string} [projectId]
   * @returns {Object|null}
   */
  _resolveLocalEntry(skillId, level, projectId) {
    if (!skillId.startsWith('local-')) return null;
    const rest = skillId.slice(6);
    if (!rest) return null;

    if (level === 'global') {
      const skillPath = join(this.skillsDir, rest);
      if (!existsSync(join(skillPath, 'SKILL.md'))) return null;
      const meta = _extractMeta(skillPath);
      return {
        id: skillId,
        slug: rest,
        name: meta.name,
        description: meta.description,
        path: skillPath,
        enabled: true,
        source: 'local',
      };
    }

    if (level === 'project') {
      let projectPath = null;
      if (projectId && this.engine.projectManager) {
        const projects = this.engine.getProjects();
        const project = projects.find(function (p) { return p.id === projectId; });
        if (project) projectPath = project.path;
      }
      if (!projectPath) projectPath = process.cwd();

      let slug = rest;
      if (projectId) {
        const prefix = projectId + '-';
        if (rest.startsWith(prefix)) {
          slug = rest.slice(prefix.length);
        }
      }
      if (!slug) return null;
      const skillPath = join(projectPath, this.projectSkillsDir, slug);
      if (!existsSync(join(skillPath, 'SKILL.md'))) return null;
      const meta = _extractMeta(skillPath);
      return {
        id: skillId,
        slug: slug,
        name: meta.name,
        description: meta.description,
        path: skillPath,
        enabled: true,
        source: 'local',
      };
    }

    return null;
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
   * @param {string} [projectId]
   */
  setLevelInstalled(level, entries, projectId) {
    if (level === 'project') {
      const targetProjectId = projectId || this.getCurrentProjectId();
      if (!targetProjectId) return;
      const current = this.engine.getProjectSkills(targetProjectId);
      this.engine.setProjectSkills(targetProjectId, { ...current, installed: entries });
    } else {
      const skillsCfg = this.engine.getSkills();
      skillsCfg.installed = entries;
      this.engine.setSkills(skillsCfg);
    }
  }

  /**
   * @param {Object} entry
   * @param {string} level
   * @param {string} [projectId]
   */
  addToConfig(entry, level, projectId) {
    if (level === 'project') {
      const targetProjectId = projectId || this.getCurrentProjectId();
      if (!targetProjectId) return;
      const current = this.engine.getProjectSkills(targetProjectId);
      const installed = (current.installed || []).slice();
      installed.push(entry);
      this.engine.setProjectSkills(targetProjectId, { ...current, installed });
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
   * @param {string} [projectId]
   */
  mutate(skillId, fn, hintLevel, projectId) {
    if (hintLevel) {
      const entries = this.getLevelInstalled(hintLevel, projectId);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = fn(entries, idx, entries[idx], hintLevel, this.engine);
      this.setLevelInstalled(hintLevel, entries, projectId);
      return result;
    }

    const globalEntries = this.getGlobalInstalled();
    const idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this.engine);
      this.setLevelInstalled('global', globalEntries);
      return result;
    }
    const projectEntries = this.getProjectInstalled(projectId);
    const pIdx = projectEntries.findIndex((s) => s.id === skillId);
    if (pIdx !== -1) {
      const result = fn(projectEntries, pIdx, projectEntries[pIdx], 'project', this.engine);
      this.setLevelInstalled('project', projectEntries, projectId);
      return result;
    }
    return failMsg('SKILL_NOT_FOUND');
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

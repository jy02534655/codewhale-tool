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
   * 构造 SkillStore 实例
   * @param {ConfigEngine} engine - 配置引擎，用于读写全局/项目级配置
   * @param {string} [skillsDir] - 全局 skill 安装目录，默认 ~/.codewhale/skills
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

  /**
   * 获取当前默认项目 ID
   * 如果项目引擎存在，返回默认项目 ID；否则返回 null
   * @returns {string|null}
   */
  getCurrentProjectId() {
    if (this.engine.projectManager) {
      return this.engine.projectManager.getDefaultProjectId();
    }
    return null;
  }

  /**
   * 根据项目路径查找项目 ID
   * @param {string} projectPath - 项目文件系统路径
   * @returns {string|null} 找到返回项目 ID，否则返回 null
   */
  getProjectIdByPath(projectPath) {
    if (!projectPath || !this.engine.projectManager) return null;
    return this.engine.projectManager.findProjectByPath(projectPath);
  }

  /**
   * 获取指定项目已安装的 skill 列表
   * @param {string} [projectId] - 项目 ID，默认当前项目
   * @returns {Object[]} 该项目的已安装 skill 条目数组
   */
  getProjectInstalled(projectId) {
    const targetProjectId = projectId || this.getCurrentProjectId();
    if (!targetProjectId) return [];
    return (this.engine.getProjectSkills(targetProjectId).installed || []).slice();
  }

  /**
   * 获取全局已安装的 skill 列表
   * @returns {Object[]} 全局已安装 skill 条目数组
   */
  getGlobalInstalled() {
    return (this.engine.getSkills().installed || []).slice();
  }

  /**
   * 根据级别（global/project）获取已安装 skill 列表
   * @param {string} level - 'global' 或 'project'
   * @param {string} [projectId] - 项目级时使用的项目 ID
   * @returns {Object[]} 对应级别的已安装 skill 条目数组
   */
  getLevelInstalled(level, projectId) {
    return level === 'project' ? this.getProjectInstalled(projectId) : this.getGlobalInstalled();
  }

  /**
   * 根据 skillId 查找 skill 条目
   * 查找策略：
   * 1. 如果指定了 level，只在该级别查找
   * 2. 如果未指定 level，先查全局，再查项目级
   * 3. 如果都没找到，尝试解析为本地手动安装的 skill（local- 前缀）
   * @param {string} skillId - skill 的唯一标识
   * @param {string} [level] - 'global' / 'project' / 不指定
   * @param {string} [projectId] - 项目 ID
   * @returns {Object|null} 找到返回 skill 条目对象，否则返回 null
   */
  findEntry(skillId, level, projectId) {
    if (level === 'global') {
      // 全局级别：先在全局已安装列表中查找
      let entry = this.getGlobalInstalled().find((s) => s.id === skillId) || null;
      if (!entry) entry = this._resolveLocalEntry(skillId, level, projectId);
      return entry;
    }
    if (level === 'project') {
      // 项目级别：先在项目已安装列表中查找
      let entry = this.getProjectInstalled(projectId).find((s) => s.id === skillId) || null;
      if (!entry) entry = this._resolveLocalEntry(skillId, level, projectId);
      return entry;
    }
    // 未指定级别：先查全局，再查项目级，最后查本地手动安装
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
   * 这类 skill 的 ID 以 'local-' 开头，表示是用户手动放到目录里的
   * @param {string} skillId - skill ID，必须以 'local-' 开头
   * @param {string} level - 'global' 或 'project'
   * @param {string} [projectId] - 项目 ID
   * @returns {Object|null} 找到返回 skill 条目对象，否则返回 null
   */
  _resolveLocalEntry(skillId, level, projectId) {
    if (!skillId.startsWith('local-')) return null;
    const rest = skillId.slice(6);
    if (!rest) return null;

    if (level === 'global') {
      // 全局本地 skill：直接放在全局 skills 目录下
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
      // 项目本地 skill：放在项目目录的 skills/ 子目录下
      let projectPath = null;
      if (projectId && this.engine.projectManager) {
        const projects = this.engine.getProjects();
        const project = projects.find(function (p) { return p.id === projectId; });
        if (project) projectPath = project.path;
      }
      if (!projectPath) projectPath = process.cwd();

      // 处理带项目 ID 前缀的 skill ID（如 project-abc-skill）
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
   * 在指定根目录下查找 skill 目录
   * 用于 ZIP 安装时定位 skill 在压缩包中的路径
   * @param {string} rootDir - 根目录路径
   * @param {string} skillId - skill ID，可能包含子目录路径（如 'owner/skill'）
   * @returns {string|null} 找到返回 skill 目录路径，否则返回 null
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
   * 设置指定级别的已安装 skill 列表
   * @param {string} level - 'global' 或 'project'
   * @param {Object[]} entries - 要设置的 skill 条目数组
   * @param {string} [projectId] - 项目 ID
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
   * 向指定级别的已安装列表中添加一个 skill 条目
   * @param {Object} entry - skill 条目对象
   * @param {string} level - 'global' 或 'project'
   * @param {string} [projectId] - 项目 ID
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
   * 核心变更入口
   * 根据 skillId 查找条目，执行回调函数修改数据，然后持久化
   * 查找顺序：
   * 1. 如果指定了 hintLevel，直接在该级别查找
   * 2. 否则先查全局，再查项目级
   * @param {string} skillId - 要变更的 skill ID
   * @param {Function} fn - 变更回调，签名为 (entries, idx, entry, level, engine) => result
   * @param {string} [hintLevel] - 提示的级别，用于快速定位
   * @param {string} [projectId] - 项目 ID
   * @returns {Object} 变更结果对象
   */
  mutate(skillId, fn, hintLevel, projectId) {
    if (hintLevel) {
      // 指定了级别，直接在该级别查找
      const entries = this.getLevelInstalled(hintLevel, projectId);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('skillNotFound');
      const result = fn(entries, idx, entries[idx], hintLevel, this.engine);
      this.setLevelInstalled(hintLevel, entries, projectId);
      return result;
    }

    // 未指定级别，先查全局
    const globalEntries = this.getGlobalInstalled();
    const idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this.engine);
      this.setLevelInstalled('global', globalEntries);
      return result;
    }
    // 再查项目级
    const projectEntries = this.getProjectInstalled(projectId);
    const pIdx = projectEntries.findIndex((s) => s.id === skillId);
    if (pIdx !== -1) {
      const result = fn(projectEntries, pIdx, projectEntries[pIdx], 'project', this.engine);
      this.setLevelInstalled('project', projectEntries, projectId);
      return result;
    }
    return failMsg('skillNotFound');
  }

  // ------------------------------------------------------------------ //
  // 安装待办
  // ------------------------------------------------------------------ //

  /**
   * 创建一个安装待办记录
   * 用于前端通过 SSE 流跟踪安装进度
   * @param {Object} opts - 安装选项
   * @returns {string} streamId - 用于跟踪安装进度的唯一标识
   */
  createPendingInstall(opts) {
    const streamId = randomUUID();
    this._pendingInstalls.set(streamId, { ...opts, createdAt: Date.now() });
    return streamId;
  }

  /**
   * 创建一个更新待办记录
   * 本质上也是安装待办，但要求必须提供 skillId
   * @param {Object} opts - 更新选项，必须包含 skillId
   * @returns {string} streamId
   */
  createPendingUpdate(opts) {
    if (!opts || !opts.skillId) {
      throw new Error('skillId is required');
    }
    return this.createPendingInstall(opts);
  }

  /**
   * 获取并消费一个安装待办记录
   * 获取后立即从 Map 中删除，确保待办只能被消费一次
   * @param {string} streamId - 待办 stream ID
   * @returns {Object|undefined} 待办选项对象，不存在返回 undefined
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
   * 递归复制整个目录
   * @param {string} src - 源目录路径
   * @param {string} dst - 目标目录路径
   */
  copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const dstPath = join(dst, entry.name);
      if (entry.isDirectory()) {
        // 递归复制子目录
        this.copyDir(srcPath, dstPath);
      } else {
        // 复制文件
        copyFileSync(srcPath, dstPath);
      }
    }
  }
}

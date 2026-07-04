/**
 * Skill 管理器
 * 对外保持 SkillManager 单类不变，内部按职责委托给子模块
 */

import { existsSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { ok, okMsg, failMsg, fail } from '../utils/result.js';
import * as Routes from './routes.js';
import * as Cmd from './cmd.js';
import * as Files from './files.js';
import * as Log from './log.js';
import * as Install from './install.js';
import { _extractMeta } from './shared.js';

export class SkillManager {
  /**
   * @param {ConfigEngine} engine
   * @param {any} [projectEngine]
   * @param {string} [skillsDir]
   */
  constructor(engine, projectEngine, skillsDir) {
    this._engine = engine;
    this._projectEngine = projectEngine || null;
    this._skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    this._projectSkillsDir = 'skills';
    this._pendingInstalls = new Map();
  }

  // ------------------------------------------------------------------ //
  // 内部辅助：读写 skills.json（CodeWhale 项目级 skill 配置文件）
  // ------------------------------------------------------------------ //

  /** @returns {string} skills.json 完整路径 */
  _skillsJsonPath() {
    return join(process.cwd(), 'data', 'skills.json');
  }

  /**
   * 读取 skills.json 中的项目 skill 列表
   * @returns {Object[]}
   */
  _readSkillsJson() {
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
   * 写入 skills.json 中的项目 skill 列表（保留已有字段）
   * @param {Object[]} entries
   */
  _writeSkillsJson(entries) {
    const path = this._skillsJsonPath();
    let data = { enabled: true, installed: [] };
    if (existsSync(path)) {
      try {
        data = JSON.parse(readFileSync(path, 'utf-8'));
      } catch { /* 从头开始 */ }
    }
    data.installed = entries;
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ------------------------------------------------------------------ //
  // 公共 API —— 按职责委托给子模块
  // ------------------------------------------------------------------ //

  listGlobal() {
    return Routes.listGlobal(this);
  }

  listProject() {
    return Routes.listProject(this);
  }

  getCurrentProject() {
    return Routes.getCurrentProject(this);
  }

  enable(skillId, hintLevel) {
    return Cmd.enable(this, skillId, hintLevel);
  }

  disable(skillId, hintLevel) {
    return Cmd.disable(this, skillId, hintLevel);
  }

  updateMeta(skillId, meta, hintLevel) {
    return Cmd.updateMeta(this, skillId, meta, hintLevel);
  }

  remove(skillId, hintLevel) {
    return Cmd.remove(this, skillId, hintLevel);
  }

  update(skillId, hintLevel) {
    return Cmd.update(this, skillId, hintLevel);
  }

  copyToProject(skillId) {
    return Cmd.copyToProject(this, skillId);
  }

  getSkillFiles(skillId, level) {
    return Files.getSkillFiles(this, skillId, level);
  }

  readSkillFile(skillId, filePath, level) {
    return Files.readSkillFile(this, skillId, filePath, level);
  }

  saveSkillFile(skillId, filePath, content, level) {
    return Files.saveSkillFile(this, skillId, filePath, content, level);
  }

  removeSkillFile(skillId, filePath, level) {
    return Files.removeSkillFile(this, skillId, filePath, level);
  }

  getReadme(skillId) {
    return Files.getReadme(this, skillId);
  }

  saveReadme(skillId, content) {
    return Files.saveReadme(this, skillId, content);
  }

  getInstallLog() {
    return Log.getInstallLog(this);
  }

  clearInstallLog() {
    return Log.clearInstallLog(this);
  }

  install(opts, onProgress, onLog) {
    return Install.install(this, opts, onProgress, onLog);
  }

  installFromZip(zipSource, skillPath, level, proxyConfig, onProgress) {
    return Install.installFromZip(this, zipSource, skillPath, level, proxyConfig, onProgress);
  }

  installFromZipStream(zipPath, skillName, level, proxyId, onProgress, onLog) {
    return Install.installFromZipStream(this, zipPath, skillName, level, proxyId, onProgress, onLog);
  }

  installFromGithubTreePath(githubUrl, level, proxyId, tokenId, onProgress, onLog) {
    return Install.installFromGithubTreePath(this, githubUrl, level, proxyId, tokenId, onProgress, onLog);
  }

  discover(level) {
    const result = { found: 0, added: 0, errors: [] };

    const scanFn = (dir, targetLevel) => {
      if (!existsSync(dir)) return;
      try {
        const names = readdirSync(dir, { withFileTypes: true });
        for (const dirent of names) {
          if (!dirent.isDirectory()) continue;
          const skillPath = join(dir, dirent.name);
          if (!existsSync(join(skillPath, 'SKILL.md'))) continue;
          result.found++;
          const installed = this._getLevelInstalled(targetLevel);
          if (installed.some((s) => s.id === dirent.name)) continue;
          const meta = _extractMeta(skillPath);
          const entry = {
            id: dirent.name, name: meta.name, description: meta.description,
            path: skillPath, enabled: true, source: 'local',
            installed_at: Date.now(), updated_at: Date.now(),
          };
          this._addToConfig(entry, targetLevel);
          result.added++;
        }
      } catch (err) {
        result.errors.push(`${dir}: ${err.message}`);
      }
    };

    if (!level || level === 'global') scanFn(this._skillsDir, 'global');
    if (!level || level === 'project') {
      scanFn(join(process.cwd(), this._projectSkillsDir), 'project');
    }

    return ok(result, getServerMessage('synced'));
  }

  // ------------------------------------------------------------------ //
  // 内部辅助方法 —— 不拆分，保留在类内供子模块通过 self 调用
  // ------------------------------------------------------------------ //

  /**
   * 同步执行 skill 配置变更
   * @param {string} skillId
   * @param {Function} fn
   * @param {string} [hintLevel]
   */
  _mutate(skillId, fn, hintLevel) {
    if (hintLevel) {
      const engine = hintLevel === 'project' ? (this._projectEngine || this._engine) : this._engine;
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = fn(entries, idx, entries[idx], hintLevel, engine);
      this._setLevelInstalled(hintLevel, entries);
      return result;
    }

    const globalEntries = this._getGlobalInstalled();
    let idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this._engine);
      this._setLevelInstalled('global', globalEntries);
      return result;
    }
    const projectEntries = this._getProjectInstalled();
    const pIdx = projectEntries.findIndex((s) => s.id === skillId);
    if (pIdx !== -1) {
      const result = fn(projectEntries, pIdx, projectEntries[pIdx], 'project', this._engine);
      this._setLevelInstalled('project', projectEntries);
      return result;
    }
    return failMsg('SKILL_NOT_FOUND');
  }

  /**
   * 切换 skill 启用状态
   * @param {string} skillId
   * @param {boolean} enabled
   * @param {string} [hintLevel]
   */
  _toggle(skillId, enabled, hintLevel) {
    return this._mutate(skillId, function (entries, idx) {
      entries[idx].enabled = enabled;
      return okMsg('updated');
    }, hintLevel);
  }

  /**
   * 按 skillId 查找已安装 skill 条目
   * @param {string} skillId
   * @param {string} [level]
   * @returns {Object|null}
   */
  _findEntry(skillId, level) {
    if (level === 'global') return this._getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (level === 'project') return this._getProjectInstalled().find((s) => s.id === skillId) || null;
    let entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (!entry) {
      entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
    }
    return entry;
  }

  /**
   * 获取全局已安装 skill 列表副本
   * @returns {Object[]}
   */
  _getGlobalInstalled() {
    return (this._engine.getSkills().installed || []).slice();
  }

  /**
   * 获取项目已安装 skill 列表副本
   * @returns {Object[]}
   */
  _getProjectInstalled() {
    if (this._projectEngine) {
      return this._projectEngine.getInstalled().slice();
    }
    return this._readSkillsJson();
  }

  /**
   * 按层级获取已安装 skill 列表
   * @param {string} level
   * @returns {Object[]}
   */
  _getLevelInstalled(level) {
    return level === 'project' ? this._getProjectInstalled() : this._getGlobalInstalled();
  }

  /**
   * 按层级设置已安装 skill 列表并同步到 store
   * @param {string} level
   * @param {Object[]} entries
   */
  _setLevelInstalled(level, entries) {
    if (level === 'project') {
      if (this._projectEngine) {
        this._projectEngine.setInstalled(entries);
      } else {
        this._writeSkillsJson(entries);
      }
    } else {
      const skillsCfg = this._engine.getSkills();
      skillsCfg.installed = entries;
      this._engine.setSkills(skillsCfg);
    }
  }

  /**
   * 向指定层级添加 skill 配置并同步到 store
   * @param {Object} entry
   * @param {string} level
   */
  _addToConfig(entry, level) {
    if (level === 'project') {
      if (this._projectEngine) {
        const installed = this._projectEngine.getInstalled();
        installed.push(entry);
        this._projectEngine.setInstalled(installed);
      } else {
        const installed = this._readSkillsJson();
        installed.push(entry);
        this._writeSkillsJson(installed);
      }
    } else {
      const skillsCfg = this._engine.getSkills();
      const installed = skillsCfg.installed || [];
      installed.push(entry);
      skillsCfg.installed = installed;
      this._engine.setSkills(skillsCfg);
    }
  }

  /**
   * 递归复制目录
   * @param {string} src
   * @param {string} dst
   */
  _copyDir(src, dst) {
    mkdirSync(dst, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const dstPath = join(dst, entry.name);
      if (entry.isDirectory()) {
        this._copyDir(srcPath, dstPath);
      } else {
        copyFileSync(srcPath, dstPath);
      }
    }
  }

  /**
   * 根据 skillId 查找目录中的 SKILL.md 所在目录
   * @param {string} rootDir
   * @param {string} skillId
   * @returns {string|null}
   */
  _findSkillDir(rootDir, skillId) {
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

  /**
   * 创建一个待安装任务并返回 streamId
   * @param {Object} opts - 安装选项
   * @returns {string} streamId
   */
  createPendingInstall(opts) {
    const streamId = randomUUID();
    this._pendingInstalls.set(streamId, {
      ...opts,
      createdAt: Date.now(),
    });
    return streamId;
  }

  /**
   * 获取并消费一个待安装任务
   * @param {string} streamId
   * @returns {Object|undefined}
   */
  getPendingInstall(streamId) {
    const pending = this._pendingInstalls.get(streamId);
    if (!pending) return undefined;
    this._pendingInstalls.delete(streamId);
    return pending;
  }

  get skillsDir() {
    return this._skillsDir;
  }
}
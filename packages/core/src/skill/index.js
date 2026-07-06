/**
 * Skill 管理器
 * 薄门面：委托给 SkillStore（数据层）和职责子模块（业务层）
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { ok, fail } from '../utils/result.js';
import { SkillStore } from './SkillStore.js';
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
    this._store = new SkillStore(engine, projectEngine, skillsDir);
  }

  // ------------------------------------------------------------------ //
  // 公共 API —— 按职责委托给子模块（传入 store）
  // ------------------------------------------------------------------ //

  listGlobal() { return Routes.listGlobal(this._store); }
  listProject() { return Routes.listProject(this._store); }
  getCurrentProject() { return Routes.getCurrentProject(this._store); }
  enable(skillId, hintLevel) { return Cmd.enable(this._store, skillId, hintLevel); }
  disable(skillId, hintLevel) { return Cmd.disable(this._store, skillId, hintLevel); }
  updateMeta(skillId, meta, hintLevel) { return Cmd.updateMeta(this._store, skillId, meta, hintLevel); }
  remove(skillId, hintLevel) { return Cmd.remove(this._store, skillId, hintLevel); }
  updateByOpts(opts, onProgress, onLog) { return Install.update(this._store, opts, onProgress, onLog); }
  copyToProject(skillId) { return Cmd.copyToProject(this._store, skillId); }
  getSkillFiles(skillId, level) { return Files.getSkillFiles(this._store, skillId, level); }
  readSkillFile(skillId, filePath, level) { return Files.readSkillFile(this._store, skillId, filePath, level); }
  saveSkillFile(skillId, filePath, content, level) { return Files.saveSkillFile(this._store, skillId, filePath, content, level); }
  removeSkillFile(skillId, filePath, level) { return Files.removeSkillFile(this._store, skillId, filePath, level); }
  getReadme(skillId) { return Files.getReadme(this._store, skillId); }
  saveReadme(skillId, content) { return Files.saveReadme(this._store, skillId, content); }
  getInstallLog() { return Log.getInstallLog(); }
  clearInstallLog() { return Log.clearInstallLog(); }
  install(opts, onProgress, onLog) { return Install.install(this._store, opts, onProgress, onLog); }
  installFromZip(zipSource, skillPath, level, proxyConfig, onProgress) {
    return Install.installFromZip(this._store, zipSource, skillPath, level, proxyConfig, onProgress);
  }
  installFromZipStream(zipPath, skillName, level, proxyId, onProgress, onLog) {
    return Install.installFromZipStream(this._store, zipPath, skillName, level, proxyId, onProgress, onLog);
  }
  installFromGithubTreePath(githubUrl, level, proxyId, tokenId, onProgress, onLog) {
    return Install.installFromGithubTreePath(this._store, githubUrl, level, proxyId, tokenId, onProgress, onLog);
  }

  // ------------------------------------------------------------------ //
  // 业务方法：自动发现 — 扫描目录并注册 skill
  // ------------------------------------------------------------------ //

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
          const installed = this._store.getLevelInstalled(targetLevel);
          if (installed.some((s) => s.slug === dirent.name)) continue;
          const meta = _extractMeta(skillPath);
          const entry = {
            id: randomUUID(), slug: dirent.name, name: meta.name, description: meta.description,
            path: skillPath, enabled: true, source: 'local',
            installed_at: Date.now(), updated_at: Date.now(),
          };
          this._store.addToConfig(entry, targetLevel);
          result.added++;
        }
      } catch (err) {
        result.errors.push(`${dir}: ${err.message}`);
      }
    };

    if (!level || level === 'global') scanFn(this._store.skillsDir, 'global');
    if (!level || level === 'project') {
      scanFn(join(process.cwd(), this._store.projectSkillsDir), 'project');
    }

    return ok(result, getServerMessage('synced'));
  }

  // ------------------------------------------------------------------ //
  // 安装待办代理（server 层直接调用）
  // ------------------------------------------------------------------ //

  createPendingInstall(opts) { return this._store.createPendingInstall(opts); }
  createPendingUpdate(opts) { return this._store.createPendingUpdate(opts); }
  getPendingInstall(streamId) { return this._store.getPendingInstall(streamId); }

  /**
   * 消费安装待办：获取 pending、校验存在性、按 skillId 分发 install/update
   * @param {string} streamId
   * @param {Function} [onProgress]
   * @param {Function} [onLog]
   */
  consumePendingInstall(streamId, onProgress, onLog) {
    const pending = this.getPendingInstall(streamId);
    if (!pending) {
      return fail('Stream not found', 'STREAM_NOT_FOUND');
    }
    if (pending.skillId) {
      return this.updateByOpts(pending, onProgress, onLog);
    }
    return this.install(pending, onProgress, onLog);
  }

  get skillsDir() { return this._store.skillsDir; }
}
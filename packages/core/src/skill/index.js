/**
 * Skill 管理器
 * 薄门面：委托给 SkillStore（数据层）和职责子模块（业务层）
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { ok, fail } from '../utils/result.js';
import { SkillStore } from './store.js';
import * as Routes from './routes.js';
import * as Cmd from './cmd.js';
import * as Files from './files.js';
import * as Log from './log.js';
import * as Install from './install.js';
import { _extractMeta } from './shared.js';

export class SkillManager {
  /**
   * 构造 SkillManager 实例
   * @param {ConfigEngine} engine - 配置引擎，用于读写全局/项目级配置
   * @param {any} [projectEngine] - 项目引擎（可选，兼容旧接口）
   * @param {string} [skillsDir] - 全局 skill 安装目录
   */
  constructor(engine, projectEngine, skillsDir) {
    this._store = new SkillStore(engine, skillsDir);
  }

  // ------------------------------------------------------------------ //
  // 公共 API —— 按职责委托给子模块（传入 store）
  // ------------------------------------------------------------------ //

  // 查询类操作：委托给 routes.js
  listGlobal() { return Routes.listGlobal(this._store); }
  listAllProjectSkills() { return Routes.listAllProjectSkills(this._store); }
  getCurrentProject() { return Routes.getCurrentProject(this._store); }

  // 变更类操作：委托给 cmd.js
  updateMeta(opts) { return Cmd.updateMeta(this._store, opts); }
  updateSortOrder(opts) { return Cmd.updateSortOrder(this._store, opts); }
  remove(opts) { return Cmd.remove(this._store, opts); }
  updateByOpts(opts, onProgress, onLog) { return Install.update(this._store, opts, onProgress, onLog); }
  copyToProject(opts) { return Cmd.copyToProject(this._store, opts); }

  // 文件操作：委托给 files.js
  getSkillFiles(opts) { return Files.getSkillFiles(this._store, opts); }
  readSkillFile(opts) { return Files.readSkillFile(this._store, opts); }
  saveSkillFile(opts) { return Files.saveSkillFile(this._store, opts); }
  removeSkillFile(opts) { return Files.removeSkillFile(this._store, opts); }
  getReadme(opts) { return Files.getReadme(this._store, opts); }
  saveReadme(opts) { return Files.saveReadme(this._store, opts); }

  // 日志操作：委托给 log.js
  getInstallLog() { return Log.getInstallLog(); }
  clearInstallLog() { return Log.clearInstallLog(); }

  // 安装操作：委托给 install.js
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

  /**
   * 自动发现并注册 skill
   * 扫描全局 skills 目录和项目 skills 目录，找到包含 SKILL.md 的子目录
   * 如果该 skill 未在 store 中注册，自动添加到配置中
   * @param {string} [level] - 扫描级别：'global' / 'project' / 不指定则全部扫描
   * @returns {Object} 包含 found（找到数量）、added（新增数量）、errors（错误列表）的结果对象
   */
  discover(level) {
    const result = { found: 0, added: 0, errors: [] };

    // 扫描指定目录，将符合条件的 skill 注册到 store
    const scanFn = (dir, targetLevel) => {
      if (!existsSync(dir)) return;
      try {
        const names = readdirSync(dir, { withFileTypes: true });
        for (const dirent of names) {
          // 只处理子目录
          if (!dirent.isDirectory()) continue;
          const skillPath = join(dir, dirent.name);
          // 只有包含 SKILL.md 的目录才被认为是 skill
          if (!existsSync(join(skillPath, 'SKILL.md'))) continue;
          result.found++;
          const installed = this._store.getLevelInstalled(targetLevel);
          // 跳过已注册的 skill
          if (installed.some((s) => s.slug === dirent.name)) continue;
          // 提取 SKILL.md 中的元数据
          const meta = _extractMeta(skillPath);
          const entry = {
            id: randomUUID(),
            slug: dirent.name,
            name: meta.name,
            description: meta.description,
            path: skillPath,
            enabled: true,
            source: 'local',
            installed_at: Date.now(),
            updated_at: Date.now(),
          };
          this._store.addToConfig(entry, targetLevel);
          result.added++;
        }
      } catch (err) {
        // 记录扫描过程中的错误，但不中断其他目录的扫描
        result.errors.push(`${dir}: ${err.message}`);
      }
    };

    // 扫描全局 skills 目录
    if (!level || level === 'global') scanFn(this._store.skillsDir, 'global');
    // 扫描项目 skills 目录
    if (!level || level === 'project') {
      scanFn(join(process.cwd(), this._store.projectSkillsDir), 'project');
    }

    return ok(result, getServerMessage('synced'));
  }

  // ------------------------------------------------------------------ //
  // 安装待办代理（server 层直接调用）
  // ------------------------------------------------------------------ //

  /**
   * 创建安装待办记录
   * @param {Object} opts - 安装选项
   * @returns {string} streamId - 用于 SSE 跟踪进度的唯一标识
   */
  createPendingInstall(opts) { return this._store.createPendingInstall(opts); }

  /**
   * 创建更新待办记录
   * @param {Object} opts - 更新选项，必须包含 skillId
   * @returns {string} streamId
   */
  createPendingUpdate(opts) { return this._store.createPendingUpdate(opts); }

  /**
   * 获取安装待办记录
   * @param {string} streamId - 待办 stream ID
   * @returns {Object|undefined} 待办选项对象
   */
  getPendingInstall(streamId) { return this._store.getPendingInstall(streamId); }

  /**
   * 消费安装待办
   * 根据待办中的 skillId 判断是安装还是更新，然后分发到对应方法
   * @param {string} streamId - 待办 stream ID
   * @param {Function} [onProgress] - 进度回调
   * @param {Function} [onLog] - 日志回调
   */
  consumePendingInstall(streamId, onProgress, onLog) {
    const pending = this.getPendingInstall(streamId);
    if (!pending) {
      return fail('Stream not found', 'STREAM_NOT_FOUND');
    }
    // 如果有 skillId，说明是更新操作；否则是全新安装
    if (pending.skillId) {
      return this.updateByOpts(pending, onProgress, onLog);
    }
    return this.install(pending, onProgress, onLog);
  }

  // 暴露 skillsDir 供外部访问
  get skillsDir() { return this._store.skillsDir; }
}

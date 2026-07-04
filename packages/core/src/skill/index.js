/**
 * Skill 管理器
 * 对外保持 SkillManager 单类不变，内部按职责委托给子模块
 */

import { ok, okMsg, failMsg, fail } from '../utils/result.js';
import { getServerMessage } from '../utils/i18n.js';

function createProxyEngine() {
  return {
    url: null,
    isActive: false,
    lastChecked: null,
    setProxy(url) {
      this.url = url;
      this.isActive = !!url;
      this.lastChecked = Date.now();
    },
    start() {
      // no-op
    },
    updateQueue() {
      // no-op
    },
  };
}
import { join } from 'node:path';
import { existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import * as Routes from './routes.js';
import * as Cmd from './cmd.js';
import * as Files from './files.js';
import * as Log from './log.js';
import * as Install from './install.js';
import { _extractMeta } from './shared.js';

export class SkillManager {
  /**
   * @param {ConfigEngine} engine
   * @param {string} [skillsDir]
   */
  constructor(engine, skillsDir) {
    this._engine = engine;
    this._skillsDir = skillsDir || join(process.cwd(), '.codewhale', 'skills');
    this._projectEngine = null;
    this._projectSkillsDir = '.codewhale/project-skills';
    this._installed = [];
    this._projectInstalled = [];
    this._mutateQueue = [];
    this._installedWatcher = null;
    this._proxy = createProxyEngine({ getEngine: () => this._engine });
    this.init().catch(() => {});
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
    if ((!level || level === 'project') && this._projectEngine) {
      scanFn(join(process.cwd(), this._projectSkillsDir), 'project');
    }

    return ok(result, getServerMessage('synced'));
  }

  // ------------------------------------------------------------------ //
  // 内部辅助方法 —— 不拆分，保留在类内供子模块通过 self 调用
  // ------------------------------------------------------------------ //

  /**
   * 同步执行 skill 配置变更（入队处理，避免并发冲突）
   * @param {string} skillId
   * @param {Function} fn
   * @param {string} [hintLevel]
   */
  _mutate(skillId, fn, hintLevel) {
    return this._mutateAsync(skillId, function (entries, idx, entry, level, engine) {
      const result = fn(entries, idx, entry, level, engine);
      if (result && typeof result.then === 'function') {
        return result.then(function () { return okMsg('synced'); });
      }
      return result;
    }, hintLevel);
  }

  /**
   * 异步执行 skill 配置变更（入队处理）
   * @param {string} skillId
   * @param {Function} fn
   * @param {string} [hintLevel]
   */
  async _mutateAsync(skillId, fn, hintLevel) {
    const self = this;
    await new Promise(function (resolve) {
      if (self._mutateQueue.length === 0) {
        self._mutateQueue.push({ skillId, fn, hintLevel, resolve });
        _processQueue(self);
      } else {
        self._mutateQueue.push({ skillId, fn, hintLevel, resolve });
      }
    });
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
    if (level === 'project') {
      return this._projectInstalled.find(function (s) { return s.id === skillId; }) || null;
    }
    return this._installed.find(function (s) { return s.id === skillId; }) || null;
  }

  /**
   * 获取全局已安装 skill 列表副本
   * @returns {Object[]}
   */
  _getGlobalInstalled() {
    return this._installed.slice();
  }

  /**
   * 获取项目已安装 skill 列表副本
   * @returns {Object[]}
   */
  _getProjectInstalled() {
    return this._projectInstalled.slice();
  }

  /**
   * 按层级获取已安装 skill 列表
   * @param {string} level
   * @returns {Object[]}
   */
  _getLevelInstalled(level) {
    if (level === 'project') return this._projectInstalled;
    return this._installed;
  }

  /**
   * 按层级设置已安装 skill 列表并同步到 store
   * @param {string} level
   * @param {Object[]} entries
   */
  _setLevelInstalled(level, entries) {
    if (level === 'project') {
      this._projectInstalled = entries;
    } else {
      this._installed = entries;
    }
    this._syncToStore();
  }

  /**
   * 向指定层级添加 skill 配置并同步到 store
   * @param {Object} entry
   * @param {string} level
   */
  _addToConfig(entry, level) {
    if (level === 'project') {
      this._projectInstalled.push(entry);
    } else {
      this._installed.push(entry);
    }
    this._syncToStore();
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

  // ------------------------------------------------------------------ //
  // 生命周期 & 存储同步
  // ------------------------------------------------------------------ //

  /**
   * 初始化：从 store 读取已安装列表到内存，并启动代理
   */
  async init() {
    const store = this._engine.read();
    this._installed = (store.skills?.installed || []).slice();
    this._projectInstalled = (store.skills?.project_installed || []).slice();
    // 兼容旧格式：如果 store 中没有全局 skill 数据，从 skills.json 迁移
    if (!this._installed.length) {
      try {
        const skillsJsonPath = join(process.cwd(), 'skills.json');
        if (fs.existsSync(skillsJsonPath)) {
          const content = fs.readFileSync(skillsJsonPath, 'utf8');
          const skillsData = JSON.parse(content);
          if (Array.isArray(skillsData.installed) && skillsData.installed.length) {
            this._installed = skillsData.installed.slice();
            store.skills = store.skills || {};
            store.skills.installed = this._installed.map(function (s) { return { ...s }; });
            this._engine.write(store);
          }
        }
      } catch (err) {
        // 忽略迁移错误
      }
    }
    await this._syncToStore();
    const proxies = this._engine.getProxies();
    const defaultProxy = proxies.find(p => p.default) || proxies[0];
    const proxyUrl = defaultProxy ? `${defaultProxy.type}://${defaultProxy.host}:${defaultProxy.port}` : null;
    this._proxy.setProxy(proxyUrl);
    this._proxy.start();
  }

  /**
   * 将内存中的 installed 列表同步到 store.json
   */
  _syncToStore() {
    const store = this._engine.read();
    if (!store.skills) store.skills = {};
    store.skills.installed = this._installed.map(function (s) {
      return { ...s };
    });
    if (this._projectEngine) {
      const info = this._projectEngine.getProjectInfo();
      store.skills.project_installed = this._projectInstalled.map(function (s) {
        return { ...s, project: info.name };
      });
    } else {
      store.skills.project_installed = this._projectInstalled.map(function (s) {
        return { ...s };
      });
    }
    this._engine.write(store);
  }

  /**
   * 更新代理配置
   * @param {string} url
   */
  setProxy(url) {
    if (!url || !this._proxy) return;
    this._proxy.url = url;
    this._proxy.updateQueue();
    this._syncToStore();
  }

  /**
   * 获取当前代理状态
   * @returns {Object|null}
   */
  getProxy() {
    if (!this._proxy) return null;
    return {
      url: this._proxy.url,
      isActive: this._proxy.isActive,
      lastChecked: this._proxy.lastChecked,
    };
  }
}

/**
 * 内部队列处理函数（不挂载到类上，避免污染公开 API）
 */
function _processQueue(self) {
  if (self._mutateQueue.length === 0) return;
  const task = self._mutateQueue[0];
  const skillId = task.skillId;
  const hintLevel = task.hintLevel;

  const allEntries = [
    ...self._installed.map(function (s) { return { ...s, __level: 'global' }; }),
    ...self._projectInstalled.map(function (s) { return { ...s, __level: 'project' }; }),
  ];

  let idx = allEntries.findIndex(function (s) { return s.id === skillId; });
  let targetLevel = hintLevel;

  if (idx === -1) {
    if (hintLevel === 'project') {
      targetLevel = 'project';
      idx = self._projectInstalled.findIndex(function (s) { return s.id === skillId; });
    } else {
      targetLevel = 'global';
      idx = self._installed.findIndex(function (s) { return s.id === skillId; });
    }
  }

  if (idx === -1) {
    task.resolve(failMsg('SKILL_NOT_FOUND'));
    self._mutateQueue.shift();
    if (self._mutateQueue.length > 0) _processQueue(self);
    return;
  }

  const levelEntries = targetLevel === 'project' ? self._projectInstalled : self._installed;
  const realIdx = levelEntries.findIndex(function (s) { return s.id === skillId; });
  const entry = levelEntries[realIdx];

  try {
    const result = task.fn(levelEntries, realIdx, entry, targetLevel, self._engine);
    const promise = result && typeof result.then === 'function' ? result : Promise.resolve(result);
    promise.then(
      function (res) {
        task.resolve(res);
        self._mutateQueue.shift();
        if (self._mutateQueue.length > 0) _processQueue(self);
      },
      function (err) {
        task.resolve(fail(err.message || String(err)));
        self._mutateQueue.shift();
        if (self._mutateQueue.length > 0) _processQueue(self);
      }
    );
  } catch (err) {
    task.resolve(fail(err.message || String(err)));
    self._mutateQueue.shift();
    if (self._mutateQueue.length > 0) _processQueue(self);
  }
}
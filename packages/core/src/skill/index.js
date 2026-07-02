/**
 * SkillManager — 双层 Skill 管理（全局 + 项目）
 *
 * Skill 存储架构：
 *   全局层 → store.json → skills.installed[] （由 ConfigEngine 管理）
 *   项目层 → .codewhale/skills.json → installed[]（由 ProjectSkillEngine 管理）
 *
 * Skill 文件位置：
 *   全局 → ~/.codewhale/skills/<skill-id>/SKILL.md
 *   项目 → <project>/skills/<skill-id>/SKILL.md
 *
 * 安装模式：
 *   - community：从 deepseek-ai/codewhale-skills 社区仓库安装（git clone --sparse）
 *   - github：从任意 GitHub 仓库安装（委托 downloadSkillFromGitHub）
 *   - zip：从 URL 或本地 ZIP 文件安装
 *   - registry：从 skills.sh 注册表标识符安装（解析后委托 github 模式）
 *
 * 所有消息已本地化，内部使用 getServerMessage() 获取当前语言。
 *
 * @module skill
 */

import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { ok, fail, failMsg, okMsg } from '../utils/result.js';
import AdmZip from 'adm-zip';
import { downloadSkillFromGitHub, downloadAndExtractZip, writeSkillLog } from '../download/index.js';

function emitSkillInstallLog(onLog, level, options) {
  if (options.message) {
    if (onLog) {
      onLog({ level, message: options.message });
    }
    writeSkillLog(level, options.message, undefined, { rawMessage: true });
    return;
  }

  const message = getServerMessage(options.key, options.params);
  if (onLog) {
    onLog({ level, message });
  }
  writeSkillLog(level, options.key, options.params, options.extra);
}

/** CodeWhale skill 社区仓库的基础 URL */
const SKILL_REPO_BASE = 'https://github.com/deepseek-ai/codewhale-skills';

/** 社区缓存有效期（24 小时，毫秒） */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * 从 SKILL.md 内容中提取名称和描述
 * @param {string} content
 * @returns {{name: string, description: string}}
 * @private
 */
function _parseReadmeMeta(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let description = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 首行 # 标题作为 name
    if (!name && line.startsWith('# ')) {
      name = line.slice(2).trim();
      continue;
    }
    // 第一个非标题、非空行作为 description
    if (name && !description && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('---')) {
      description = line;
      break;
    }
  }

  // 如果没有 # 标题，用首行做 name
  if (!name) name = lines[0] || '';
  return { name, description };
}

/**
 * 从磁盘读取 SKILL.md 并提取元数据
 * @param {string} skillPath - skill 目录路径
 * @returns {{name: string, description: string}}
 * @private
 */
function _extractMeta(skillPath) {
  const readmePath = join(skillPath, 'SKILL.md');
  if (!existsSync(readmePath)) return { name: basename(skillPath), description: '' };
  try {
    const content = readFileSync(readmePath, 'utf-8');
    return _parseReadmeMeta(content);
  } catch {
    return { name: basename(skillPath), description: '' };
  }
}

/**
 * 解析 GitHub URL 中的 owner 和 repo
 * @param {string} repoUrl - 如 https://github.com/vercel-labs/skills
 * @returns {{owner: string, repo: string}|null}
 * @private
 */
function _parseGitHubUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * 将代理 URL 字符串解析为结构化代理配置
 * @param {string} proxyUrl - 如 socks5://127.0.0.1:1080
 * @returns {{type: string, host: string, port: number, auth?: {username: string, password: string}}|undefined}
 * @private
 */
function _parseProxyUrl(proxyUrl) {
  if (!proxyUrl) return undefined;
  try {
    const url = new URL(proxyUrl);
    const type = proxyUrl.startsWith('http') ? 'http' : 'socks5';
    return {
      type,
      host: url.hostname,
      port: parseInt(url.port) || (type === 'http' ? 80 : 1080),
      auth: url.username
        ? { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) }
        : undefined,
    };
  } catch {
    return undefined;
  }
}

export class SkillManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   * @param {import('./project.js').ProjectSkillEngine} [projectEngine]
   * @param {string} [skillsDir]
   */
  constructor(engine, projectEngine, skillsDir) {
    this._engine = engine;
    this._projectEngine = projectEngine || null;
    this._skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    this._projectSkillsDir = 'skills';
  }

  // ─── 列表查询 ───────────────────────────────────────────────

  listAll() {
    const global = this._getGlobalInstalled().map((s) => ({ ...s, level: 'global' }));
    const project = this._getProjectInstalled().map((s) => ({ ...s, level: 'project' }));
    return ok([...global, ...project]);
  }

  listGlobal() {
    return ok(this._getGlobalInstalled());
  }

  listProject() {
    const list = this._getProjectInstalled();
    if (this._projectEngine) {
      const info = this._projectEngine.getProjectInfo();
      return ok(list.map(function (s) { return { ...s, project: info.name }; }));
    }
    return ok(list);
  }

  // ─── 单 Skill 操作 ──────────────────────────────────────────

  show(skillId, level) {
    let entry;
    let resolvedLevel;

    if (level === 'global') {
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'global';
    } else if (level === 'project') {
      entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'project';
    } else {
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'global';
      if (!entry && this._projectEngine) {
        entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
        resolvedLevel = entry ? 'project' : null;
      }
    }

    if (!entry) return failMsg('SKILL_NOT_FOUND');

    let readme = '';
    if (existsSync(join(entry.path, 'SKILL.md'))) {
      readme = readFileSync(join(entry.path, 'SKILL.md'), 'utf-8');
    }

    return ok({ entry, readme, level: resolvedLevel });
  }

  updateRemark(skillId, remark, hintLevel) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].remark = remark;
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
  }

  updateTags(skillId, tags, hintLevel) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].tags = tags;
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
  }

  updateAlias(skillId, alias, hintLevel) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].alias = alias;
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
  }

  updateMeta(skillId, meta, hintLevel) {
    return this._mutate(skillId, (entries, idx) => {
      if (meta.name != null) entries[idx].name = meta.name;
      if (meta.description != null) entries[idx].description = meta.description;
      if (meta.alias != null) entries[idx].alias = meta.alias;
      if (meta.remark != null) entries[idx].remark = meta.remark;
      if (meta.tags != null) entries[idx].tags = meta.tags;
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
  }

  enable(skillId, hintLevel) {
    return this._toggle(skillId, true, hintLevel);
  }

  disable(skillId, hintLevel) {
    return this._toggle(skillId, false, hintLevel);
  }

  enableAll(level) {
    const entries = this._getLevelInstalled(level || 'global');
    for (const e of entries) e.enabled = true;
    this._setLevelInstalled(level || 'global', entries);
    return okMsg('updated');
  }

  disableAll(level) {
    const entries = this._getLevelInstalled(level || 'global');
    for (const e of entries) e.enabled = false;
    this._setLevelInstalled(level || 'global', entries);
    return okMsg('updated');
  }

  // ─── 安装 ───────────────────────────────────────────────────

  /**
   * 从社区仓库安装一个 skill（内部委托到 installFromGitHub）
   * @param {string} skillId - 社区 skill 名称
   * @param {'global'|'project'} [level='global']
   * @param {Function} [onProgress]
   * @returns {Promise<{success: boolean, data?: any, message?: string}>}
   */
  async install(skillId, level, onProgress) {
    const repoUrl = `${SKILL_REPO_BASE}`;
    return this.installFromGitHub(repoUrl, skillId, level, null, onProgress);
  }

  /**
   * 从任意 GitHub 仓库安装 skill
   * 兼容新旧两种调用方式：
   *   旧: installFromGitHub(repoUrl, skillPath, level, proxyUrl, onProgress)
   *   新: installFromGitHub(opts, onProgress, onLog)
   */
  async installFromGitHub(repoUrl, skillPath, level, proxyUrl, onProgress) {
    // 兼容新方式：参数为对象
    if (typeof repoUrl === 'object' && repoUrl !== null) {
      return this._installFromGitHubV2(repoUrl, skillPath, level);
    }

    const proxyConfig = proxyUrl ? _parseProxyUrl(proxyUrl) : undefined;
    return this._installFromGitHubV2({
      repoUrl, skillPath, level, proxyConfig,
    }, onProgress, undefined);
  }

  /**
   * V2 安装入口（统一方式）
   */
  async _installFromGitHubV2({ repoUrl, skillPath, level, proxyId, tokenId, proxyConfig } = {}, progressCb, logCb) {
    const targetLevel = level || 'global';
    const onProgress = progressCb;
    const onLog = logCb;

    const parsed = _parseGitHubUrl(repoUrl);
    if (!parsed) return failMsg('SKILL_INVALID_REPO_URL');

    const skillId = skillPath ? basename(skillPath) : parsed.repo;
    const targetDir = targetLevel === 'project'
      ? join(process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    const installed = this._getLevelInstalled(targetLevel);
    if (installed.some((s) => s.id === skillId)) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    try {
      if (onProgress) {
        onProgress({ stage: 'connecting', percent: 5, message: getServerMessage('SKILL_PROGRESS_CONNECTING_GITHUB') });
      }

      if (!proxyConfig && proxyId) {
        const proxyEntry = this._engine.findProxy(proxyId);
        if (proxyEntry) {
          proxyConfig = {
            type: proxyEntry.type,
            host: proxyEntry.host,
            port: proxyEntry.port,
            auth: proxyEntry.auth ? { username: proxyEntry.auth.username, password: proxyEntry.auth.password } : undefined,
          };
        }
      }

      let token;
      if (tokenId) {
        const tokenEntry = this._engine.findToken(tokenId);
        if (tokenEntry) token = tokenEntry.token;

      }

      await downloadSkillFromGitHub({
        repoUrl, skillName: skillPath || parsed.repo, destDir: targetDir,
        proxy: proxyConfig, token, onProgress, onLog,
      });

      if (onProgress) {
        onProgress({ stage: 'registering', percent: 90, message: getServerMessage('SKILL_PROGRESS_REGISTERING') });
      }

      const meta = _extractMeta(targetDir);
      this._addToConfig({
        id: skillId,
        name: meta.name || skillId,
        description: meta.description,
        path: targetDir,
        enabled: true,
        source: 'community',
        version: 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      }, targetLevel);

      if (onProgress) {
        onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
      }

      return okMsg('synced');
    } catch (err) {
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
      const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
      return fail(failMessage, 'SKILL_INSTALL_FAILED');
    }
  }

  /**
   * 从 ZIP 文件或 URL 安装 skill
   */
  async installFromZip(zipSource, skillPath, level, proxyUrl, onProgress) {
    const targetLevel = level || 'global';
    const skillId = skillPath ? basename(skillPath) : basename(zipSource).replace(/\.zip$/i, '') || 'skill';
    const targetDir = targetLevel === 'project'
      ? join(process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    const installed = this._getLevelInstalled(targetLevel);
    if (installed.some((s) => s.id === skillId)) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    try {
      const tempDir = join(tmpdir(), `skill-extract-${randomUUID()}`);
      let extractRoot;

      if (/^https?:\/\//i.test(zipSource)) {
        const proxyConfig = proxyUrl ? _parseProxyUrl(proxyUrl) : undefined;
        extractRoot = await downloadAndExtractZip(zipSource, tempDir, proxyConfig, onProgress);
      } else {
        // 本地 ZIP 文件
        const zip = new AdmZip(zipSource);
        zip.extractAllTo(tempDir, true);
        extractRoot = tempDir;
      }

      let sourceDir;
      if (skillPath) {
        sourceDir = this._findSkillDir(extractRoot, skillPath);
        if (!sourceDir) {
          try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
          return failMsg('SKILL_NOT_FOUND');
        }
      } else {
        sourceDir = extractRoot;
        if (!existsSync(join(sourceDir, 'SKILL.md'))) {
          try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
          return failMsg('SKILL_NOT_FOUND');
        }
      }

      if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });

      const meta = _extractMeta(sourceDir);
      this._copyDir(sourceDir, targetDir);

      this._addToConfig({
        id: skillId,
        name: meta.name,
        description: meta.description,
        path: targetDir,
        enabled: true,
        source: 'zip',
        version: 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      }, targetLevel);

      if (onProgress) {
        onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
      }

      try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
      return okMsg('synced');
    } catch (err) {
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
      const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
      return fail(failMessage, 'SKILL_INSTALL_FAILED');
    }
  }

  /**
   * 从 skills.sh 注册表标识符安装（解析后委托 installFromGitHub）
   */
  async installFromRegistry(registryId, level, proxyUrl, onProgress) {
    const repoUrl = `https://github.com/deepseek-ai/codewhale-skills`;
    return this.installFromGitHub(repoUrl, registryId, level, proxyUrl, onProgress);
  }

  /**
   * 从本地 ZIP 文件流式安装 skill（带 SSE 进度和日志）
   * @param {string} zipPath - 本地 ZIP 文件路径
   * @param {string} skillName - skill 名称（可选）
   * @param {'global'|'project'} [level='global']
   * @param {Function} [onProgress] - 进度回调
   * @param {Function} [onLog] - 日志回调
   * @returns {Promise<{success: boolean, data?: any, message?: string}>}
   */
  async installFromZipStream(zipPath, skillName, level, onProgress, onLog) {
    // 委派 installFromZip 完成实际安装
    // 通过 onProgress/onLog 实现 SSE 流式输出
    emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_PROGRESS_EXTRACTING' });
    const result = await this.installFromZip(zipPath, skillName, level, undefined, onProgress);
    if (result.success) {
      emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_PROGRESS_DONE' });
    } else {
      const failMessage = result.message || getServerMessage('SKILL_INSTALL_FAILED');
      emitSkillInstallLog(onLog, 'ERROR', { message: failMessage });
    }
    return result;
  }

  /**
   * 从 GitHub Tree URL 安装 skill（解析 URL 后委派 installFromGitHub）
   * 输入: https://github.com/owner/repo/tree/branch/path/to/skill
   * @param {string} githubUrl - 完整 GitHub tree URL
   * @param {'global'|'project'} [level='global']
   * @param {string} [proxyId] - 代理 ID
   * @param {string} [tokenId] - GitHub Token ID
   * @param {Function} [onProgress] - 进度回调
   * @param {Function} [onLog] - 日志回调
   * @returns {Promise<{success: boolean, data?: any, message?: string}>}
   */
  async installFromGithubTreePath(githubUrl, level, proxyId, tokenId, onProgress, onLog) {
    const { parseGithubTreeUrl } = await import('../download/utils.js');
    const parsed = parseGithubTreeUrl(githubUrl);
    if (!parsed) {
      return failMsg('SKILL_INVALID_REPO_URL');
    }

    const repoUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
    const skillPath = parsed.path;

    return this._installFromGitHubV2({
      repoUrl, skillPath, level, proxyId, tokenId,
    }, onProgress, onLog);
  }

  /**
   * 从本地目录安装 skill
   */
  installFromLocal(srcDir, skillName, level) {
    const targetLevel = level || 'global';
    const skillId = skillName || basename(srcDir);
    const targetDir = targetLevel === 'project'
      ? join(process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    if (!existsSync(join(srcDir, 'SKILL.md'))) return failMsg('SKILL_NOT_FOUND');

    const installed = this._getLevelInstalled(targetLevel);
    if (installed.some((s) => s.id === skillId)) return failMsg('SKILL_ALREADY_INSTALLED');

    try {
      if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
      this._copyDir(srcDir, targetDir);

      const meta = _extractMeta(targetDir);
      this._addToConfig({
        id: skillId,
        name: meta.name,
        description: meta.description,
        path: targetDir,
        enabled: true,
        source: 'local',
        version: 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      }, targetLevel);

      return okMsg('synced');
    } catch (err) {
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
      const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
      return fail(failMessage, 'SKILL_INSTALL_FAILED');
    }
  }

  /**
   * 从已安装列表移除 skill（不删除文件目录）
   */
  uninstall(skillId, hintLevel) {
    return this._mutate(skillId, (entries, idx, entry, level) => {
      entries.splice(idx, 1);
      this._setLevelInstalled(level, entries);
      return okMsg('synced');
    }, hintLevel);
  }

  /**
   * 删除 skill（从配置中移除并删除磁盘上对应的 skill 文件目录）
   */
  remove(skillId, hintLevel) {
    return this._mutate(skillId, (entries, idx, entry, level) => {
      // 删除磁盘上的 skill 文件目录
      try {
        if (existsSync(entry.path)) {
          rmSync(entry.path, { recursive: true, force: true });
        }
      } catch {
        // 文件删除失败不阻塞配置移除操作
      }
      entries.splice(idx, 1);
      this._setLevelInstalled(level, entries);
      return okMsg('synced');
    }, hintLevel);
  }

  /**
   * 更新社区 skill（git pull）
   */
  async update(skillId, hintLevel) {
    const entry = hintLevel
      ? this._getLevelInstalled(hintLevel).find((s) => s.id === skillId)
      : this._getGlobalInstalled().find((s) => s.id === skillId);

    if (!entry) return failMsg('SKILL_NOT_FOUND');

    if (entry.source !== 'community') return failMsg('SKILL_NOT_UPDATABLE');

    try {
      const repoUrl = `${SKILL_REPO_BASE}`;
      const skillPath = skillId;
      const tmpDir = join(tmpdir(), `skill-update-${randomUUID()}`);
      _parseGitHubUrl(repoUrl);

      const cloneCmd = [
        'git', 'clone', '--depth', '1', '--filter=blob:none', '--sparse', '--no-checkout',
        repoUrl, tmpDir,
      ].join(' ');
      execSync(cloneCmd, { stdio: 'pipe', timeout: 120000 });
      execSync(`git -C "${tmpDir}" sparse-checkout set "${skillPath}"`, { stdio: 'pipe', timeout: 60000 });
      execSync(`git -C "${tmpDir}" checkout`, { stdio: 'pipe', timeout: 60000 });

      const sourceDir = join(tmpDir, ...skillId.split('/'));
      const targetDir = entry.path;
      if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
      this._copyDir(sourceDir, targetDir);

      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

      this._mutate(skillId, (entries, idx) => {
        entries[idx].updated_at = Date.now();
        return okMsg('updated');
      }, hintLevel);
      return okMsg('updated');
    } catch (err) {
      return fail(getServerMessage('update_failed') + ': ' + err.message);
    }
  }

  /**
   * 将全局 skill 复制到项目 skill 目录
   */
  copyToProject(skillId) {
    const entry = this._getGlobalInstalled().find(function (s) { return s.id === skillId; });
    if (!entry) return failMsg('SKILL_NOT_FOUND');

    const projectInstalled = this._getProjectInstalled();
    if (projectInstalled.some(function (s) { return s.id === skillId; })) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    const targetDir = join(process.cwd(), this._projectSkillsDir, skillId);

    try {
      if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
      this._copyDir(entry.path, targetDir);

      this._addToConfig({
        id: skillId,
        name: entry.name,
        description: entry.description,
        path: targetDir,
        enabled: true,
        source: entry.source || 'community',
        version: entry.version || 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      }, 'project');

      return okMsg('synced');
    } catch (err) {
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
      return fail(getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message);
    }
  }

  // ─── 内部辅助方法 ───────────────────────────────────────────

  /**
   * 递归复制目录
   */
  _copyDir(src, dest) {
    if (!existsSync(src)) return;
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        this._copyDir(srcPath, destPath);
      } else {
        const content = readFileSync(srcPath);
        writeFileSync(destPath, content);
      }
    }
  }

  /**
   * 在解压目录中搜索 skill 子目录
   */
  _findSkillDir(extractRoot, skillPath) {
    const direct = join(extractRoot, ...skillPath.split('/'));
    if (existsSync(direct) && existsSync(join(direct, 'SKILL.md'))) {
      return direct;
    }

    const skillName = basename(skillPath);
    const found = [];
    function _walk(dir) {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          const full = join(dir, e.name);
          if (e.name === skillName && existsSync(join(full, 'SKILL.md'))) {
            found.push(full);
            continue;
          }
          if (full.split(/[/\\]/).length - extractRoot.split(/[/\\]/).length < 5) {
            _walk(full);
          }
        }
      } catch { /* ignore permission errors */ }
    }
    _walk(extractRoot);
    return found.length > 0 ? found[0] : null;
  }

  // ─── 自动发现 ───────────────────────────────────────────────

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

  // ─── 社区搜索（带缓存） ─────────────────────────────────────

  async searchCommunity(force, q) {
    const skillsCfg = this._engine.getSkills();
    const cache = skillsCfg.community_cache || [];
    const cachedAt = skillsCfg.cached_at || 0;
    const now = Date.now();

    if (!force && cache.length > 0 && (now - cachedAt) < CACHE_TTL) {
      return ok(q ? cache.filter((s) => s.id.toLowerCase().includes(q.toLowerCase())) : cache);
    }

    try {
      const apiUrl = 'https://api.github.com/repos/deepseek-ai/codewhale-skills/contents/';
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        if (cache.length > 0) return ok(cache);
        return fail(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();
      const skills = data.filter((item) => item.type === 'dir').map((item) => ({ id: item.name }));

      skillsCfg.community_cache = skills;
      skillsCfg.cached_at = Date.now();
      this._engine.setSkills(skillsCfg);

      return ok(q ? skills.filter((s) => s.id.toLowerCase().includes(q.toLowerCase())) : skills);
    } catch (err) {
      if (cache.length > 0) return ok(q ? cache.filter((s) => s.id.toLowerCase().includes(q.toLowerCase())) : cache);
      return fail(`Request failed: ${err.message}`);
    }
  }

  // ─── 安装日志 ────────────────────────────────────────────────

  getInstallLog() {
    const LOG_PATH = join(process.cwd(), 'download-skill.log');
    if (!existsSync(LOG_PATH)) return ok('');
    const content = readFileSync(LOG_PATH, 'utf-8');
    const lines = content.split('\n');
    return ok(lines.slice(Math.max(0, lines.length - 200)).join('\n'));
  }

  clearInstallLog() {
    const LOG_PATH = join(process.cwd(), 'download-skill.log');
    if (existsSync(LOG_PATH)) unlinkSync(LOG_PATH);
    return okMsg('skillLogCleared');
  }

  getCurrentProject() {
    return ok(process.cwd());
  }

  // ─── Skill 文件浏览 ──────────────────────────────────────────

  /**
   * 获取 skill 目录下的所有文件列表（相对路径）
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   */
  getSkillFiles(skillId, level) {
    const entry = this._findEntry(skillId, level);
    if (!entry) return failMsg('SKILL_NOT_FOUND');
    const files = [];
    const _walk = function (dir, prefix) {
      const items = readdirSync(dir, { withFileTypes: true });
      for (const e of items) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        if (e.isDirectory()) { _walk(join(dir, e.name), prefix ? prefix + '/' + e.name : e.name); } else { files.push(prefix ? prefix + '/' + e.name : e.name); }
      }
    };
    _walk(entry.path, '');
    return ok(files.sort());
  }

  /**
   * 读取 skill 目录下的指定文件内容
   * @param {string} skillId
   * @param {string} filePath - 相对于 skill 根目录的路径
   * @param {'global'|'project'} [level]
   */
  readSkillFile(skillId, filePath, level) {
    const entry = this._findEntry(skillId, level);
    if (!entry) return failMsg('SKILL_NOT_FOUND');
    const fullPath = join(entry.path, filePath);
    if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');
    try {
      const content = readFileSync(fullPath, 'utf-8');
      return ok(content);
    } catch (err) {
      return fail('Failed to read file: ' + err.message);
    }
  }

  /**
   * 保存 skill 目录下的指定文件内容
   * @param {string} skillId
   * @param {string} filePath - 相对于 skill 根目录的路径
   * @param {string} content
   * @param {'global'|'project'} [level]
   */
  saveSkillFile(skillId, filePath, content, level) {
    return this._mutate(skillId, (entries, idx) => {
      const entry = entries[idx];
      const fullPath = join(entry.path, filePath);
      if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');
      writeFileSync(fullPath, content, 'utf-8');
      entry.updated_at = Date.now();
      return okMsg('updated');
    }, level);
  }

  /**
   * 删除 skill 目录下的指定文件
   * @param {string} skillId
   * @param {string} filePath - 相对于 skill 根目录的路径
   * @param {'global'|'project'} [level]
   */
  removeSkillFile(skillId, filePath, level) {
    return this._mutate(skillId, (entries, idx) => {
      const entry = entries[idx];
      const fullPath = join(entry.path, filePath);
      if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');
      unlinkSync(fullPath);
      entry.updated_at = Date.now();
      return okMsg('updated');
    }, level);
  }

  /**
   * 获取 SKILL.md 内容
   */
  getReadme(skillId) {
    const result = this.readSkillFile(skillId, 'SKILL.md');
    return result.success ? ok(result.data) : ok('');
  }

  /**
   * 保存 SKILL.md 内容
   */
  saveReadme(skillId, content) {
    return this.saveSkillFile(skillId, 'SKILL.md', content);
  }

  // ─── 内部方法 ───────────────────────────────────────────────

  _getLevelInstalled(level) {
    return level === 'project' ? this._getProjectInstalled() : this._getGlobalInstalled();
  }

  _getLevelEngine(level) {
    return level === 'project' ? this._projectEngine : this._engine;
  }

  /**
   * 统一的 skill 条目录入查找
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {object|null}
   */
  _findEntry(skillId, level) {
    if (level === 'global') return this._getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (level === 'project') return this._getProjectInstalled().find((s) => s.id === skillId) || null;
    let entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
    if (!entry && this._projectEngine) {
      entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
    }
    return entry;
  }

  _getGlobalInstalled() {
    return this._engine.getSkills().installed || [];
  }

  _getProjectInstalled() {
    return this._projectEngine ? this._projectEngine.getInstalled() : [];
  }

  _addToConfig(entry, level) {
    if (level === 'project' && this._projectEngine) {
      const installed = this._projectEngine.getInstalled();
      installed.push(entry);
      this._projectEngine.setInstalled(installed);
    } else {
      const skillsCfg = this._engine.getSkills();
      const installed = skillsCfg.installed || [];
      installed.push(entry);
      skillsCfg.installed = installed;
      this._engine.setSkills(skillsCfg);
    }
  }

  _mutate(skillId, fn, hintLevel) {
    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return failMsg('SKILL_NOT_FOUND');
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

    if (this._projectEngine) {
      const projectEntries = this._getProjectInstalled();
      idx = projectEntries.findIndex((s) => s.id === skillId);
      if (idx !== -1) {
        const result = fn(projectEntries, idx, projectEntries[idx], 'project', this._projectEngine);
        this._setLevelInstalled('project', projectEntries);
        return result;
      }
    }

    return failMsg('SKILL_NOT_FOUND');
  }

  async _mutateAsync(skillId, fn, hintLevel) {
    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return failMsg('SKILL_NOT_FOUND');
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = await fn(entries, idx, entries[idx], hintLevel, engine);
      this._setLevelInstalled(hintLevel, entries);
      return result;
    }

    const globalEntries = this._getGlobalInstalled();
    let idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = await fn(globalEntries, idx, globalEntries[idx], 'global', this._engine);
      this._setLevelInstalled('global', globalEntries);
      return result;
    }

    if (this._projectEngine) {
      const projectEntries = this._getProjectInstalled();
      idx = projectEntries.findIndex((s) => s.id === skillId);
      if (idx !== -1) {
        const result = await fn(projectEntries, idx, projectEntries[idx], 'project', this._projectEngine);
        this._setLevelInstalled('project', projectEntries);
        return result;
      }
    }

    return failMsg('SKILL_NOT_FOUND');
  }

  _setLevelInstalled(level, entries) {
    if (level === 'project' && this._projectEngine) {
      this._projectEngine.setInstalled(entries);
    } else {
      const skillsCfg = this._engine.getSkills();
      skillsCfg.installed = entries;
      this._engine.setSkills(skillsCfg);
    }
  }

  _toggle(skillId, enabled, hintLevel) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].enabled = enabled;
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
  }

  get skillsDir() {
    return this._skillsDir;
  }
}
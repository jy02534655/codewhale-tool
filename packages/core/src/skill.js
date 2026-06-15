/**
 * SkillManager — 双层 Skill 管理（全局 + 项目）
 *
 * Skill 存储架构：
 *   全局层 → store.json → skills.installed[] （由 ConfigEngine 管理）
 *   项目层 → .codewhale/skills.json → installed[]（由 ProjectSkillEngine 管理）
 *
 * Skill 文件位置：
 *   全局 → ~/.codewhale/skills/<skill-id>/SKILL.md
 *   项目 → <project>/.codewhale/skills/<skill-id>/SKILL.md
 *
 * 核心能力：
 *   - 双层注册表（全局独立 + 项目独立）
 *   - discover() 自动扫描磁盘发现未注册 skill
 *   - 自动从 SKILL.md 提取 name/description
 *   - remark（用户备注） + tags（标签）独立管理
 *   - 社区 skill 列表缓存（24h 自动刷新）
 *
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * @module skill
 */

import { existsSync, rmSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { getServerMessage, getLocale } from './i18n.js';
import { ok, fail } from './result.js';

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

export class SkillManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine         - 全局配置引擎
   * @param {import('./project-skill.js').ProjectSkillEngine} [projectEngine] - 项目 skill 引擎（可选）
   * @param {string}                            [skillsDir]    - 全局 skill 存储目录
   */
  constructor(engine, projectEngine, skillsDir) {
    /** @type {import('./config.js').ConfigEngine} */
    this._engine = engine;
    /** @type {import('./project-skill.js').ProjectSkillEngine|null} */
    this._projectEngine = projectEngine || null;
    /** @type {string} 全局 skill 文件存储根目录 */
    this._skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    /** @type {string} 项目 skill 文件存储目录（相对于项目根） */
    this._projectSkillsDir = '.codewhale/skills';
  }

  // ─── 列表查询 ───────────────────────────────────────────────

  /**
   * 列出所有 skill（全局 + 项目合并，带 level 标记）
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listAll() {
    const global = this._getGlobalInstalled().map((s) => ({ ...s, level: 'global' }));
    const project = this._getProjectInstalled().map((s) => ({ ...s, level: 'project' }));
    return ok([...global, ...project]);
  }

  /**
   * 列出全局 skill
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listGlobal() {
    return ok(this._getGlobalInstalled());
  }

  /**
   * 列出项目 skill
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listProject() {
    return ok(this._getProjectInstalled());
  }

  // ─── 单 Skill 操作 ──────────────────────────────────────────

  /**
   * 获取单个 skill 的详细信息（包含 SKILL.md 内容）
   * @param {string} skillId
   * @param {'global'|'project'} [level] - 指定层级，不指定则自动查找
   * @returns {{success: boolean, data?: {entry: object|null, readme: string, level: string|null}, message?: string, errorCode?: string}}
   */
  show(skillId, level) {
    let entry = null;
    let resolvedLevel = null;

    if (level === 'global') {
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'global';
    } else if (level === 'project') {
      entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'project';
    } else {
      // 自动查找：全局优先
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = entry ? 'global' : null;
      if (!entry) {
        entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
        resolvedLevel = entry ? 'project' : null;
      }
    }

    let readme = '';
    if (entry && entry.path) {
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        if (existsSync(readmePath)) {
          readme = readFileSync(readmePath, 'utf-8');
        }
      } catch {
        readme = '(无法读取 SKILL.md)';
      }
    }

    if (!entry) return fail('Not found', 'SKILL_NOT_FOUND');
    return ok({ entry, readme, level: resolvedLevel });
  }

  /**
   * 更新用户备注
   * @param {string} skillId
   * @param {string} remark
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateRemark(skillId, remark) {
    const locale = getLocale();
    const result = this._mutate(skillId, (entries, idx) => {
      entries[idx].remark = remark;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage(locale, 'updated'));
    });
    return result;
  }

  /**
   * 更新标签
   * @param {string} skillId
   * @param {string[]} tags
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateTags(skillId, tags) {
    const locale = getLocale();
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].tags = tags;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage(locale, 'updated'));
    });
  }

  /**
   * 更新别名
   * @param {string} skillId
   * @param {string} alias
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias(skillId, alias, level) {
    const locale = getLocale();
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].alias = alias;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage(locale, 'updated'));
    }, level);
  }

  /**
   * 合并更新 skill 元数据（alias + remark + tags）
   * @param {string} skillId
   * @param {{ alias?: string, remark?: string, tags?: string[] }} data
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateMeta(skillId, data, level) {
    const locale = getLocale();
    return this._mutate(skillId, (entries, idx) => {
      if (data.alias !== undefined) entries[idx].alias = data.alias;
      if (data.remark !== undefined) entries[idx].remark = data.remark;
      if (data.tags !== undefined) entries[idx].tags = data.tags;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage(locale, 'updated'));
    }, level);
  }

  // ─── 启用 / 禁用 ────────────────────────────────────────────

  /** @param {string} skillId */
  enable(skillId) {
    return this._toggle(skillId, true);
  }

  /** @param {string} skillId */
  disable(skillId) {
    return this._toggle(skillId, false);
  }

  // ─── 安装 ───────────────────────────────────────────────────

  /**
   * 从社区仓库安装一个 skill
   * @param {string} skillId
   * @param {'global'|'project'} [level='global'] - 安装到全局还是项目
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async install(skillId, level) {
    const locale = getLocale();
    const targetLevel = level || 'global';
    const installed = this._getLevelInstalled(targetLevel);

    if (installed.some((s) => s.id === skillId)) {
      return fail(getServerMessage(locale, 'SKILL_ALREADY_INSTALLED'), 'SKILL_ALREADY_INSTALLED');
    }

    const targetDir = targetLevel === 'project'
      ? join(process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    const repoUrl = `${SKILL_REPO_BASE}.git`;

    try {
      execSync(
        `git clone --depth 1 --filter=blob:none --sparse "${repoUrl}" "${targetDir}"`,
        { stdio: 'pipe', timeout: 30000 }
      );
      execSync(`cd "${targetDir}" && git sparse-checkout set "${skillId}"`, {
        stdio: 'pipe',
        timeout: 10000,
        shell: true,
      });
    } catch {
      try {
        if (existsSync(targetDir)) {
          rmSync(targetDir, { recursive: true, force: true });
        }
        execSync(`git clone --depth 1 "${repoUrl}" "${targetDir}"`, {
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch {
        return fail(getServerMessage(locale, 'GIT_CLONE_FAILED'), 'GIT_CLONE_FAILED');
      }
    }

    if (!existsSync(join(targetDir, 'SKILL.md'))) {
      return fail(getServerMessage(locale, 'SKILL_MISSING_README'), 'SKILL_MISSING_README');
    }

    const meta = _extractMeta(targetDir);
    const entry = {
      id: skillId,
      name: meta.name,
      description: meta.description,
      path: targetDir,
      enabled: true,
      source: 'community',
      version: 'latest',
      installed_at: Date.now(),
      updated_at: Date.now(),
    };
    this._addToConfig(entry, targetLevel);

    return ok(null, getServerMessage(locale, 'synced'));
  }

  /**
   * 从本地目录安装一个 skill
   * @param {string} skillId
   * @param {string} localPath - 本地目录路径
   * @param {'global'|'project'} [level='global']
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  installLocal(skillId, localPath, level) {
    const locale = getLocale();
    const targetLevel = level || 'global';
    const installed = this._getLevelInstalled(targetLevel);

    if (installed.some((s) => s.id === skillId)) {
      return fail(getServerMessage(locale, 'SKILL_ALREADY_INSTALLED'), 'SKILL_ALREADY_INSTALLED');
    }

    if (!existsSync(localPath)) {
      return fail(getServerMessage(locale, 'SKILL_DIR_NOT_EXISTS'), 'SKILL_DIR_NOT_EXISTS');
    }
    if (!existsSync(join(localPath, 'SKILL.md'))) {
      return fail(getServerMessage(locale, 'SKILL_DIR_NO_README'), 'SKILL_DIR_NO_README');
    }

    const meta = _extractMeta(localPath);
    const entry = {
      id: skillId,
      name: meta.name,
      description: meta.description,
      path: localPath,
      enabled: true,
      source: 'local',
      installed_at: Date.now(),
      updated_at: Date.now(),
    };
    this._addToConfig(entry, targetLevel);

    return ok(null, getServerMessage(locale, 'synced'));
  }

  // ─── 删除 ───────────────────────────────────────────────────

  /**
   * 删除一个 skill（从磁盘删除 + 从注册表移除）
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(skillId, level) {
    const locale = getLocale();
    return this._mutate(skillId, (entries, idx, entry, resolvedLevel) => {
      if (entry.path && existsSync(entry.path)) {
        try {
          rmSync(entry.path, { recursive: true, force: true });
        } catch {
          return fail(getServerMessage(locale, 'DELETE_DIR_FAILED'), 'DELETE_DIR_FAILED');
        }
      }
      entries.splice(idx, 1);
      return ok(null, getServerMessage(locale, 'deleted'));
    }, level);
  }

  // ─── 更新 ───────────────────────────────────────────────────

  /**
   * 更新一个 community 来源的 skill（git pull）
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async update(skillId, level) {
    const locale = getLocale();
    return this._mutateAsync(skillId, async (entries, idx, entry, resolvedLevel) => {
      if (entry.source !== 'community') {
        return fail(getServerMessage(locale, 'SKILL_NOT_COMMUNITY'), 'SKILL_NOT_COMMUNITY');
      }
      try {
        execSync(`cd "${entry.path}" && git pull`, { stdio: 'pipe', timeout: 15000, shell: true });
        // 更新元数据
        const meta = _extractMeta(entry.path);
        entries[idx].name = meta.name;
        entries[idx].description = meta.description;
        entries[idx].updated_at = Date.now();
        return ok(null, getServerMessage(locale, 'updated'));
      } catch {
        return fail(getServerMessage(locale, 'GIT_PULL_FAILED'), 'GIT_PULL_FAILED');
      }
    }, level);
  }

  /**
   * 获取 SKILL.md 原始内容
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: string, message?: string, errorCode?: string}}
   */
  getReadme(skillId, level) {
    return this._mutate(skillId, (entries, idx, entry) => {
      if (!entry.path) return fail('路径为空', 'PATH_EMPTY');
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        return ok(readFileSync(readmePath, 'utf-8'));
      } catch {
        return fail('无法读取 SKILL.md', 'READ_FAILED');
      }
    }, level);
  }

  /**
   * 保存 SKILL.md 内容到磁盘并更新元数据
   * @param {string} skillId
   * @param {string} content - 新的 Markdown 内容
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  saveReadme(skillId, content, level) {
    return this._mutate(skillId, (entries, idx, entry) => {
      if (!entry.path) return fail('路径为空', 'PATH_EMPTY');
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        writeFileSync(readmePath, content, 'utf-8');
        // 重新提取 name/description
        const meta = _extractMeta(entry.path);
        entries[idx].name = meta.name;
        entries[idx].description = meta.description;
        entries[idx].updated_at = Date.now();
        return ok(entries[idx], getServerMessage(locale, 'updated'));
      } catch (err) {
        return fail('写入文件失败: ' + err.message, 'WRITE_FAILED');
      }
    }, level);
  }

  // ─── 自动发现 ───────────────────────────────────────────────

  /**
   * 自动扫描磁盘上的 skill 目录，将未注册的 skill 加入注册表
   *
   * 扫描范围：
   *   全局 → ~/.codewhale/skills/
   *   项目 → <cwd>/.codewhale/skills/
   *
   * 规则：只新增不覆盖，已注册的保留不修改
   *
   * @param {'global'|'project'} [level] - 指定扫描层级，不指定则全扫
   * @returns {{success: boolean, data?: {found: number, added: number, errors: string[]}, message?: string}}
   */
  discover(level) {
    const locale = getLocale();
    const result = { found: 0, added: 0, errors: [] };

    const scanFn = (dir, targetLevel) => {
      if (!existsSync(dir)) return;
      const entries = [];
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
            id: dirent.name,
            name: meta.name,
            description: meta.description,
            path: skillPath,
            enabled: true,
            source: 'local',
            installed_at: Date.now(),
            updated_at: Date.now(),
          };
          this._addToConfig(entry, targetLevel);
          result.added++;
        }
      } catch (err) {
        result.errors.push(`扫描 ${dir}: ${err.message}`);
      }
    };

    // 全局扫描
    if (!level || level === 'global') {
      scanFn(this._skillsDir, 'global');
    }

    // 项目扫描
    if ((!level || level === 'project') && this._projectEngine) {
      const projectDir = join(process.cwd(), this._projectSkillsDir);
      scanFn(projectDir, 'project');
    }

    return ok(result, getServerMessage(locale, 'synced'));
  }

  // ─── 社区搜索（带缓存） ─────────────────────────────────────

  /**
   * 获取社区可用 skill 列表
   *
   * 优先使用本地缓存，缓存过期或 force=true 时从 GitHub API 拉取。
   * 缓存存储在 store.json 的 skills.community_cache 中，有效期 24 小时。
   *
   * @param {boolean} [force=false] - 强制刷新缓存
   * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
   */
  async searchCommunity(force) {
    const skillsCfg = this._engine.getSkills();
    const cache = skillsCfg.community_cache || [];
    const cachedAt = skillsCfg.cached_at || 0;
    const now = Date.now();

    // 缓存有效且非强制刷新
    if (!force && cache.length > 0 && (now - cachedAt) < CACHE_TTL) {
      return ok(cache);
    }

    // 拉取远程
    try {
      const apiUrl = 'https://api.github.com/repos/deepseek-ai/codewhale-skills/contents/';
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        // 网络失败但有缓存则回退
        if (cache.length > 0) return ok(cache);
        return fail(`GitHub API 返回 ${response.status}`);
      }

      const data = await response.json();
      const skills = data
        .filter((item) => item.type === 'dir')
        .map((item) => ({ id: item.name }));

      // 更新缓存
      skillsCfg.community_cache = skills;
      skillsCfg.cached_at = Date.now();
      this._engine.setSkills(skillsCfg);

      return ok(skills);
    } catch (err) {
      if (cache.length > 0) return ok(cache);
      return fail(`请求失败: ${err.message}`);
    }
  }

  // ─── 内部方法 ───────────────────────────────────────────────

  /**
   * 按层级获取 installed 列表
   * @param {'global'|'project'} level
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getLevelInstalled(level) {
    return level === 'project' ? this._getProjectInstalled() : this._getGlobalInstalled();
  }

  /**
   * 按层级获取引擎
   * @param {'global'|'project'} level
   * @returns {object}
   * @private
   */
  _getLevelEngine(level) {
    return level === 'project' ? this._projectEngine : this._engine;
  }

  /**
   * 获取全局已安装列表
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getGlobalInstalled() {
    return this._engine.getSkills().installed || [];
  }

  /**
   * 获取项目已安装列表
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getProjectInstalled() {
    return this._projectEngine ? this._projectEngine.getInstalled() : [];
  }

  /**
   * 向指定层级的注册表添加一个条目
   * @param {import('./types.js').SkillEntry} entry
   * @param {'global'|'project'} level
   * @private
   */
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

  /**
   * 查找 skill 所在层级并执行回调（同步版）
   * @param {string} skillId
   * @param {(entries: Array, idx: number, entry: object, level: string, engine: object) => any} fn
   * @param {'global'|'project'} [hintLevel]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   * @private
   */
  _mutate(skillId, fn, hintLevel) {
    const locale = getLocale();

    // 尝试提示层级
    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
      const result = fn(entries, idx, entries[idx], hintLevel, engine);
      this._setLevelInstalled(hintLevel, entries);
      return result;
    }

    // 全局优先
    const globalEntries = this._getGlobalInstalled();
    let idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this._engine);
      this._setLevelInstalled('global', globalEntries);
      return result;
    }

    // 项目
    if (this._projectEngine) {
      const projectEntries = this._getProjectInstalled();
      idx = projectEntries.findIndex((s) => s.id === skillId);
      if (idx !== -1) {
        const result = fn(projectEntries, idx, projectEntries[idx], 'project', this._projectEngine);
        this._setLevelInstalled('project', projectEntries);
        return result;
      }
    }

    return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
  }

  /**
   * 异步版 _mutate
   * @private
   */
  async _mutateAsync(skillId, fn, hintLevel) {
    const locale = getLocale();

    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
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

    return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
  }

  /**
   * 设置某层级的 installed 列表
   * @param {'global'|'project'} level
   * @param {import('./types.js').SkillEntry[]} entries
   * @private
   */
  _setLevelInstalled(level, entries) {
    if (level === 'project' && this._projectEngine) {
      this._projectEngine.setInstalled(entries);
    } else {
      const skillsCfg = this._engine.getSkills();
      skillsCfg.installed = entries;
      this._engine.setSkills(skillsCfg);
    }
  }

  /**
   * 启用/禁用切换
   * @param {string} skillId
   * @param {boolean} enabled
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   * @private
   */
  _toggle(skillId, enabled) {
    const locale = getLocale();
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].enabled = enabled;
      entries[idx].updated_at = Date.now();
      return ok(null, getServerMessage(locale, 'updated'));
    });
  }

  /** @returns {string} */
  get skillsDir() {
    return this._skillsDir;
  }
}
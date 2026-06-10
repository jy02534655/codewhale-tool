/**
 * SkillManager — 管理 CodeWhale skill 的安装/启用/禁用/删除
 *
 * Skill 存储位置：
 *   ~/.codewhale/skills/<skill-id>/SKILL.md
 *
 * 每个 skill 是一个目录，包含 SKILL.md 和可能的附属文件。
 * 安装 = git clone + 写入 config.toml
 * 启用/禁用 = 修改 config.toml 中 installed[].enabled 字段
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * @module skill
 */

import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getServerMessage, getLocale } from './i18n.js';
import { ok, fail } from './result.js';

/** CodeWhale skill 社区仓库的基础 URL */
const SKILL_REPO_BASE = 'https://github.com/deepseek-ai/codewhale-skills';

export class SkillManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine      - 配置读写引擎
   * @param {string}                            [skillsDir] - skill 存储目录，默认为 ~/.codewhale/skills/
   */
  constructor(engine, skillsDir) {
    /** @type {import('./config.js').ConfigEngine} */
    this._engine = engine;
    /** @type {string} skill 文件存储根目录 */
    this._skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
  }

  // ─── 列表查询 ───────────────────────────────────────────────

  /**
   * 列出所有已安装的 skill（从 config.toml 读取）
   * @returns {import('./types.js').SkillEntry[]}
   */
  listInstalled() {
    return ok(this._engine.getSkills().installed || []);
  }

  /**
   * 获取单个 skill 的详细信息（包含 SKILL.md 内容）
   * @param {string} skillId
   * @returns {{success: boolean, data?: {entry: object|null, readme: string}, message?: string, errorCode?: string}}
   */
  show(skillId) {
    const installed = this.listInstalled();
    const entry = installed.find((s) => s.id === skillId) || null;

    let readme = '';
    if (entry && entry.path) {
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        const fs = require('node:fs');
        if (existsSync(readmePath)) {
          readme = fs.readFileSync(readmePath, 'utf-8');
        }
      } catch {
        readme = '(无法读取 SKILL.md)';
      }
    }

    if (!entry) return fail('Not found', 'SKILL_NOT_FOUND');
    return ok({ entry, readme });
  }

  // ─── 安装 ───────────────────────────────────────────────────

  /**
   * 从社区仓库安装一个 skill
   *
   * 安装流程：
   *   1. 检查是否已安装
   *   2. git clone 到 ~/.codewhale/skills/<skill-id>/
   *   3. 写入 config.toml skills.installed 列表
   *
   * @param {string} skillId - skill 标识符（同时也是 GitHub 仓库下的目录名）
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async install(skillId) {
    const locale = getLocale();
    const installed = this.listInstalled();
    if (installed.some((s) => s.id === skillId)) {
      return fail(getServerMessage(locale, 'SKILL_ALREADY_INSTALLED'), 'SKILL_ALREADY_INSTALLED');
    }

    const targetDir = join(this._skillsDir, skillId);
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
    } catch (err) {
      try {
        if (existsSync(targetDir)) {
          rmSync(targetDir, { recursive: true, force: true });
        }
        execSync(`git clone --depth 1 "${repoUrl}" "${targetDir}"`, {
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err2) {
        return fail(getServerMessage(locale, 'GIT_CLONE_FAILED'), 'GIT_CLONE_FAILED');
      }
    }

    if (!existsSync(join(targetDir, 'SKILL.md'))) {
      return fail(getServerMessage(locale, 'SKILL_MISSING_README'), 'SKILL_MISSING_README');
    }

    const entry = {
      id: skillId,
      path: targetDir,
      enabled: true,
      source: 'community',
      version: 'latest',
    };
    this._addToConfig(entry);

    return ok(null, getServerMessage(locale, 'synced'));
  }

  /**
   * 从本地目录安装一个 skill
   * @param {string} skillId   - skill 标识符
   * @param {string} localPath - 本地目录路径
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  installLocal(skillId, localPath) {
    const locale = getLocale();
    const installed = this.listInstalled();
    if (installed.some((s) => s.id === skillId)) {
      return fail(getServerMessage(locale, 'SKILL_ALREADY_INSTALLED'), 'SKILL_ALREADY_INSTALLED');
    }

    if (!existsSync(localPath)) {
      return fail(getServerMessage(locale, 'SKILL_DIR_NOT_EXISTS'), 'SKILL_DIR_NOT_EXISTS');
    }
    if (!existsSync(join(localPath, 'SKILL.md'))) {
      return fail(getServerMessage(locale, 'SKILL_DIR_NO_README'), 'SKILL_DIR_NO_README');
    }

    const entry = {
      id: skillId,
      path: localPath,
      enabled: true,
      source: 'local',
    };
    this._addToConfig(entry);

    return ok(null, getServerMessage(locale, 'synced'));
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

  /**
   * @param {string}  skillId
   * @param {boolean} enabled
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   * @private
   */
  _toggle(skillId, enabled) {
    const locale = getLocale();
    const skillsCfg = this._engine.getSkills();
    const installed = skillsCfg.installed || [];

    const idx = installed.findIndex((s) => s.id === skillId);
    if (idx === -1) {
      return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
    }

    installed[idx].enabled = enabled;
    skillsCfg.installed = installed;
    this._engine.setSkills(skillsCfg);

    return ok(null, getServerMessage(locale, 'updated'));
  }

  // ─── 删除 ───────────────────────────────────────────────────

  /**
   * 删除一个 skill（从磁盘删除目录 + 从 config 移除条目）
   * @param {string} skillId
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(skillId) {
    const locale = getLocale();
    const skillsCfg = this._engine.getSkills();
    const installed = skillsCfg.installed || [];

    const idx = installed.findIndex((s) => s.id === skillId);
    if (idx === -1) {
      return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
    }

    const entry = installed[idx];

    if (entry.path && existsSync(entry.path)) {
      try {
        rmSync(entry.path, { recursive: true, force: true });
      } catch (err) {
        return fail(getServerMessage(locale, 'DELETE_DIR_FAILED'), 'DELETE_DIR_FAILED');
      }
    }

    installed.splice(idx, 1);
    skillsCfg.installed = installed;
    this._engine.setSkills(skillsCfg);

    return ok(null, getServerMessage(locale, 'deleted'));
  }

  /**
   * 更新一个 community 来源的 skill（git pull）
   * @param {string} skillId
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async update(skillId) {
    const locale = getLocale();
    const installed = this.listInstalled();
    const entry = installed.find((s) => s.id === skillId);
    if (!entry) {
      return fail(getServerMessage(locale, 'SKILL_NOT_FOUND'), 'SKILL_NOT_FOUND');
    }
    if (entry.source !== 'community') {
      return fail(getServerMessage(locale, 'SKILL_NOT_COMMUNITY'), 'SKILL_NOT_COMMUNITY');
    }

    try {
      execSync(`cd "${entry.path}" && git pull`, { stdio: 'pipe', timeout: 15000, shell: true });
      return ok(null, getServerMessage(locale, 'updated'));
    } catch (err) {
      return fail(getServerMessage(locale, 'GIT_PULL_FAILED'), 'GIT_PULL_FAILED');
    }
  }

  /**
   * 获取社区可用的 skill 列表（从 GitHub API）
   *
   * 注意：此方法需要网络连接，且 GitHub API 可能有速率限制。
   *
   * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
   */
  async searchCommunity() {
    try {
      const apiUrl = 'https://api.github.com/repos/deepseek-ai/codewhale-skills/contents/';
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        return fail(`GitHub API 返回 ${response.status}`);
      }

      const data = await response.json();
      const skills = data
        .filter((item) => item.type === 'dir')
        .map((item) => ({
          id: item.name,
          description: '',
        }));

      return ok(skills);
    } catch (err) {
      return fail(`网络请求失败: ${err.message}`);
    }
  }

  // ─── 辅助方法 ───────────────────────────────────────────────

  /**
   * 向 config.toml 的 skills.installed 列表添加一个条目
   * @param {import('./types.js').SkillEntry} entry
   * @private
   */
  _addToConfig(entry) {
    const skillsCfg = this._engine.getSkills();
    const installed = skillsCfg.installed || [];
    installed.push(entry);
    skillsCfg.installed = installed;
    this._engine.setSkills(skillsCfg);
  }

  /**
   * 获取 skill 存储目录路径
   * @returns {string}
   */
  get skillsDir() {
    return this._skillsDir;
  }
}
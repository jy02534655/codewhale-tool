/**
 * SkillManager — 管理 CodeWhale skill 的安装/启用/禁用/删除
 *
 * Skill 存储位置：
 *   ~/.codewhale/skills/<skill-id>/SKILL.md
 *
 * 每个 skill 是一个目录，包含 SKILL.md 和可能的附属文件。
 * 安装 = git clone + 写入 config.toml
 * 启用/禁用 = 修改 config.toml 中 installed[].enabled 字段
 *
 * @module skill
 */

import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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
    const skills = this._engine.getSkills();
    return skills.installed || [];
  }

  /**
   * 获取单个 skill 的详细信息（包含 SKILL.md 内容）
   * @param {string} skillId
   * @returns {{entry: import('./types.js').SkillEntry|null, readme: string}}
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

    return { entry, readme };
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
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async install(skillId) {
    // 检查是否已安装
    const installed = this.listInstalled();
    if (installed.some((s) => s.id === skillId)) {
      return { success: false, message: `Skill "${skillId}" 已安装` };
    }

    const targetDir = join(this._skillsDir, skillId);
    const repoUrl = `${SKILL_REPO_BASE}.git`;

    try {
      // 使用 sparse-checkout 只拉取指定 skill 目录，减少下载量
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
      // 如果 sparse-checkout 失败，回退到完整 clone（兼容旧版 git）
      try {
        if (existsSync(targetDir)) {
          rmSync(targetDir, { recursive: true, force: true });
        }
        execSync(`git clone --depth 1 "${repoUrl}" "${targetDir}"`, {
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (err2) {
        return { success: false, message: `Git clone 失败: ${err2.message}` };
      }
    }

    // 验证 SKILL.md 存在
    if (!existsSync(join(targetDir, 'SKILL.md'))) {
      return { success: false, message: `安装完成但未找到 SKILL.md，请检查仓库结构` };
    }

    // 写入 config
    const entry = {
      id: skillId,
      path: targetDir,
      enabled: true,
      source: 'community',
      version: 'latest',
    };
    this._addToConfig(entry);

    return { success: true, message: `Skill "${skillId}" 安装成功` };
  }

  /**
   * 从本地目录安装一个 skill
   * @param {string} skillId   - skill 标识符
   * @param {string} localPath - 本地目录路径
   * @returns {{success: boolean, message: string}}
   */
  installLocal(skillId, localPath) {
    const installed = this.listInstalled();
    if (installed.some((s) => s.id === skillId)) {
      return { success: false, message: `Skill "${skillId}" 已安装` };
    }

    if (!existsSync(localPath)) {
      return { success: false, message: `本地路径 "${localPath}" 不存在` };
    }
    if (!existsSync(join(localPath, 'SKILL.md'))) {
      return { success: false, message: `目录中没有 SKILL.md 文件` };
    }

    const entry = {
      id: skillId,
      path: localPath,
      enabled: true,
      source: 'local',
    };
    this._addToConfig(entry);

    return { success: true, message: `Skill "${skillId}" 已从本地安装` };
  }

  // ─── 启用 / 禁用 ────────────────────────────────────────────

  /**
   * 启用一个 skill
   * @param {string} skillId
   * @returns {{success: boolean, message: string}}
   */
  enable(skillId) {
    return this._toggle(skillId, true);
  }

  /**
   * 禁用一个 skill（不删除文件，仅标记 enabled=false）
   * @param {string} skillId
   * @returns {{success: boolean, message: string}}
   */
  disable(skillId) {
    return this._toggle(skillId, false);
  }

  /**
   * 切换 skill 启用状态
   * @param {string}  skillId
   * @param {boolean} enabled
   * @returns {{success: boolean, message: string}}
   * @private
   */
  _toggle(skillId, enabled) {
    const skillsCfg = this._engine.getSkills();
    const installed = skillsCfg.installed || [];

    const idx = installed.findIndex((s) => s.id === skillId);
    if (idx === -1) {
      return { success: false, message: `Skill "${skillId}" 未安装` };
    }

    installed[idx].enabled = enabled;
    skillsCfg.installed = installed;
    this._engine.setSkills(skillsCfg);

    const action = enabled ? '启用' : '禁用';
    return { success: true, message: `Skill "${skillId}" 已${action}` };
  }

  // ─── 删除 ───────────────────────────────────────────────────

  /**
   * 删除一个 skill（从磁盘删除目录 + 从 config 移除条目）
   * @param {string} skillId
   * @returns {{success: boolean, message: string}}
   */
  remove(skillId) {
    const skillsCfg = this._engine.getSkills();
    const installed = skillsCfg.installed || [];

    const idx = installed.findIndex((s) => s.id === skillId);
    if (idx === -1) {
      return { success: false, message: `Skill "${skillId}" 未安装` };
    }

    const entry = installed[idx];

    // 删除磁盘目录
    if (entry.path && existsSync(entry.path)) {
      try {
        rmSync(entry.path, { recursive: true, force: true });
      } catch (err) {
        return { success: false, message: `删除目录失败: ${err.message}` };
      }
    }

    // 从 config 移除
    installed.splice(idx, 1);
    skillsCfg.installed = installed;
    this._engine.setSkills(skillsCfg);

    return { success: true, message: `Skill "${skillId}" 已删除` };
  }

  /**
   * 更新一个 community 来源的 skill（git pull）
   * @param {string} skillId
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async update(skillId) {
    const installed = this.listInstalled();
    const entry = installed.find((s) => s.id === skillId);
    if (!entry) {
      return { success: false, message: `Skill "${skillId}" 未安装` };
    }
    if (entry.source !== 'community') {
      return { success: false, message: `只有 community 来源的 skill 支持在线更新` };
    }

    try {
      execSync(`cd "${entry.path}" && git pull`, { stdio: 'pipe', timeout: 15000, shell: true });
      return { success: true, message: `Skill "${skillId}" 已更新` };
    } catch (err) {
      return { success: false, message: `git pull 失败: ${err.message}` };
    }
  }

  /**
   * 获取社区可用的 skill 列表（从 GitHub API）
   *
   * 注意：此方法需要网络连接，且 GitHub API 可能有速率限制。
   *
   * @returns {Promise<{success: boolean, skills?: {id: string, description: string}[], message?: string}>}
   */
  async searchCommunity() {
    try {
      const apiUrl = 'https://api.github.com/repos/deepseek-ai/codewhale-skills/contents/';
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        return { success: false, message: `GitHub API 返回 ${response.status}` };
      }

      const data = await response.json();
      // 过滤出目录（skill 是目录而不是文件）
      const skills = data
        .filter((item) => item.type === 'dir')
        .map((item) => ({
          id: item.name,
          description: '', // GitHub contents API 不返回描述，需额外读取各目录的 SKILL.md
        }));

      return { success: true, skills };
    } catch (err) {
      return { success: false, message: `网络请求失败: ${err.message}` };
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
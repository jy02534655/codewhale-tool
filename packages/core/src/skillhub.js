/**
 * SkillhubCLI — Skillhub 命令行工具封装
 *
 * 封装 skillhub CLI 的调用，提供搜索和安装技能的能力。
 * 通过子进程调用 skillhub 命令，输出解析为结构化数据。
 *
 * Skillhub 是一个国内加速的 skill 分发工具，通过腾讯云 COS 分发。
 * 安装方式：curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash
 *
 * @module skillhub
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir, platform, tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { ok, fail } from './result.js';
import { getServerMessage } from './i18n.js';

/**
 * Skillhub CLI 命令行调用封装
 */
export class SkillhubCLI {
  /**
   * @param {import('./skill/index.js').SkillManager} skillManager - 用于安装后触发 discover
   * @param {object} [options]
   * @param {string} [options.baseUrl] - 下载基础 URL
   */
  constructor(skillManager, options = {}) {
    /** @type {import('./skill/index.js').SkillManager} */
    this._skillMgr = skillManager;
    this._baseUrl = options.baseUrl || 'https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com';
    this._cliPath = null; // 缓存 CLI 路径
  }

  // ─── 查找 CLI ────────────────────────────────────────────────

  /**
   * 在 PATH 中查找 skillhub 可执行文件
   * @returns {string|null}
   * @private
   */
  _findCli() {
    if (this._cliPath && existsSync(this._cliPath)) return this._cliPath;

    const candidates = process.platform === 'win32'
      ? ['skillhub.exe', 'skillhub.bat', 'skillhub.cmd', 'skillhub']
      : ['skillhub'];

    const pathDirs = (process.env.PATH || '').split(delimiter);
    for (const dir of pathDirs) {
      for (const name of candidates) {
        const full = join(dir, name);
        if (existsSync(full)) {
          this._cliPath = full;
          return full;
        }
      }
    }
    return null;
  }

  /**
   * 检查 skillhub CLI 是否已安装
   * @returns {{success: boolean, data: {installed: boolean, path: string|null}}}
   */
  isInstalled() {
    const cliPath = this._findCli();
    return ok({ installed: !!cliPath, path: cliPath });
  }

  /**
   * 获取 skillhub 状态信息
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  async getStatus() {
    const cliPath = this._findCli();
    if (!cliPath) {
      return ok({ installed: false, version: null, path: null });
    }

    try {
      const version = await this._execCli(['--version']);
      return ok({
        installed: true,
        version: version.trim(),
        path: cliPath,
      });
    } catch {
      return ok({ installed: true, version: '(unknown)', path: cliPath });
    }
  }

  // ─── 安装 Skillhub CLI ──────────────────────────────────────

  /**
   * 安装/升级 skillhub CLI
   *
   * 下载并运行安装脚本（PowerShell 版 for Windows / bash 版 for Unix）。
   * 安装成功后自动检查 CLI 可用性。
   *
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  async install() {
    // 如果已经安装了，先检查版本
    const existing = this._findCli();
    if (existing) {
      // 允许重新安装/升级
    }

    const tmpDir = join(tmpdir(), `skillhub-install-${randomUUID()}`);
    const scriptPath = process.platform === 'win32'
      ? join(tmpDir, 'install.ps1')
      : join(tmpDir, 'install.sh');

    try {
      // 1. 确保目录存在
      const { mkdirSync } = await import('node:fs');
      mkdirSync(tmpDir, { recursive: true });

      // 2. 下载安装脚本
      const scriptUrl = `${this._baseUrl}/install/install.${process.platform === 'win32' ? 'ps1' : 'sh'}`;
      const response = await fetch(scriptUrl);
      if (!response.ok) {
        throw new Error(`下载安装脚本失败: HTTP ${response.status}`);
      }
      const scriptContent = await response.text();

      // 将脚本写入临时文件
      const { writeFileSync } = await import('node:fs');
      writeFileSync(scriptPath, scriptContent, 'utf-8');

      // 3. 执行安装脚本
      if (process.platform === 'win32') {
        await this._execProcess('powershell', [
          '-NoProfile', '-ExecutionPolicy', 'Bypass',
          '-File', scriptPath,
        ]);
      } else {
        // Unix: 先 chmod +x，再执行
        const { chmodSync } = await import('node:fs');
        chmodSync(scriptPath, 0o755);
        await this._execProcess('/bin/bash', [scriptPath]);
      }

      // 4. 清除缓存路径，重新查找
      this._cliPath = null;
      const installed = this._findCli();

      if (!installed) {
        return fail(getServerMessage('SKILLHUB_INSTALL_FAILED'));
      }

      return ok({ path: installed });
    } catch (err) {
      return fail(getServerMessage('SKILLHUB_INSTALL_FAILED') + ': ' + err.message);
    } finally {
      // 清理临时文件
      try {
        const { rmSync } = await import('node:fs');
        rmSync(tmpDir, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  }

  // ─── 搜索 Skill ──────────────────────────────────────────────

  /**
   * 通过 skillhub 搜索技能
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
   */
  async search(keyword) {
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return fail('搜索关键词不能为空');
    }

    const cliPath = this._findCli();
    if (!cliPath) {
      return fail(getServerMessage('SKILLHUB_NOT_INSTALLED'));
    }

    try {
      const raw = await this._execCli(['search', keyword.trim()]);
      const results = this._parseSearchResults(raw);
      return ok(results);
    } catch (err) {
      return fail(getServerMessage('SKILLHUB_SEARCH_FAILED') + ': ' + err.message);
    }
  }

  /**
   * 解析 skillhub search 输出
   * @param {string} raw - 原始输出
   * @returns {Array<{name: string, description: string, source: string}>}
   * @private
   */
  _parseSearchResults(raw) {
    const lines = raw.split('\n').filter(Boolean);
    const results = [];

    for (const line of lines) {
      // skillhub search 输出格式通常是 "name - description" 或 "name (source)"
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('No results') || trimmed.startsWith('Usage')) {
        continue;
      }
      // 尝试匹配 "name - description"
      const dashMatch = trimmed.match(/^(\S+)\s*[-–—]\s*(.+)/);
      if (dashMatch) {
        results.push({
          name: dashMatch[1].trim(),
          description: dashMatch[2].trim(),
          source: 'skillhub',
        });
        continue;
      }
      // 回退：整行作为 name
      results.push({
        name: trimmed.split(/\s+/)[0],
        description: trimmed,
        source: 'skillhub',
      });
    }

    return results;
  }

  // ─── 安装 Skill ──────────────────────────────────────────────

  /**
   * 通过 skillhub 安装一个技能
   *
   * 安装完成后自动调用 SkillManager.discover() 注册新技能。
   * 同时检查重复安装。
   *
   * @param {string} name - 技能名称
   * @returns {Promise<{success: boolean, data?: object|string, message?: string}>}
   */
  async installSkill(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return fail('技能名称不能为空');
    }

    const cliPath = this._findCli();
    if (!cliPath) {
      return fail(getServerMessage('SKILLHUB_NOT_INSTALLED'));
    }

    try {
      const raw = await this._execCli(['install', name.trim()]);
      // 安装完成后触发 skill discover
      this._skillMgr.discover();
      return ok({ output: raw.trim() }, getServerMessage('SKILLHUB_INSTALL_SKILL_OK'));
    } catch (err) {
      // skillhub install 可能返回非零退出码（例如已安装）
      const msg = err.message || '';
      if (msg.includes('already') || msg.includes('已安装')) {
        return fail(getServerMessage('SKILL_ALREADY_INSTALLED'));
      }
      return fail(getServerMessage('SKILLHUB_INSTALL_SKILL_FAILED') + ': ' + msg);
    }
  }

  // ─── 底层命令执行 ────────────────────────────────────────────

  /**
   * 执行 skillhub CLI 命令
   * @param {string[]} args - 命令参数
   * @returns {Promise<string>} - 标准输出
   * @private
   */
  _execCli(args) {
    return new Promise((resolve, reject) => {
      const cliPath = this._findCli();
      if (!cliPath) {
        return reject(new Error('skillhub CLI not found'));
      }

      // Windows 上 .bat/.cmd 需要 shell=true 才能执行
      const needsShell = process.platform === 'win32' &&
        (cliPath.endsWith('.bat') || cliPath.endsWith('.cmd'));

      const options = {
        maxBuffer: 1024 * 1024, // 1MB
        timeout: 30000,         // 30s
        ...(needsShell ? { shell: true } : {}),
      };

      execFile(cliPath, args, options, (err, stdout, stderr) => {
        if (err) {
          // 合并 stderr 到错误消息以便调试
          const detail = stderr ? stderr.trim() : '';
          err.message = detail || err.message;
          return reject(err);
        }
        resolve(stdout || '');
      });
    });
  }

  /**
   * 执行任意进程（用于安装脚本）
   * @param {string} cmd - 可执行文件路径
   * @param {string[]} args - 参数
   * @returns {Promise<string>}
   * @private
   */
  _execProcess(cmd, args) {
    return new Promise((resolve, reject) => {
      execFile(cmd, args, {
        maxBuffer: 1024 * 1024,
        timeout: 120000, // 2min 用于安装
      }, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout || '');
      });
    });
  }
}
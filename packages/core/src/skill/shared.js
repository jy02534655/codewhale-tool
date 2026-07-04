/**
 * Skill 共享辅助函数
 * 供各职责子模块共同使用，避免循环依赖
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { getServerMessage } from '../utils/i18n.js';
import { writeSkillLog } from '../download/index.js';

/**
 * 发送 skill 安装日志
 * @param {Function} [onLog]
 * @param {string} level
 * @param {Object} options
 */
export function emitSkillInstallLog(onLog, level, options) {
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

/**
 * 从 SKILL.md 内容中提取名称和描述
 * @param {string} content
 * @returns {{name: string, description: string}}
 */
export function _parseReadmeMeta(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let description = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!name && line.startsWith('# ')) {
      name = line.slice(2).trim();
      continue;
    }
    if (name && !description && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('---')) {
      description = line;
      break;
    }
  }

  if (!name) name = lines[0] || '';
  return { name, description };
}

/**
 * 从磁盘读取 SKILL.md 并提取元数据
 * @param {string} skillPath
 * @returns {{name: string, description: string}}
 */
export function _extractMeta(skillPath) {
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
 * @param {string} repoUrl
 * @returns {{owner: string, repo: string}|null}
 */
export function _parseGitHubUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * 将代理 URL 字符串解析为结构化代理配置
 * @param {string} proxyUrl
 * @returns {{type: string, host: string, port: number, auth?: {username: string, password: string}}|undefined}
 */
export function _parseProxyUrl(proxyUrl) {
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

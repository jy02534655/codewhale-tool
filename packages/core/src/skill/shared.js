/**
 * Skill 共享辅助函数
 * 供各职责子模块共同使用，避免循环依赖
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { getServerMessage } from '../utils/i18n.js';
import { writeSkillLog } from '../download/index.js';
import { formatTimestamp } from '../utils/logger.js';

/**
 * 发送 skill 安装日志
 * 同时输出到前端回调（SSE）和写入本地日志文件
 * @param {Function} [onLog] - 前端日志回调，用于 SSE 推送
 * @param {string} level - 日志级别：'INFO' / 'ERROR'
 * @param {Object} options - 日志选项
 * @param {string} [options.message] - 直接使用的日志消息
 * @param {string} [options.key] - 多语言消息键
 * @param {Object} [options.params] - 多语言消息参数
 * @param {Object} [options.extra] - 额外数据
 */
export function emitSkillInstallLog(onLog, level, options) {
  // 如果直接提供了 message，优先使用，不经过多语言翻译
  if (options.message) {
    const line = `[${formatTimestamp()}] [${level}] ${options.message}`;
    if (onLog) {
      onLog({ level, message: line });
    }
    writeSkillLog(level, options.message, undefined, { rawMessage: true });
    return;
  }

  // 通过多语言 key 获取消息，用于国际化
  const message = getServerMessage(options.key, options.params);
  const line = `[${formatTimestamp()}] [${level}] ${message}`;
  if (onLog) {
    onLog({ level, message: line });
  }
  writeSkillLog(level, options.key, options.params, options.extra);
}

/**
 * 从 SKILL.md 内容中提取名称和描述
 * 解析规则：
 * 1. 第一个一级标题（# xxx）作为名称
 * 2. 标题后第一段非标题、非引用、非分隔线的文字作为描述
 * @param {string} content - SKILL.md 文件内容
 * @returns {{name: string, description: string}} 包含 name 和 description 的对象
 */
export function _parseReadmeMeta(content) {
  // 将内容按行拆分，去除首尾空格，过滤空行
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let description = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 找到第一个一级标题，提取为名称
    if (!name && line.startsWith('# ')) {
      name = line.slice(2).trim();
      continue;
    }
    // 找到名称后的第一个非标题、非引用、非分隔线的行，提取为描述
    if (name && !description && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('---')) {
      description = line;
      break;
    }
  }

  // 兜底：如果没找到标题，使用第一行作为名称
  if (!name) name = lines[0] || '';
  return { name, description };
}

/**
 * 从磁盘读取 SKILL.md 并提取元数据
 * @param {string} skillPath - skill 目录路径
 * @returns {{name: string, description: string}} 包含 name 和 description 的对象
 */
export function _extractMeta(skillPath) {
  const readmePath = join(skillPath, 'SKILL.md');
  // 如果 SKILL.md 不存在，返回目录名作为名称
  if (!existsSync(readmePath)) return { name: basename(skillPath), description: '' };
  try {
    const content = readFileSync(readmePath, 'utf-8');
    return _parseReadmeMeta(content);
  } catch {
    // 读取失败时回退到目录名
    return { name: basename(skillPath), description: '' };
  }
}

/**
 * 解析 GitHub URL，提取 owner 和 repo
 * 支持的格式：
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/
 * @param {string} repoUrl - GitHub 仓库 URL
 * @returns {{owner: string, repo: string}|null} 解析成功返回 owner 和 repo，失败返回 null
 */
export function _parseGitHubUrl(repoUrl) {
  // 移除 .git 后缀和末尾斜杠
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  // 匹配 github.com/owner/repo 格式
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * 将代理 URL 字符串解析为结构化代理配置
 * @param {string} proxyUrl - 代理 URL，如 http://proxy:8080 或 socks5://proxy:1080
 * @returns {{type: string, host: string, port: number, auth?: {username: string, password: string}}|undefined}
 * 返回包含 type、host、port 的可选 auth 的对象，解析失败返回 undefined
 */
export function _parseProxyUrl(proxyUrl) {
  if (!proxyUrl) return undefined;
  try {
    const url = new URL(proxyUrl);
    // 根据协议前缀判断代理类型
    const type = proxyUrl.startsWith('http') ? 'http' : 'socks5';
    return {
      type,
      host: url.hostname,
      // 如果 URL 中没指定端口，使用默认端口
      port: parseInt(url.port) || (type === 'http' ? 80 : 1080),
      // 如果 URL 中包含用户名密码，进行 URL 解码后返回
      auth: url.username
        ? { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) }
        : undefined,
    };
  } catch {
    // URL 解析失败，返回 undefined 表示没有有效代理配置
    return undefined;
  }
}

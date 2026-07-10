/**
 * download/utils.js — 下载工具函数和共享常量
 *
 * 提供 download 层各策略共用的工具函数，确保下载流程语义一致。
 * 所有下载策略都应使用此文件中的工具，避免散落重复代码。
 *
 * @module download/utils
 */
import path from 'node:path';
import ProxyAgent from 'proxy-agent';
import { getServerMessage } from '../utils/i18n.js';
import { formatBytes } from '../utils/logger.js';
// ===================== 下载阶段常量 =====================
/**
 * 统一维护下载流程会发送给前端的阶段语义，避免各下载策略自行发散命名。
 *
 * 前端根据这些阶段名展示不同的进度提示和 UI 状态。
 * 新增阶段时应在此处统一注册，并在前端 locales 中补充对应文案。
 */
export const DOWNLOAD_STAGES = {
  CONNECTING: 'connecting',
  DETECTED: 'detected',
  SIZING: 'sizing',
  FETCHING_TREE: 'fetching-tree',
  DOWNLOADING: 'downloading',
  EXTRACTING: 'extracting',
  FALLBACK: 'fallback',
  CLONING: 'cloning',
  CHECKOUT: 'checkout',
  COPYING: 'copying',
  REGISTERING: 'registering',
  DONE: 'done',
};
// ===================== 代理配置 =====================
/**
 * 统一定义受支持的代理协议到 URL 协议头的映射。
 *
 * 下载层统一使用此映射，避免各策略散落重复的 if/else 判断。
 * 新增代理类型时应在此处补充映射关系。
 */
const PROXY_PROTOCOL_MAP = {
  http: 'http:',
  https: 'https:',
  socks5: 'socks5:',
  socks4: 'socks4:',
};
/**
 * 将结构化代理配置转换成各下载实现都可复用的代理 URL。
 *
 * 输入示例：
 *   { type: 'http', host: '127.0.0.1', port: 7890 }
 *   输出：'http://127.0.0.1:7890'
 *
 *   带认证：
 *   { type: 'http', host: '127.0.0.1', port: 7890, auth: { username: 'user', password: 'pass' } }
 *   输出：'http://user:pass@127.0.0.1:7890'
 *
 * @param {object} proxy - 代理配置对象
 * @param {string} [proxy.type] - 代理类型：http / https / socks5 / socks4 / none
 * @param {string} proxy.host - 代理主机地址
 * @param {number} proxy.port - 代理端口
 * @param {object} [proxy.auth] - 认证信息
 * @param {string} [proxy.auth.username] - 用户名
 * @param {string} [proxy.auth.password] - 密码
 * @returns {string} 代理 URL，无代理或代理类型为 none 时返回空字符串
 * @throws {Error} 不支持的代理类型
 */
export function proxyToUrl(proxy) {
  if (!proxy || proxy.type === 'none' || proxy.type === '') return '';
  const protocol = PROXY_PROTOCOL_MAP[proxy.type];
  if (!protocol) {
    throw new Error(getServerMessage('skillErrorUnsupportedProxy', { type: proxy.type }));
  }
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username || '')}:${encodeURIComponent(proxy.auth.password || '')}@`
    : '';
  return `${protocol}//${auth}${proxy.host}:${proxy.port}`;
}
/**
 * 将结构化代理配置转换为 fetch / undici 可直接使用的 dispatcher。
 *
 * 返回 ProxyAgent 实例，供 fetch 的 dispatcher 参数使用。
 * 无代理时返回 undefined，fetch 会使用默认网络栈。
 *
 * 与 proxyToUrl 的区别：
 *   - proxyToUrl 返回 URL 字符串，用于 git CLI 等需要 URL 的场景
 *   - createAgent 返回 Agent 实例，用于 Node.js fetch / undici 等需要 dispatcher 的场景
 *
 * @param {object} proxy - 代理配置对象
 * @returns {ProxyAgent|undefined} 代理实例或 undefined
 */
export function createAgent(proxy) {
  const url = proxyToUrl(proxy);
  if (!url) return undefined;
  return new ProxyAgent(url);
}
/**
 * 统一补齐下载进度缺省字段并计算下载速度，减少各策略分支拼装事件对象的重复代码。
 *
 * 使用滑动窗口算法计算下载速度，每 0.3 秒更新一次，避免速度值跳动过大。
 *
 * @param {Function} onProgress - 进度回调函数，由上层传入，通常用于 SSE 推送给前端
 * @param {string} stage - 当前阶段，对应 DOWNLOAD_STAGES
 * @param {number} percent - 当前进度百分比（0-100）
 * @param {string} message - 进度提示文本，已由 i18n 翻译
 * @param {object} [extra={}] - 额外字段，会合并到事件对象中
 */
export function emitProgress(onProgress, stage, percent, message, extra = {}) {
  if (!onProgress) return;
  onProgress({ stage, percent, message, ...extra });
}
/**
 * 解析 GitHub 仓库 URL，提取 owner 和 repo。
 *
 * 接受的 URL 格式：
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo/
 *   - https://github.com/owner/repo.git
 *
 * 注意：只接受 github.com 域名，不接受其他 Git 托管服务。
 *
 * @param {string} repoUrl - GitHub 仓库 URL
 * @returns {{ owner: string, repo: string }} 解析结果
 * @throws {Error} URL 格式不正确或不是 GitHub 域名
 */
export function parseRepoUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(getServerMessage('skillErrorInvalidGithubUrl', { url: repoUrl }));
  return { owner: match[1], repo: match[2] };
}
/**
 * parseGithubTreeUrl — 解析 GitHub Tree URL
 *
 * 从 GitHub 的 tree 页面 URL 中提取 owner、repo、branch 和路径。
 * 用于用户通过浏览器访问 GitHub 仓库某个子目录时，直接复用该 URL 安装 skill。
 *
 * 输入示例：
 *   https://github.com/owner/repo/tree/main/skills/my-skill
 *   https://github.com/owner/repo/tree/main/skills/my-skill/sub-dir
 *   https://github.com/owner/repo/tree/main
 *
 * 输出示例：
 *   { owner: 'owner', repo: 'repo', branch: 'main', path: 'skills/my-skill' }
 *   { owner: 'owner', repo: 'repo', branch: 'main', path: '' }
 *
 * @param {string} url - GitHub tree URL
 * @returns {{ owner: string, repo: string, branch: string, path: string }|null} 解析结果，非 tree URL 返回 null
 */
export function parseGithubTreeUrl(url) {
  const cleaned = url.replace(/\?.*$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (!match) {
    // 尝试无 path 的情况: github.com/owner/repo/tree/branch
    const simple = cleaned.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)/);
    if (!simple) return null;
    return { owner: simple[1], repo: simple[2], branch: simple[3], path: '' };
  }
  return { owner: match[1], repo: match[2], branch: match[3], path: match[4] };
}
/**
 * 统一补齐下载进度缺省字段并计算下载速度，减少各策略分支拼装事件对象的重复代码。
 *
 * 使用滑动窗口算法计算下载速度，每 0.3 秒更新一次，避免速度值跳动过大。
 *
 * @param {Function} onProgress - 进度回调函数，由上层传入
 * @param {string} stage - 当前阶段
 * @param {number} percent - 当前进度百分比
 * @param {string} message - 进度提示文本
 * @param {object} [extra={}] - 额外字段
 */
export class ProgressEmitter {
  /**
   * 创建进度发射器
   * @param {Function} onProgress - 进度回调函数
   */
  constructor(onProgress) {
    this.onProgress = onProgress || (() => {});
    this.startTime = Date.now();
    this.lastTime = Date.now();
    this.lastBytes = 0;
    this.speed = 0;
  }
  /**
   * 发送进度事件
   * @param {object} data - 进度数据
   * @param {number} data.downloaded - 已下载字节数
   * @param {number} [data.total] - 总字节数
   * @param {number} [data.completed] - 已完成文件数
   * @param {number} [data.totalFiles] - 总文件数
   */
  emit(data) {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    if (dt >= 0.3) {
      this.speed = (data.downloaded - this.lastBytes) / dt;
      this.lastTime = now;
      this.lastBytes = data.downloaded;
    }
    this.onProgress({
      ...data,
      speed: this.speed,
      speedFormatted: formatBytes(this.speed) + '/s',
    });
  }
}
/**
 * 按 renameMap 将仓库内路径映射到目标目录中的最终路径。
 *
 * renameMap 支持两种映射方式：
 *   1. 目录映射：oldName 以 '/' 结尾，表示将路径前缀替换为新目录名
 *      例如：{ 'skills/my-skill/': 'my-skill/' }
 *      将 'skills/my-skill/commands/cmd.js' 映射为 'my-skill/commands/cmd.js'
 *   2. 文件映射：oldName 为具体文件名，表示重命名文件
 *      例如：{ 'README.md': 'GUIDE.md' }
 *      如果 newName 是函数，则调用函数处理路径，支持动态重命名逻辑
 *
 * @param {string} filePath - 仓库内的原始文件路径
 * @param {object} [renameMap] - 重命名映射表
 * @returns {string} 映射后的目标路径
 */
export function applyRenameMap(filePath, renameMap) {
  if (!renameMap) return filePath;
  let result = filePath;
  for (const [oldName, newName] of Object.entries(renameMap)) {
    if (oldName.endsWith('/')) {
      // 目录映射：将路径前缀替换为新目录名
      if (result.startsWith(oldName)) {
        result = newName + result.slice(oldName.length);
      }
    } else if (result === oldName || path.basename(result) === oldName) {
      // 文件映射：重命名文件
      if (typeof newName === 'function') {
        result = newName(result);
      } else {
        result = result === oldName ? newName : path.join(path.dirname(result), newName);
      }
    }
  }
  return result;
}

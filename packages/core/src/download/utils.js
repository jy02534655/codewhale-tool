import path from 'node:path';
import ProxyAgent from 'proxy-agent';
import { getServerMessage } from '../utils/i18n.js';
import { formatBytes } from '../utils/logger.js';

// 统一维护下载流程会发送给前端的阶段语义，避免各下载策略自行发散命名。
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

// 统一定义受支持的代理协议到 URL 协议头的映射。
const PROXY_PROTOCOL_MAP = {
  http: 'http:',
  https: 'https:',
  socks5: 'socks5:',
  socks4: 'socks4:',
};

// 将代理配置转换成各下载实现都可复用的代理 URL。
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

// 将结构化代理配置转换为 fetch / undici 可直接使用的 dispatcher。
export function createAgent(proxy) {
  const url = proxyToUrl(proxy);
  if (!url) return undefined;
  return new ProxyAgent(url);
}

// 将通用阶段名与消息统一打包，减少各下载策略手写 stage 常量。
export function emitProgress(onProgress, stage, percent, message, extra = {}) {
  if (!onProgress) return;
  onProgress({ stage, percent, message, ...extra });
}

// 解析 GitHub 仓库 URL，只接受 owner/repo 语义，避免下载层散落重复正则。
export function parseRepoUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(getServerMessage('skillErrorInvalidGithubUrl', { url: repoUrl }));
  return { owner: match[1], repo: match[2] };
}

/**
 * parseGithubTreeUrl — 解析 GitHub Tree URL
 * 输入: https://github.com/owner/repo/tree/branch/path/to/skill
 * 输出: { owner, repo, branch, path }
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

// 统一补齐下载进度缺省字段并计算下载速度，减少各策略分支拼装事件对象的重复代码。
export class ProgressEmitter {
  constructor(onProgress) {
    this.onProgress = onProgress || (() => {});
    this.startTime = Date.now();
    this.lastTime = Date.now();
    this.lastBytes = 0;
    this.speed = 0;
  }

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

// 按 renameMap 将仓库内路径映射到目标目录中的最终路径。
export function applyRenameMap(filePath, renameMap) {
  if (!renameMap) return filePath;
  let result = filePath;

  for (const [oldName, newName] of Object.entries(renameMap)) {
    if (oldName.endsWith('/')) {
      if (result.startsWith(oldName)) {
        result = newName + result.slice(oldName.length);
      }
    } else if (result === oldName || path.basename(result) === oldName) {
      if (typeof newName === 'function') {
        result = newName(result);
      } else {
        result = result === oldName ? newName : path.join(path.dirname(result), newName);
      }
    }
  }
  return result;
}
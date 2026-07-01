import path from 'node:path';
import ProxyAgent from 'proxy-agent';
import { getServerMessage } from '../utils/i18n.js';
import { formatBytes } from '../utils/logger.js';

export function createAgent(proxy) {
  if (!proxy || proxy.type === 'none' || proxy.type === '') return undefined;
  const protocolMap = {
    http: 'http:',
    https: 'https:',
    socks5: 'socks5:',
    socks4: 'socks4:',
  };
  const protocol = protocolMap[proxy.type];
  if (!protocol) {
    throw new Error(getServerMessage('SKILL_ERROR_UNSUPPORTED_PROXY', { type: proxy.type }));
  }
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username || '')}:${encodeURIComponent(proxy.auth.password || '')}@`
    : '';
  const url = `${protocol}//${auth}${proxy.host}:${proxy.port}`;
  return new ProxyAgent(url);
}

export function parseRepoUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(getServerMessage('SKILL_ERROR_INVALID_GITHUB_URL', { url: repoUrl }));
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
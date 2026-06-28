/**
 * download/utils.js — 下载模块公共工具
 *
 * 从原 download.js 提取的通用工具函数。
 * createAgent 只支持结构化代理配置 {type, host, port, auth}。
 *
 * @module download/utils
 */

import path from 'node:path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { getServerMessage } from '../utils/i18n.js';
import { formatBytes } from '../utils/logger.js';

export function createAgent(proxy) {
  if (!proxy || proxy.type === 'none' || proxy.type === '') return undefined;
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username || '')}:${encodeURIComponent(proxy.auth.password || '')}@`
    : '';
  const url = proxy.type === 'http'
    ? `http://${auth}${proxy.host}:${proxy.port}`
    : `socks5://${auth}${proxy.host}:${proxy.port}`;

  if (proxy.type === 'http') return new HttpsProxyAgent(url);
  if (proxy.type === 'socks5') return new SocksProxyAgent(url);
  throw new Error(getServerMessage('SKILL_ERROR_UNSUPPORTED_PROXY', { type: proxy.type }));
}

export function parseRepoUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(getServerMessage('SKILL_ERROR_INVALID_GITHUB_URL', { url: repoUrl }));
  return { owner: match[1], repo: match[2] };
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
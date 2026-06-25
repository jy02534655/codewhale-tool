/**
 * download-skill.js — 从 GitHub 仓库下载 Skill 的核心模块
 *
 * 基于 demo/skill-downloader-final.mjs，使用 node-fetch 确保
 * res.body 为 Node.js Readable 流原生支持 .pipe()。
 *
 * 功能：
 *   - ProgressEmitter：带速度计算的进度发射器
 *   - HEAD 大小探测 + 策略路由（<5MB Tar，≥5MB API）
 *   - 双层 prefix 探测 + 空目录检测 fallback
 *   - 文件重命名（renameMap）
 *   - 结构化代理配置（HTTP/SOCKS5）
 *   - GitHub Token 支持
 *
 * @module download-skill
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { PassThrough } from 'node:stream';

import fetch from 'node-fetch';
import * as tar from 'tar';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

// ===================== 工具函数 =====================

/**
 * 根据结构化代理配置创建 agent
 * @param {{type?: string, host?: string, port?: number, auth?: {username?: string, password?: string}}} proxy
 * @returns {import('node:http').Agent|undefined}
 */
function createAgent(proxy) {
  if (!proxy || proxy.type === 'none' || proxy.type === '') return undefined;
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username || '')}:${encodeURIComponent(proxy.auth.password || '')}@`
    : '';
  const url = proxy.type === 'http'
    ? `http://${auth}${proxy.host}:${proxy.port}`
    : `socks5://${auth}${proxy.host}:${proxy.port}`;

  if (proxy.type === 'http') return new HttpsProxyAgent(url);
  if (proxy.type === 'socks5') return new SocksProxyAgent(url);
  throw new Error(`不支持的代理协议: ${proxy.type}`);
}

/**
 * 格式化字节数为可读字符串
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 解析 GitHub URL
 * @param {string} repoUrl
 * @returns {{owner: string, repo: string}}
 */
function parseRepoUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(`无效的 GitHub URL: ${repoUrl}`);
  return { owner: match[1], repo: match[2] };
}

/**
 * 应用文件重命名映射
 * @param {string} filePath
 * @param {Record<string, string|Function>} [renameMap]
 * @returns {string}
 */
function applyRenameMap(filePath, renameMap) {
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

// ===================== 进度发射器 =====================

/**
 * 进度发射器 — 带速度计算（每 300ms 采样）
 */
class ProgressEmitter {
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
      speedFormatted: formatBytes(this.speed) + '/s'
    });
  }
}

// ===================== 方案 A：Tar 流式解压 =====================

/**
 * Tar 流式下载 + 解压
 *
 * 使用 node-fetch 直接 pipe（res.body 是 Node.js Readable）
 *
 * @param {{owner:string, repo:string, branch:string, skillPrefix:string,
 *         targetDir:string, agent?:import('node:http').Agent,
 *         onProgress?:Function, renameMap?:Record<string,string|Function>}} opts
 * @returns {Promise<string>} targetDir
 */
async function downloadViaTar({ owner, repo, branch, skillPrefix, targetDir, agent, onProgress, renameMap }) {
  const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  const repoPrefix = `${repo}-${branch}/`;

  const res = await fetch(downloadUrl, { agent, headers: { 'User-Agent': 'codewhale-downloader' } });
  if (!res.ok) throw new Error(`下载失败: HTTP ${res.status}`);

  const total = parseInt(res.headers.get('content-length') || 0) || null;
  const emitter = new ProgressEmitter(onProgress);
  let downloaded = 0;
  let extractedFiles = 0;

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  // 进度监控 PassThrough
  const progressStream = new PassThrough();
  progressStream.on('data', (chunk) => {
    downloaded += chunk.length;
    emitter.emit({
      stage: 'download',
      downloaded,
      total,
      percent: total ? (downloaded / total) * 100 : null,
      currentFile: `${owner}/${repo}.tar.gz`,
      completed: 0,
      totalFiles: 1
    });
  });

  // Tar 解压器 — filter+map 而非 strip，避免子路径丢失
  const extractor = tar.extract({
    cwd: targetDir,
    filter: (entryPath) => {
      return entryPath.startsWith(`${repoPrefix}${skillPrefix}`);
    },
    map: (header) => {
      let relative = header.name.replace(`${repoPrefix}${skillPrefix}`, '');
      relative = applyRenameMap(relative, renameMap);
      header.name = relative;
      return header;
    }
  });

  extractor.on('entry', () => {
    extractedFiles++;
    emitter.emit({
      stage: 'extract',
      downloaded,
      total,
      percent: total ? (downloaded / total) * 100 : null,
      filesExtracted: extractedFiles
    });
  });

  // 流式管道
  const gunzip = zlib.createGunzip();

  return new Promise((resolve, reject) => {
    res.body.on('error', reject);
    progressStream.on('error', reject);
    gunzip.on('error', reject);
    extractor.on('error', reject);
    extractor.on('finish', () => {
      emitter.emit({ stage: 'complete', downloaded, total, percent: 100, currentFile: null, completed: 1, totalFiles: 1 });
      resolve(targetDir);
    });

    res.body
      .pipe(progressStream)
      .pipe(gunzip)
      .pipe(extractor);
  });
}

// ===================== 方案 B：API 并发下载 =====================

/**
 * 通过 GitHub Tree API 并发下载（仅下载目标文件夹中的文件）
 *
 * @param {{owner:string, repo:string, branch:string, skillPrefix:string,
 *         targetDir:string, agent?:import('node:http').Agent,
 *         token?:string, onProgress?:Function,
 *         renameMap?:Record<string,string|Function>}} opts
 * @returns {Promise<string>} targetDir
 */
async function downloadViaApi({ owner, repo, branch, skillPrefix, targetDir, agent, token, onProgress, renameMap }) {
  const apiHeaders = {
    'User-Agent': 'codewhale-downloader',
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { Authorization: `token ${token}` })
  };

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { agent, headers: apiHeaders });

  const treeData = await treeRes.json().catch(() => ({}));
  if (treeRes.status === 403 && treeData.message?.includes('rate limit')) {
    throw new Error('GitHub API 速率限制已达到！请提供 token。');
  }
  if (!treeRes.ok) throw new Error(`Tree API 失败: ${treeRes.status}`);

  const { tree } = treeData;
  const files = tree.filter(f => f.type === 'blob' && f.path.startsWith(skillPrefix));
  if (!files.length) throw new Error(`前缀 "${skillPrefix}" 下未找到文件`);

  const totalFiles = files.length;
  const downloadUrlBase = `https://api.github.com/repos/${owner}/${repo}/contents`;

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const emitter = new ProgressEmitter(onProgress);
  let completed = 0;

  // 下载单个文件
  async function downloadFile(filePath) {
    let relative = filePath.replace(skillPrefix, '');
    relative = applyRenameMap(relative, renameMap);
    const destPath = path.join(targetDir, relative);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const fileUrl = `${downloadUrlBase}/${filePath}`;
    const fileRes = await fetch(fileUrl, { agent, headers: { ...apiHeaders, Accept: 'application/vnd.github.raw+json' } });
    if (!fileRes.ok) throw new Error(`下载 ${filePath} 失败: HTTP ${fileRes.status}`);

    const total = parseInt(fileRes.headers.get('content-length') || 0) || null;
    let downloaded = 0;
    const wStream = fs.createWriteStream(destPath);

    return new Promise((resolve, reject) => {
      fileRes.body.on('error', reject);
      wStream.on('error', reject);
      wStream.on('finish', () => {
        completed++;
        emitter.emit({
          stage: 'download',
          downloaded,
          total,
          percent: total && downloaded ? (downloaded / total) * 100 : null,
          currentFile: filePath,
          completed,
          totalFiles
        });
        resolve();
      });

      // 如果是 node-fetch，res.body 是 Node.js Readable
      fileRes.body.pipe(wStream);
    });
  }

  // 5 并发下载
  const concurrency = 5;
  const queue = [...files];
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const f = queue.shift();
        await downloadFile(f.path);
      }
    })());
  }
  await Promise.all(workers);

  return targetDir;
}

// ===================== 策略路由 =====================

/**
 * 探测 tarball 大小（HEAD 请求）
 * @returns {Promise<number|null>} 字节数或 null（无法探测）
 */
async function detectTarballSize(owner, repo, branch, agent) {
  const checkUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  try {
    const headRes = await fetch(checkUrl, { agent, method: 'HEAD', headers: { 'User-Agent': 'codewhale-downloader' } });
    if (headRes.ok) {
      const cl = parseInt(headRes.headers.get('content-length') || 0) || null;
      return cl;
    }
  } catch { /* 忽略 */ }
  return null;
}

/**
 * 通过 Tree API 探测 skill 前缀
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} skillName — 用户输入的 skill 路径，如 "frontend-design" 或 "skills/frontend-design"
 * @param {string} branch
 * @param {import('node:http').Agent} [agent]
 * @param {string} [token]
 * @returns {Promise<{prefix: string}>} 匹配到的前缀
 */
async function detectSkillPrefix(owner, repo, skillName, branch, agent, token) {
  // 如果 skillName 本身包含路径（如 "skills/frontend-design"），直接使用
  if (skillName.includes('/')) {
    const normalized = skillName.replace(/\/+$/, '') + '/';
    return { prefix: normalized };
  }

  const candidatePrefixes = [`skills/${skillName}/`, `${skillName}/`];
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const apiHeaders = {
    'User-Agent': 'codewhale-downloader',
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { Authorization: `token ${token}` })
  };

  // 通过 Tree API 快速探测
  try {
    const treeRes = await fetch(treeUrl, { agent, headers: apiHeaders });
    if (treeRes.ok) {
      const { tree } = await treeRes.json();
      for (const prefix of candidatePrefixes) {
        if (tree.some((f) => f.type === 'blob' && f.path.startsWith(prefix))) {
          return { prefix };
        }
      }
    }
  } catch { /* 忽略 */ }

  // API 不可用或未匹配 → 默认 skills/<skillName>/（社区仓库约定）
  return { prefix: candidatePrefixes[0] };
}

// ===================== 主入口 =====================

/**
 * 从 GitHub 仓库下载 Skill
 *
 * @param {object} opts
 * @param {string}  opts.repoUrl        — GitHub 仓库 URL
 * @param {string}  opts.skillName      — Skill 路径（如 "frontend-design" 或 "skills/frontend-design"）
 * @param {string}  opts.destDir        — 目标安装目录
 * @param {{type?: string, host?: string, port?: number, auth?: {username?: string, password?: string}}} [opts.proxy]
 *                                        — 结构化代理配置
 * @param {string}  [opts.token]        — GitHub Token（用于私有仓库或提高 API 速率限制）
 * @param {Record<string, string|Function>} [opts.renameMap] — 文件重命名映射
 * @param {Function} [opts.onProgress]  — 进度回调
 * @param {'project'|'global'} [opts.level] — 安装等级（仅用于进度消息）
 * @returns {Promise<{targetDir: string, extractedFiles: number, totalDownloaded: number}>}
 */
export async function downloadSkillFromGitHub({
  repoUrl,
  skillName,
  destDir,
  proxy,
  token,
  renameMap,
  onProgress,
  level
}) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const agent = createAgent(proxy);
  const branch = 'main';

  if (onProgress) {
    onProgress({ stage: 'connecting', percent: 5, message: '解析仓库...', speed: 0, speedFormatted: '' });
  }

  // 1. 探测 skill 前缀
  const { prefix } = await detectSkillPrefix(owner, repo, skillName, branch, agent, token);
  const skillPrefix = prefix;

  if (onProgress) {
    onProgress({ stage: 'detected', percent: 10, message: `已探测前缀: ${skillPrefix}`, speed: 0, speedFormatted: '' });
  }

  // 2. 探测 tarball 大小，决定策略
  const tarballSize = await detectTarballSize(owner, repo, branch, agent);

  if (onProgress) {
    onProgress({
      stage: 'sizing', percent: 15, message: tarballSize
        ? `Tarball 大小: ${formatBytes(tarballSize)}`
        : '无法探测大小，使用 Tar 流式方案',
      speed: 0, speedFormatted: ''
    });
  }

  let targetDir;
  const fallbackPrefixes = skillName.includes('/')
    ? []
    : [`skills/${skillName}/`, `${skillName}/`];

  // ─── 策略 A：小仓库（<5MB）→ Tar 流式下载 ───
  if (!tarballSize || tarballSize < 5 * 1024 * 1024) {
    if (onProgress) {
      onProgress({ stage: 'downloading', percent: 15, message: 'Tarball 流式下载...', speed: 0, speedFormatted: '' });
    }

    let tarSucceeded = false;
    let lastTarError;

    for (const candidatePrefix of [skillPrefix, ...fallbackPrefixes]) {
      try {
        targetDir = await downloadViaTar({
          owner, repo, branch,
          skillPrefix: candidatePrefix,
          targetDir: destDir,
          agent, onProgress, renameMap
        });

        // 检查是否提取到了文件
        const files = fs.readdirSync(targetDir);
        const hasSkillMd = fs.existsSync(path.join(targetDir, 'SKILL.md'));

        if (files.length > 0 && hasSkillMd) {
          tarSucceeded = true;
          break;
        }

        // 空目录或没有 SKILL.md → 尝试下一个 prefix
        if (candidatePrefix !== skillPrefix || files.length === 0 || !hasSkillMd) {
          if (onProgress) {
            onProgress({
              stage: 'fallback', percent: 50, message:
                `提取后无 SKILL.md (${files.length} 文件), 尝试下一个前缀`,
              speed: 0, speedFormatted: ''
            });
          }
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      } catch (tarErr) {
        lastTarError = tarErr;
        if (onProgress) {
          onProgress({
            stage: 'fallback', percent: 50, message: `Tar 失败 (${tarErr.message}), 尝试下一个前缀或回退 API`,
            speed: 0, speedFormatted: ''
          });
        }
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
      }
    }

    // Tar 全部失败 → 回退 API
    if (!tarSucceeded) {
      if (onProgress) {
        onProgress({ stage: 'fallback', percent: 50, message: '回退 API 并发下载...', speed: 0, speedFormatted: '' });
      }
      try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}

      const candidateFallback = [...new Set([skillPrefix, ...fallbackPrefixes])];
      let apiSucceeded = false;

      for (const candidatePrefix of candidateFallback) {
        try {
          targetDir = await downloadViaApi({
            owner, repo, branch,
            skillPrefix: candidatePrefix,
            targetDir: destDir,
            agent, token, onProgress, renameMap
          });

          if (fs.existsSync(path.join(targetDir, 'SKILL.md'))) {
            apiSucceeded = true;
            break;
          }
          try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
        } catch (apiErr) {
          try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 50, message: `API 前缀 "${candidatePrefix}" 也失败: ${apiErr.message}` });
          }
        }
      }

      if (!apiSucceeded) {
        throw new Error(lastTarError || '所有下载策略均失败');
      }
    }
  } else {
    // ─── 策略 B：大仓库（≥5MB）→ API 并发下载 ───
    if (onProgress) {
      onProgress({ stage: 'fetching-tree', percent: 15, message: '获取文件列表 (Tree API)...', speed: 0, speedFormatted: '' });
    }

    let apiSucceeded = false;

    for (const candidatePrefix of [skillPrefix, ...fallbackPrefixes]) {
      try {
        targetDir = await downloadViaApi({
          owner, repo, branch,
          skillPrefix: candidatePrefix,
          targetDir: destDir,
          agent, token, onProgress, renameMap
        });

        if (fs.existsSync(path.join(targetDir, 'SKILL.md'))) {
          apiSucceeded = true;
          break;
        }
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
      } catch (apiErr) {
        if (onProgress) {
          onProgress({ stage: 'fallback', percent: 50, message: `API 前缀 "${candidatePrefix}" 失败: ${apiErr.message}` });
        }
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch {}
      }
    }

    if (!apiSucceeded) {
      throw new Error('API 下载失败：所有前缀均未找到 SKILL.md');
    }
  }

  // 最终验证
  if (!fs.existsSync(path.join(destDir, 'SKILL.md'))) {
    throw new Error('SKILL.md 未找到');
  }

  if (onProgress) {
    onProgress({ stage: 'registering', percent: 90, message: '注册 Skill...', speed: 0, speedFormatted: '' });
  }

  return { targetDir: destDir };
}
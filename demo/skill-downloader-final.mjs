
/**
 * Skill Downloader - ESM Module (Final Fixed)
 * 
 * 关键修复：
 * 1. strip/filter/map 顺序：filter 在 strip 之前执行，所以 filter 看到的是原始路径
 * 2. 不使用 strip，完全依赖 map 来处理路径前缀
 * 3. tar 方案内部增加前缀 fallback 检测
 * 4. API 下载流错误时显式销毁响应
 * 5. treeRes 响应体只消费一次
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { PassThrough } from 'stream';

import fetch from 'node-fetch';
import * as tar from 'tar';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

// ===================== 工具函数 =====================

function createAgent(proxy) {
  if (!proxy || proxy.type === 'none') return undefined;
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username)}:${encodeURIComponent(proxy.auth.password)}@`
    : '';
  const url = proxy.type === 'http'
    ? `http://${auth}${proxy.host}:${proxy.port}`
    : `socks5://${auth}${proxy.host}:${proxy.port}`;

  if (proxy.type === 'http') return new HttpsProxyAgent(url);
  if (proxy.type === 'socks5') return new SocksProxyAgent(url);
  throw new Error(`Unsupported proxy type: ${proxy.type}`);
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

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

async function downloadViaTar({ owner, repo, branch, skillName, targetDir, agent, onProgress, renameMap, skillPrefix }) {
  const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  const repoPrefix = `${repo}-${branch}/`;

  const res = await fetch(downloadUrl, { agent, headers: { 'User-Agent': 'skill-downloader' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

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

  // 关键：不使用 strip，完全用 map 处理路径
  // filter 看到的是原始路径（如 skills-main/skills/find-skills/SKILL.md）
  // map 修改后 header.name 是相对 targetDir 的路径
  const extractor = tar.extract({
    cwd: targetDir,
    filter: (entryPath) => {
      return entryPath.startsWith(`${repoPrefix}${skillPrefix}`);
    },
    map: (header) => {
      // 从原始路径中移除 repoPrefix + skillPrefix
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

  // 手动 pipe 连接，确保错误被捕获
  const gunzip = zlib.createGunzip();

  return new Promise((resolve, reject) => {
    res.body.on('error', reject);
    progressStream.on('error', reject);
    gunzip.on('error', reject);
    extractor.on('error', reject);

    res.body
      .pipe(progressStream)
      .pipe(gunzip)
      .pipe(extractor)
      .on('finish', () => {
        emitter.emit({ stage: 'complete', downloaded, total, percent: 100, currentFile: null, completed: 1, totalFiles: 1 });
        resolve(targetDir);
      });
  });
}

// ===================== 方案 B：API 并发下载 =====================

async function downloadViaApi({ owner, repo, branch, skillName, targetDir, agent, onProgress, githubToken, renameMap, skillPrefix }) {
  const headers = {
    'User-Agent': 'skill-downloader',
    'Accept': 'application/vnd.github.v3+json',
    ...(githubToken && { Authorization: `token ${githubToken}` })
  };

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { agent, headers });

  // 先读取响应体，只消费一次
  const treeData = await treeRes.json().catch(() => ({}));
  if (treeRes.status === 403 && treeData.message?.includes('rate limit')) {
    throw new Error('GitHub API rate limit exceeded! Please provide a token.');
  }
  if (!treeRes.ok) throw new Error(`Tree API failed: ${treeRes.status}`);

  const { tree } = treeData;
  const files = tree.filter(f => f.type === 'blob' && f.path.startsWith(skillPrefix));
  if (!files.length) throw new Error(`Skill "${skillName}" not found at prefix "${skillPrefix}"`);

  const totalFiles = files.length;
  const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);
  const emitter = new ProgressEmitter(onProgress);
  let completed = 0;
  let downloaded = 0;

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const downloadFile = async (file) => {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
    let relativePath = file.path.replace(skillPrefix, '');
    relativePath = applyRenameMap(relativePath, renameMap);
    const localPath = path.join(targetDir, relativePath);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    for (let attempt = 1; attempt <= 3; attempt++) {
      let res = null;
      try {
        res = await fetch(rawUrl, { agent, headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const writer = fs.createWriteStream(localPath);
        let fileDownloaded = 0;
        const fileTotal = parseInt(res.headers.get('content-length') || 0) || file.size || 0;

        res.body.on('data', (chunk) => {
          fileDownloaded += chunk.length;
          downloaded += chunk.length;
          emitter.emit({
            stage: 'download',
            completed,
            totalFiles,
            downloaded,
            totalBytes,
            percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
            filePercent: fileTotal ? (fileDownloaded / fileTotal) * 100 : null,
            currentFile: file.path
          });
        });

        res.body.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', () => {
            completed++;
            emitter.emit({
              stage: 'download',
              completed,
              totalFiles,
              downloaded,
              totalBytes,
              percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
              filePercent: 100,
              currentFile: file.path
            });
            resolve();
          });
          writer.on('error', reject);
          res.body.on('error', reject);
        });

        return;
      } catch (err) {
        // 显式销毁响应流，避免资源泄漏
        if (res && res.body && !res.body.destroyed) {
          res.body.destroy();
        }
        if (attempt === 3) throw new Error(`Failed to download ${file.path}: ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  };

  const CONCURRENCY = 5;
  const queue = [...files];

  async function worker() {
    while (queue.length > 0) {
      await downloadFile(queue.shift());
    }
  }

  await Promise.all(
    Array(Math.min(CONCURRENCY, files.length)).fill().map(() => worker())
  );

  emitter.emit({
    stage: 'complete',
    downloaded,
    totalBytes,
    percent: 100,
    completed,
    totalFiles
  });

  return targetDir;
}

// ===================== 主入口 =====================

export async function downloadSkill(options) {
  const {
    repoUrl,
    skillName,
    destDir,
    savePath,
    renameMap = null,
    token = null,
    proxy = null,
    onProgress = null,
    branch = 'main'
  } = options;

  if (!repoUrl || !skillName) throw new Error('Missing required parameters: repoUrl, skillName');

  const { owner, repo } = parseRepoUrl(repoUrl);
  const agent = createAgent(proxy);

  const targetDir = savePath
    ? path.resolve(savePath)
    : destDir
      ? path.resolve(destDir, skillName)
      : path.resolve(skillName);

  // 探测 tarball 大小
  const tarballUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  let tarballSize = Infinity;
  try {
    const headRes = await fetch(tarballUrl, { method: 'HEAD', agent, headers: { 'User-Agent': 'skill-downloader' } });
    if (headRes.ok) tarballSize = parseInt(headRes.headers.get('content-length') || 0) || Infinity;
  } catch {}

  const FIVE_MB = 5 * 1024 * 1024;

  // 候选前缀
  const candidatePrefixes = [`skills/${skillName}/`, `${skillName}/`];
  let chosenPrefix = candidatePrefixes[0];

  // 如果 tarball 较大或无法探测，用 API 探测真实前缀
  if (tarballSize >= FIVE_MB || !isFinite(tarballSize)) {
    const headers = {
      'User-Agent': 'skill-downloader',
      'Accept': 'application/vnd.github.v3+json',
      ...(token && { Authorization: `token ${token}` })
    };
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    try {
      const treeRes = await fetch(treeUrl, { agent, headers });
      if (treeRes.ok) {
        const { tree } = await treeRes.json();
        for (const prefix of candidatePrefixes) {
          if (tree.some(f => f.type === 'blob' && f.path.startsWith(prefix))) {
            chosenPrefix = prefix;
            break;
          }
        }
      }
    } catch {}
  }

  // 策略路由
  if (tarballSize < FIVE_MB) {
    // 小仓库用 tar 方案，但增加空目录检测 fallback
    try {
      const result = await downloadViaTar({
        owner, repo, branch, skillName, targetDir, agent, onProgress, renameMap, skillPrefix: chosenPrefix
      });
      // 检查是否提取到了文件
      const files = fs.readdirSync(result, { recursive: true });
      const hasFiles = files.some(f => fs.statSync(path.join(result, f)).isFile());
      if (hasFiles) return result;
      // 空目录，尝试另一个前缀
      throw new Error('Empty extraction, try fallback prefix');
    } catch (err) {
      if (err.message.includes('try fallback prefix') && chosenPrefix !== candidatePrefixes[1]) {
        chosenPrefix = candidatePrefixes[1];
        return downloadViaTar({
          owner, repo, branch, skillName, targetDir, agent, onProgress, renameMap, skillPrefix: chosenPrefix
        });
      }
      throw err;
    }
  } else {
    return downloadViaApi({
      owner, repo, branch, skillName, targetDir, agent, onProgress, githubToken: token, renameMap, skillPrefix: chosenPrefix
    });
  }
}

export function createTerminalProgress() {
  let lastLine = '';
  return (info) => {
    let line = '';
    if (info.stage === 'download') {
      if (info.totalFiles > 1) {
        line = `⬇ ${info.percent?.toFixed(1) ?? '?'}% (${info.completed}/${info.totalFiles}) ${info.currentFile ?? ''} @ ${info.speedFormatted}`;
      } else {
        line = `⬇ ${info.percent?.toFixed(1) ?? '?'}% of tarball @ ${info.speedFormatted}`;
      }
    } else if (info.stage === 'extract') {
      line = `📦 Extracted ${info.filesExtracted} files...`;
    } else if (info.stage === 'complete') {
      line = `✅ Complete! ${info.completed}/${info.totalFiles} files`;
    }
    if (line !== lastLine) {
      process.stdout.write(`\r${line}${' '.repeat(Math.max(0, lastLine.length - line.length))}`);
      lastLine = line;
    }
  };
}

export default downloadSkill;

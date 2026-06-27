/**
 * download/http.js — HTTP 下载策略
 *
 * 合并原 download.js 和 index.js 中的：
 *   - Tar 流式解压
 *   - API 并发下载（使用 GitHub Content API，带回退 + 重试 + 超时）
 *   - Tarball 大小探测
 *   - 前缀探测（Tree API）
 *
 * @module download/http
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { PassThrough, Readable } from 'node:stream';
import * as tar from 'tar';
import { ProgressEmitter, applyRenameMap } from './utils.js';

// ===================== Tar 流式下载 =====================

export async function downloadViaTar({ owner, repo, branch, skillPrefix, targetDir, agent, onProgress, renameMap }) {
  const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  const repoPrefix = `${repo}-${branch}/`;

  const res = await fetch(downloadUrl, { agent, headers: { 'User-Agent': 'codewhale-downloader' } });
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }
  if (!res.body) throw new Error('Response has no body stream');

  // 桥接：原生 fetch 返回 Web ReadableStream → 转换为 Node.js Readable
  const nodeBody = typeof res.body.pipe === 'function' ? res.body : Readable.fromWeb(res.body);

  const total = parseInt(res.headers.get('content-length') || 0) || null;
  const emitter = new ProgressEmitter(onProgress);
  let downloaded = 0;
  let extractedFiles = 0;

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const progressStream = new PassThrough();
  progressStream.on('data', (chunk) => {
    downloaded += chunk.length;
    emitter.emit({
      stage: 'download', downloaded, total,
      percent: total ? (downloaded / total) * 100 : null,
      currentFile: `${owner}/${repo}.tar.gz`, completed: 0, totalFiles: 1,
    });
  });

  const extractor = tar.extract({
    cwd: targetDir,
    filter: (entryPath) => entryPath.startsWith(`${repoPrefix}${skillPrefix}`),
    map: (header) => {
      let relative = header.name.replace(`${repoPrefix}${skillPrefix}`, '');
      relative = applyRenameMap(relative, renameMap);
      header.name = relative;
      return header;
    },
  });

  extractor.on('entry', () => {
    extractedFiles++;
    emitter.emit({
      stage: 'extract', downloaded, total,
      percent: total ? (downloaded / total) * 100 : null,
      filesExtracted: extractedFiles,
    });
  });

  const gunzip = zlib.createGunzip();

  return new Promise((resolve, reject) => {
    nodeBody.on('error', reject);
    progressStream.on('error', reject);
    gunzip.on('error', reject);
    extractor.on('error', reject);
    extractor.on('finish', () => {
      emitter.emit({ stage: 'complete', downloaded, total, percent: 100, currentFile: null, completed: 1, totalFiles: 1 });
      resolve(targetDir);
    });

    nodeBody.pipe(progressStream).pipe(gunzip).pipe(extractor);
  });
}

// ===================== API 并发下载 =====================

const MAX_RETRIES = 3;
const CONCURRENCY = 5;

/**
 * 通过 GitHub Content API 并发下载（仅下载目标文件夹中的文件）
 *
 * 使用 api.github.com/repos/{owner}/{repo}/contents/{path} + Accept: raw
 * 带 3 次重试和 AbortController 30s 超时。
 */
export async function downloadViaApi({ owner, repo, branch, skillPrefix, targetDir, agent, token, onProgress, renameMap }) {
  const apiHeaders = {
    'User-Agent': 'codewhale-downloader',
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { Authorization: `token ${token}` }),
  };

  // 1. 获取文件列表（Tree API，15s 超时）
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeCtrl = new AbortController();
  const treeTimer = setTimeout(() => treeCtrl.abort(), 15000);
  let treeRes;
  try {
    treeRes = await fetch(treeUrl, { agent, headers: apiHeaders, signal: treeCtrl.signal });
  } finally {
    clearTimeout(treeTimer);
  }
  const treeData = await treeRes.json().catch(() => ({}));
  if (treeRes.status === 403 && treeData.message?.includes('rate limit')) {
    throw new Error('GitHub API rate limit reached, please provide a token');
  }
  if (!treeRes.ok) throw new Error(`Tree API failed: HTTP ${treeRes.status}`);

  const { tree } = treeData;
  const files = tree.filter((f) => f.type === 'blob' && f.path.startsWith(skillPrefix));
  if (!files.length) throw new Error(`No files found under prefix "${skillPrefix}"`);

  const totalFiles = files.length;
  const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const emitter = new ProgressEmitter(onProgress);
  let completed = 0;
  let downloaded = 0;

  // 下载单个文件（3 次重试 + 30s 超时）
  async function downloadFile(file) {
    // 使用 GitHub Content API（api.github.com/repos/.../contents/...）而非 raw.githubusercontent.com
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
    let relative = file.path.replace(skillPrefix, '');
    relative = applyRenameMap(relative, renameMap);
    const localPath = path.join(targetDir, relative);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let res = null;
      let nodeBody = null;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        try {
          res = await fetch(fileUrl, {
            agent,
            signal: ctrl.signal,
            headers: { ...apiHeaders, Accept: 'application/vnd.github.raw+json' },
          });
        } finally {
          clearTimeout(timer);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('Response has no body');

        nodeBody = typeof res.body.pipe === 'function' ? res.body : Readable.fromWeb(res.body);
        const writer = fs.createWriteStream(localPath);

        nodeBody.on('data', (chunk) => {
          downloaded += chunk.length;
          emitter.emit({
            stage: 'download', completed, totalFiles, downloaded, total: totalBytes,
            percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
            currentFile: file.path,
          });
        });

        nodeBody.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          nodeBody.on('error', reject);
        });

        completed++;
        emitter.emit({
          stage: 'download', completed, totalFiles, downloaded, total: totalBytes,
          percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
          currentFile: file.path,
        });
        return;
      } catch (err) {
        if (res && nodeBody && !nodeBody.destroyed) nodeBody.destroy();
        const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
        if (attempt === MAX_RETRIES) {
          throw new Error(`Download ${file.path} failed: ${err.message}${isTimeout ? ' (timeout)' : ''}`, { cause: err });
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  // 并发队列
  const queue = [...files];
  const workers = Array(Math.min(CONCURRENCY, files.length))
    .fill()
    .map(() => (async () => {
      while (queue.length > 0) {
        await downloadFile(queue.shift());
      }
    })());

  await Promise.all(workers);
  return targetDir;
}

// ===================== Tarball 大小探测 =====================

export async function detectTarballSize(owner, repo, branch, agent) {
  const checkUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  try {
    const headRes = await fetch(checkUrl, {
      agent,
      method: 'HEAD',
      headers: { 'User-Agent': 'codewhale-downloader' },
    });
    if (headRes.ok) {
      return parseInt(headRes.headers.get('content-length') || 0) || null;
    }
  } catch {
    // 网络异常不做特殊处理
  }
  return null;
}

// ===================== 前缀探测 =====================

export async function detectSkillPrefix(owner, repo, skillName, branch, agent, token) {
  // 如果 skillName 本身包含路径，直接使用
  if (skillName.includes('/')) {
    const normalized = skillName.replace(/\/+$/, '') + '/';
    return { prefix: normalized };
  }

  const candidatePrefixes = [`skills/${skillName}/`, `${skillName}/`];
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const apiHeaders = {
    'User-Agent': 'codewhale-downloader',
    'Accept': 'application/vnd.github.v3+json',
    ...(token && { Authorization: `token ${token}` }),
  };

  let treeCount;
  try {
    const treeRes = await fetch(treeUrl, { agent, headers: apiHeaders });
    if (treeRes.ok) {
      const { tree } = await treeRes.json();
      treeCount = tree ? tree.length : 0;

      for (const prefix of candidatePrefixes) {
        if (tree.some((f) => f.type === 'blob' && f.path.startsWith(prefix))) {
          return { prefix, treeCount };
        }
      }

      // 所有候选均未匹配
      return { prefix: candidatePrefixes[0], treeCount, apiOk: true, noMatch: true };
    }
  } catch {
    // API 不可用
  }

  // API 不可用 → 默认 skills/<skillName>/
  return { prefix: candidatePrefixes[0], treeCount: 0, apiOk: false };
}
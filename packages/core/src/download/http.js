/**
 * download/http.js — HTTP 下载策略
 *
 *   - Tar 流式解压
 *   - Octokit API 并发下载（通过 Git Blob API，同域名 api.github.com）
 *   - Tarball 大小探测
 *   - 前缀探测（Tree API）
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { PassThrough, Readable } from 'node:stream';
import * as tar from 'tar';
import { Octokit } from '@octokit/core';
import { ProgressEmitter, applyRenameMap } from './utils.js';

// ===================== Tar 流式下载 =====================

export async function downloadViaTar({ owner, repo, branch, skillPrefix, targetDir, agent, onProgress, renameMap }) {
  const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  const repoPrefix = `${repo}-${branch}/`;

  const res = await globalThis.fetch(downloadUrl, { agent, headers: { 'User-Agent': 'codewhale-downloader' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  if (!res.body) throw new Error('Response has no body stream');

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

// ===================== Octokit API 并发下载 =====================

const MAX_RETRIES = 3;
const CONCURRENCY = 3;

/**
 * 通过 Octokit + Git Blob API 下载文件
 * 所有请求走 api.github.com，不受 CDN 域名限制。
 */
export async function downloadViaApi({ owner, repo, branch, skillPrefix, targetDir, agent, token, onProgress, renameMap }) {
  // 创建 Octokit 实例，支持代理
  const octokitOpts = {
    auth: token || undefined,
  };
  if (agent) {
    octokitOpts.request = { agent };
  }
  const octokit = new Octokit(octokitOpts);

  // 1. 获取文件列表（Tree API）
  let tree;
  try {
    const treeRes = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1', {
      owner, repo, sha: branch,
    });
    tree = treeRes.data.tree;
  } catch (err) {
    if (err.status === 403 && String(err.message).includes('rate limit')) {
      throw new Error('GitHub API rate limit reached, please provide a token');
    }
    throw new Error(`Tree API failed: ${err.status} ${err.message}`);
  }

  const files = tree.filter((f) => f.type === 'blob' && f.path.startsWith(skillPrefix));
  if (!files.length) throw new Error(`No files found under prefix "${skillPrefix}"`);

  const totalFiles = files.length;
  const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);

  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });

  const emitter = new ProgressEmitter(onProgress);
  let completed = 0;
  let downloaded = 0;

  // ── 通过 Octokit Git Blob API 下载单个文件 ──
  async function downloadFile(file) {
    let relative = file.path.replace(skillPrefix, '');
    relative = applyRenameMap(relative, renameMap);
    const localPath = path.join(targetDir, relative);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const blobRes = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{sha}', {
          owner, repo, sha: file.sha,
        });
        if (!blobRes.data.content) throw new Error('Git Blob API returned no content');

        const contentStr = Buffer.from(blobRes.data.content, 'base64').toString('utf-8');
        fs.writeFileSync(localPath, contentStr, 'utf-8');

        downloaded += file.size || Buffer.byteLength(contentStr, 'utf-8');
        completed++;
        emitter.emit({
          stage: 'download', completed, totalFiles, downloaded, total: totalBytes,
          percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
          currentFile: file.path,
        });
        return;
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          throw new Error(`Download ${file.path} (blob) failed: ${err.message}`);
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
    const headRes = await globalThis.fetch(checkUrl, {
      dispatcher: agent,
      method: 'HEAD',
      headers: { 'User-Agent': 'codewhale-downloader' },
    });
    if (headRes.ok) {
      return parseInt(headRes.headers.get('content-length') || 0) || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// ===================== 前缀探测 =====================

export async function detectSkillPrefix(owner, repo, skillName, branch, agent, token) {
  // 如果 skillName 本身包含路径，直接使用
  if (skillName.includes('/')) {
    return { prefix: skillName.replace(/\/+$/, '') + '/' };
  }

  const candidatePrefixes = [`skills/${skillName}/`, `${skillName}/`];
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  try {
    const res = await globalThis.fetch(treeUrl, {
      dispatcher: agent,
      headers: {
        'User-Agent': 'codewhale-downloader',
        'Accept': 'application/vnd.github.v3+json',
        ...(token && { Authorization: `bearer ${token}` }),
      },
    });
    if (res.ok) {
      const { tree } = await res.json();
      const treeCount = tree ? tree.length : 0;
      for (const prefix of candidatePrefixes) {
        if (tree.some((f) => f.type === 'blob' && f.path.startsWith(prefix))) {
          return { prefix, treeCount };
        }
      }
      return { prefix: candidatePrefixes[0], treeCount, apiOk: true, noMatch: true };
    }
  } catch {
    // API not available
  }

  return { prefix: candidatePrefixes[0], treeCount: 0, apiOk: false };
}
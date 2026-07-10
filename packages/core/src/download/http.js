/**
 * download/http.js — HTTP 下载策略
 *
 * 提供两种基于 HTTP 的 skill 下载方式：
 *   1. Tar 流式下载：通过 codeload.github.com 下载 tar.gz，流式解压并筛选 skill 目录
 *   2. Octokit API 并发下载：通过 GitHub Git Tree + Blob API 并发下载文件
 *
 * 还提供两个探测函数，用于下载前获取仓库信息：
 *   - detectTarballSize：探测 tar.gz 包大小，用于策略路由
 *   - detectSkillPrefix：探测 skill 在仓库中的路径前缀
 *
 * 策略选择逻辑：
 *   - 使用 Tar：tarball < 5MB，或无法探测大小且文件数 <= 300
 *   - 使用 API：tarball >= 5MB，或无法探测大小且文件数 > 300
 *
 * @module download/http
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { PassThrough, Readable } from 'node:stream';
import * as tar from 'tar';
import { Octokit } from '@octokit/core';
import { DOWNLOAD_STAGES, ProgressEmitter, applyRenameMap } from './utils.js';
// ===================== Tar 流式下载 =====================
/**
 * 通过 tar.gz 流式下载并按前缀筛选出单个 skill，适合中小仓库直连场景。
 *
 * 工作流程：
 *   1. 从 codeload.github.com 下载仓库的 tar.gz 压缩包
 *   2. 使用 AbortController 设置 30 秒超时
 *   3. 流式解压，只提取以 skillPrefix 开头的文件
 *   4. 通过 map 函数应用 renameMap，将仓库内路径映射到目标路径
 *   5. 监听 'entry' 事件，统计解压文件数并上报进度
 *   6. 解压完成后返回 targetDir
 *
 * 为什么用流式：不需要将整个 tar.gz 下载到内存或磁盘，边下载边解压，节省带宽和存储。
 * 为什么用 codeload：GitHub 官方提供的 tar.gz 流式下载服务，比 git clone 更轻量。
 *
 * @param {object} params
 * @param {string} params.owner - GitHub 仓库 owner
 * @param {string} params.repo - GitHub 仓库名
 * @param {string} params.branch - 分支名
 * @param {string} params.skillPrefix - skill 在仓库中的路径前缀，用于筛选文件
 * @param {string} params.targetDir - 解压目标目录
 * @param {ProxyAgent} [params.agent] - 代理实例，用于网络请求
 * @param {Function} [params.onProgress] - 进度回调函数
 * @param {object} [params.renameMap] - 路径重命名映射表
 * @returns {Promise<string>} 解压后的目标目录路径
 */
export async function downloadViaTar({ owner, repo, branch, skillPrefix, targetDir, agent, onProgress, renameMap }) {
  // 构建 codeload 下载 URL，这是 GitHub 提供的 tar.gz 流式下载服务
  const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
  // tar.gz 内的顶层目录名格式：{repo}-{branch}/
  const repoPrefix = `${repo}-${branch}/`;
  // 30s 超时 + 代理修复：使用 dispatcher 而非 agent（fetch API 的代理方式）
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let res;
  try {
    // 使用 globalThis.fetch（Node 18+ 内置），通过 dispatcher 注入代理
    res = await globalThis.fetch(downloadUrl, { dispatcher: agent, signal: ctrl.signal, headers: { 'User-Agent': 'codewhale-downloader' } });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  if (!res.body) throw new Error('Response has no body stream');
  // 兼容 Web Stream 和 Node Stream（不同 Node 版本返回类型不同）
  const nodeBody = typeof res.body.pipe === 'function' ? res.body : Readable.fromWeb(res.body);
  const total = parseInt(res.headers.get('content-length') || 0) || null;
  const emitter = new ProgressEmitter(onProgress);
  let downloaded = 0;
  let extractedFiles = 0;
  // 清空目标目录并重新创建
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  // 创建进度统计流：在原始响应流和 gunzip 之间插入 PassThrough，用于统计已下载字节数
  const progressStream = new PassThrough();
  progressStream.on('data', (chunk) => {
    downloaded += chunk.length;
    emitter.emit({
      stage: DOWNLOAD_STAGES.DOWNLOADING,
      downloaded,
      total,
      percent: total ? (downloaded / total) * 100 : null,
      currentFile: `${owner}/${repo}.tar.gz`,
      completed: 0,
      totalFiles: 1,
    });
  });
  // 配置 tar 解压器：
  //   - cwd: 解压目标目录
  //   - filter: 只提取以 repoPrefix + skillPrefix 开头的文件（筛选出 skill 目录）
  //   - map: 对每个文件路径应用 renameMap，将仓库内路径映射到目标路径
  const extractor = tar.extract({
    cwd: targetDir,
    filter: (entryPath) => entryPath.startsWith(`${repoPrefix}${skillPrefix}`),
    map: (header) => {
      // 去掉仓库前缀和 skill 前缀，得到相对路径
      let relative = header.name.replace(`${repoPrefix}${skillPrefix}`, '');
      relative = applyRenameMap(relative, renameMap);
      header.name = relative;
      return header;
    },
  });
  // 监听 'entry' 事件，统计解压文件数
  extractor.on('entry', () => {
    extractedFiles++;
    emitter.emit({
      stage: DOWNLOAD_STAGES.EXTRACTING,
      downloaded,
      total,
      percent: total ? (downloaded / total) * 100 : null,
      filesExtracted: extractedFiles,
    });
  });
  // gzip 解压
  const gunzip = zlib.createGunzip();
  // 组装流管道：nodeBody -> progressStream -> gunzip -> extractor
  return new Promise((resolve, reject) => {
    nodeBody.on('error', reject);
    progressStream.on('error', reject);
    gunzip.on('error', reject);
    extractor.on('error', reject);
    extractor.on('finish', () => {
      emitter.emit({ stage: DOWNLOAD_STAGES.DONE, downloaded, total, percent: 100, currentFile: null, completed: 1, totalFiles: 1 });
      resolve(targetDir);
    });
    nodeBody.pipe(progressStream).pipe(gunzip).pipe(extractor);
  });
}
// ===================== Octokit API 并发下载 =====================
// 最大重试次数和并发数
const MAX_RETRIES = 3;
const CONCURRENCY = 3;
/**
 * 通过 Octokit + Git Blob API 下载文件
 *
 * 工作流程：
 *   1. 使用 Git Tree API 获取仓库文件列表
 *   2. 筛选出以 skillPrefix 开头的文件
 *   3. 通过 Git Blob API 并发下载每个文件的内容
 *   4. 使用 renameMap 映射路径后写入目标目录
 *
 * 适用场景：
 *   - 大仓库（tarball 超过 5MB）
 *   - 文件数超过 300 个
 *   - codeload 下载失败时作为回退方案
 *
 * 注意：所有请求走 api.github.com，受 GitHub API 速率限制影响。
 * 未提供 token 时，未认证请求每小时限制 60 次。
 *
 * @param {object} params
 * @param {string} params.owner - GitHub 仓库 owner
 * @param {string} params.repo - GitHub 仓库名
 * @param {string} params.branch - 分支名
 * @param {string} params.skillPrefix - skill 在仓库中的路径前缀
 * @param {string} params.targetDir - 下载目标目录
 * @param {ProxyAgent} [params.agent] - 代理实例
 * @param {string} [params.token] - GitHub Personal Access Token，用于提高 API 限额
 * @param {Function} [params.onProgress] - 进度回调函数
 * @param {object} [params.renameMap] - 路径重命名映射表
 * @returns {Promise<string>} 下载目标目录路径
 */
// 通过 Git Tree + Blob API 拉取单个目录，避开 codeload 失败或超大 tarball 场景。
export async function downloadViaApi({ owner, repo, branch, skillPrefix, targetDir, agent, token, onProgress, renameMap }) {
  // 创建 Octokit 实例，支持代理和 token 认证
  const octokitOpts = {
    auth: token || undefined,
  };
  if (agent) {
    octokitOpts.request = { agent };
  }
  const octokit = new Octokit(octokitOpts);
  // 1. 获取文件列表（Tree API）
  //    通过递归获取整个仓库的文件树，然后筛选出 skill 目录下的文件
  let tree;
  try {
    const treeRes = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1', {
      owner, repo, sha: branch,
    });
    tree = treeRes.data.tree;
  } catch (err) {
    // 处理 GitHub API 速率限制错误
    if (err.status === 403 && String(err.message).includes('rate limit')) {
      throw new Error('GitHub API rate limit reached, please provide a token', { cause: err });
    }
    throw new Error(`Tree API failed: ${err.status} ${err.message}`, { cause: err });
  }
  // 筛选出以 skillPrefix 开头的 blob 文件（跳过目录、子模块等非文件条目）
  const files = tree.filter((f) => f.type === 'blob' && f.path.startsWith(skillPrefix));
  if (!files.length) throw new Error(`No files found under prefix "${skillPrefix}"`);
  const totalFiles = files.length;
  const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);
  // 清空目标目录并重新创建
  if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  const emitter = new ProgressEmitter(onProgress);
  let completed = 0;
  let downloaded = 0;
  // ── 通过 Octokit Git Blob API 下载单个文件 ──
  /**
   * 下载单个文件
   * @param {object} file - GitHub Tree API 返回的文件信息
   * @param {string} file.path - 文件在仓库中的完整路径
   * @param {string} file.sha - 文件 blob SHA，用于通过 Blob API 获取内容
   * @param {number} file.size - 文件大小（字节）
   */
  async function downloadFile(file) {
    // 去掉 skillPrefix 前缀，得到相对路径
    let relative = file.path.replace(skillPrefix, '');
    relative = applyRenameMap(relative, renameMap);
    const localPath = path.join(targetDir, relative);
    // 确保目标目录存在
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    // 带重试的下载逻辑：最多重试 MAX_RETRIES 次，每次间隔递增
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 通过 Git Blob API 获取文件内容（Base64 编码）
        const blobRes = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{sha}', {
          owner, repo, sha: file.sha,
        });
        if (!blobRes.data.content) throw new Error('Git Blob API returned no content');
        // 将 Base64 内容解码为 UTF-8 文本并写入文件
        const contentStr = Buffer.from(blobRes.data.content, 'base64').toString('utf-8');
        fs.writeFileSync(localPath, contentStr, 'utf-8');
        downloaded += file.size || Buffer.byteLength(contentStr, 'utf-8');
        completed++;
        emitter.emit({
          stage: DOWNLOAD_STAGES.DOWNLOADING,
          completed,
          totalFiles,
          downloaded,
          total: totalBytes,
          percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
          currentFile: file.path,
        });
        return;
      } catch (err) {
        // 最后一次重试失败，抛出错误
        if (attempt === MAX_RETRIES) {
          throw new Error(`Download ${file.path} (blob) failed: ${err.message}`, { cause: err });
        }
        // 指数退避：1秒、2秒、3秒
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  // 并发队列：创建 CONCURRENCY 个 worker，每个 worker 从队列中取出文件下载
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
/**
 * 探测 GitHub 仓库 tar.gz 包的大小（字节数）。
 *
 * 通过发送 HEAD 请求获取 content-length 头，不下载实际内容。
 * 用于下载策略路由：大仓库（>=5MB）使用 API 策略，小仓库使用 Tar 策略。
 *
 * 为什么用 HEAD 而不是 GET：只获取响应头，不传输 body，节省带宽和时间。
 *
 * @param {string} owner - GitHub 仓库 owner
 * @param {string} repo - GitHub 仓库名
 * @param {string} branch - 分支名
 * @param {ProxyAgent} [agent] - 代理实例
 * @returns {number|null} tarball 大小（字节），探测失败返回 null
 */
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
/**
 * 探测 skill 在 GitHub 仓库中的路径前缀。
 *
 * 工作流程：
 *   1. 如果 skillName 包含 '/'，说明用户已指定完整路径，直接返回
 *   2. 否则尝试两种常见前缀：skills/{skillName}/ 和 {skillName}/
 *   3. 调用 GitHub Tree API 获取仓库文件列表
 *   4. 检查哪种前缀下存在文件，返回匹配的前缀
 *   5. 如果两种前缀都匹配，优先返回 skills/{skillName}/（项目约定）
 *
 * @param {string} owner - GitHub 仓库 owner
 * @param {string} repo - GitHub 仓库名
 * @param {string} skillName - skill 名称，可能包含路径（如 skills/my-skill）
 * @param {string} branch - 分支名
 * @param {ProxyAgent} [agent] - 代理实例
 * @param {string} [token] - GitHub Token
 * @returns {{ prefix: string, treeCount: number, noMatch?: boolean, apiOk?: boolean }} 探测结果
 */
export async function detectSkillPrefix(owner, repo, skillName, branch, agent, token) {
  // 如果 skillName 本身包含路径，直接使用
  if (skillName.includes('/')) {
    return { prefix: skillName.replace(/\/+$/, '') + '/' };
  }
  // 两种常见前缀：skills/{name}/ 和 {name}/
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
      // 按顺序检查候选前缀，返回第一个匹配的
      for (const prefix of candidatePrefixes) {
        if (tree.some((f) => f.type === 'blob' && f.path.startsWith(prefix))) {
          return { prefix, treeCount };
        }
      }
      // 有 API 响应但无匹配，返回 noMatch 标志，由上层决定是报错还是继续尝试
      return { prefix: candidatePrefixes[0], treeCount, apiOk: true, noMatch: true };
    }
  } catch {
    // API not available
  }
  // API 不可用或失败，返回默认前缀，由上层决定如何处理
  return { prefix: candidatePrefixes[0], treeCount: 0, apiOk: false };
}

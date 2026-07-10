/**
 * download/zip.js — ZIP 下载 + 解压策略
 *
 * 提供 ZIP 格式的 skill 下载方式，兼容旧版 ZIP 安装链路。
 *
 * 工作流程：
 *   1. 下载 ZIP 压缩包到系统临时目录
 *   2. 使用 AdmZip 解压到目标目录
 *   3. 判断 skill 根目录：如果解压后只有一个子目录，返回该子目录路径
 *   4. 否则返回目标目录本身
 *   5. 清理临时 ZIP 文件
 *
 * @module download/zip
 */
import { rmSync, createWriteStream, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { DOWNLOAD_STAGES, createAgent } from './utils.js';
import AdmZip from 'adm-zip';
/**
 * 使用代理下载 ZIP 压缩包，支持进度回调
 *
 * 两种下载模式：
 *   1. 无代理：使用 fetch API 下载（Web Stream 读取）
 *   2. 有代理：使用 node:https 的 get 方法，通过 ProxyAgent 发送请求
 *
 * 设计要点：
 *   - 动态导入 node:https，避免在无代理场景下不必要的加载
 *   - 支持 120 秒超时
 *   - 支持 HTTP 3xx 重定向自动跟随
 *   - 边下载边写文件，不占用额外内存
 *
 * @param {string} url - ZIP 文件 URL
 * @param {string} destPath - 本地保存路径
 * @param {object} proxy - 代理配置
 * @param {Function} [onProgress] - 进度回调函数
 */
async function downloadZipWithProxy(url, destPath, proxy, onProgress) {
  // 动态导入 node:https，避免在无代理场景下不必要的加载
  const { get } = await import('node:https');
  const agent = createAgent(proxy);
  if (!agent) {
    // 无代理模式：使用 fetch API
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      throw new Error(getServerMessage('skillZipDownloadFailed'));
    }
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const fileStream = createWriteStream(destPath);
    let totalBytes = 0;
    // 使用 ReadableStream 读取响应体，边读边写边上报进度
    const reader = response.body.getReader();
    await new Promise((resolve, reject) => {
      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) {
            fileStream.end(resolve);
            return;
          }
          totalBytes += value.length;
          fileStream.write(Buffer.from(value), (err) => {
            if (err) reject(err);
            else {
              if (onProgress && contentLength > 0) {
                const pct = Math.round((totalBytes / contentLength) * 100);
                onProgress({ stage: DOWNLOAD_STAGES.DOWNLOADING, percent: Math.min(pct, 99), message: getServerMessage('skillProgressDownloadingPct', { pct }) });
              }
              pump();
            }
          });
        }).catch(reject);
      }
      pump();
    });
    return;
  }
  // 有代理模式：使用 node:https 的 get 方法
  const fileStream = createWriteStream(destPath);
  // 递归处理重定向：如果响应是 3xx 且有 Location 头，则跟随重定向
  const doGet = (targetUrl) => new Promise((resolve, reject) => {
    get(targetUrl, {
      agent,
      timeout: 120000,
      headers: {
        'User-Agent': 'CodeWhale/1.0',
        'Accept': 'application/zip, application/octet-stream, */*',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        doGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(getServerMessage('skillErrorProxyDownload', { status: res.statusCode })));
        return;
      }
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      let totalBytes = 0;
      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        fileStream.write(chunk);
        if (onProgress && contentLength > 0) {
          const pct = Math.round((totalBytes / contentLength) * 100);
          onProgress({ stage: DOWNLOAD_STAGES.DOWNLOADING, percent: Math.min(pct, 99), message: getServerMessage('skillProgressDownloadingPct', { pct }) });
        }
      });
      res.on('end', () => {
        fileStream.end();
        resolve();
      });
      res.on('error', (err) => {
        fileStream.destroy();
        reject(err);
      });
    }).on('error', reject);
  });
  await doGet(url);
}
/**
 * 下载 ZIP 包并解压到目标目录
 *
 * 兼容 ZIP 安装链路的入口函数。
 *
 * 工作流程：
 *   1. 在系统临时目录创建临时 ZIP 文件
 *   2. 下载 ZIP 到临时文件
 *   3. 使用 AdmZip 解压到目标目录
 *   4. 判断 skill 根目录：
 *      - 如果解压后只有一个子目录，认为该子目录是 skill 根目录
 *      - 否则认为目标目录本身就是 skill 根目录
 *   5. 清理临时 ZIP 文件
 *
 * @param {string} zipUrl - ZIP 文件 URL
 * @param {string} targetDir - 解压目标目录
 * @param {object} proxy - 代理配置
 * @param {Function} [onProgress] - 进度回调函数
 * @returns {Promise<string>} 解压后的 skill 根目录路径
 */
export async function downloadAndExtractZip(zipUrl, targetDir, proxy, onProgress) {
  // 在系统临时目录创建临时 ZIP 文件，避免污染项目目录
  const tmpFile = join(tmpdir(), `skill-${randomUUID()}.zip`);
  try {
    // 1. 连接阶段
    if (onProgress) {
      onProgress({ stage: DOWNLOAD_STAGES.CONNECTING, percent: 5, message: getServerMessage('skillProgressConnectingGithub') });
    }
    // 2. 下载 ZIP 到临时文件
    await downloadZipWithProxy(zipUrl, tmpFile, proxy, onProgress);
    // 3. 解压阶段
    if (onProgress) {
      onProgress({ stage: DOWNLOAD_STAGES.EXTRACTING, percent: 60, message: getServerMessage('skillProgressExtracting') });
    }
    const zip = new AdmZip(tmpFile);
    zip.extractAllTo(targetDir, /* overwrite */ true);
    // 4. 判断 skill 根目录：
    //    如果解压后只有一个子目录，认为该子目录是 skill 根目录
    //    否则认为目标目录本身就是 skill 根目录
    const entries = readdirSync(targetDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    return dirs.length === 1 && entries.length === 1
      ? join(targetDir, dirs[0].name)
      : targetDir;
  } finally {
    // 清理临时 ZIP 文件，忽略清理失败
    try { rmSync(tmpFile); } catch { /* ignore */ }
  }
}

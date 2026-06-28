/**
 * download/zip.js — ZIP 下载 + 解压策略
 *
 * 移植自 index.js 的 _downloadAndExtractZip() + _downloadZipWithProxy()。
 * 接受结构化代理配置，内部使用 createAgent 构造网络 agent。
 *
 * @module download/zip
 */

import { rmSync, createWriteStream, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { createAgent } from './utils.js';
import AdmZip from 'adm-zip';

async function downloadZipWithProxy(url, destPath, proxy, onProgress) {
  const { get } = await import('node:https');

  const agent = createAgent(proxy);
  if (!agent) {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      throw new Error(getServerMessage('SKILL_ZIP_DOWNLOAD_FAILED'));
    }
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    const fileStream = createWriteStream(destPath);
    let totalBytes = 0;

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
                onProgress({ stage: 'downloading', percent: Math.min(pct, 99), message: getServerMessage('SKILL_PROGRESS_DOWNLOADING_PCT', { pct }) });
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

  const fileStream = createWriteStream(destPath);

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
        reject(new Error(getServerMessage('SKILL_ERROR_PROXY_DOWNLOAD', { status: res.statusCode })));
        return;
      }
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);
      let totalBytes = 0;

      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        fileStream.write(chunk);
        if (onProgress && contentLength > 0) {
          const pct = Math.round((totalBytes / contentLength) * 100);
          onProgress({ stage: 'downloading', percent: Math.min(pct, 99), message: getServerMessage('SKILL_PROGRESS_DOWNLOADING_PCT', { pct }) });
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

export async function downloadAndExtractZip(zipUrl, targetDir, proxy, onProgress) {
  const tmpFile = join(tmpdir(), `skill-${randomUUID()}.zip`);

  try {
    if (onProgress) {
      onProgress({ stage: 'connecting', percent: 5, message: getServerMessage('SKILL_PROGRESS_CONNECTING_GITHUB') });
    }

    await downloadZipWithProxy(zipUrl, tmpFile, proxy, onProgress);

    if (onProgress) {
      onProgress({ stage: 'extracting', percent: 60, message: getServerMessage('SKILL_PROGRESS_EXTRACTING') });
    }

    const zip = new AdmZip(tmpFile);
    zip.extractAllTo(targetDir, /* overwrite */ true);

    const entries = readdirSync(targetDir, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    return dirs.length === 1 && entries.length === 1
      ? join(targetDir, dirs[0].name)
      : targetDir;
  } finally {
    try { rmSync(tmpFile); } catch { /* ignore */ }
  }
}
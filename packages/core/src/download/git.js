/**
 * download/git.js — git CLI 下载策略
 *
 * 移植自 index.js 的 _cloneWithGitSparse()。
 * 接受结构化代理配置，内部拼接 URL 字符串传给 git CLI。
 *
 * @module download/git
 */

import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../i18n.js';

/**
 * 将结构化代理配置转换为 git CLI 可用的 url 字符串
 */
function proxyToUrl(proxy) {
  if (!proxy || proxy.type === 'none' || proxy.type === '') return '';
  const auth = proxy.auth
    ? `${encodeURIComponent(proxy.auth.username || '')}:${encodeURIComponent(proxy.auth.password || '')}@`
    : '';
  if (proxy.type === 'http') return `http://${auth}${proxy.host}:${proxy.port}`;
  if (proxy.type === 'socks5') return `socks5://${auth}${proxy.host}:${proxy.port}`;
  return '';
}

/**
 * 使用 git sparse checkout（partial clone）下载单个 skill 子目录
 */
export async function cloneWithGitSparse(repoUrl, skillPath, targetDir, proxy, onProgress) {
  const tmpDir = join(tmpdir(), `skill-git-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    if (onProgress) {
      onProgress({ stage: 'cloning', percent: 10, message: getServerMessage('SKILL_PROGRESS_GIT_SPARSE_CLONE') });
    }

    const proxyUrl = proxyToUrl(proxy);
    const proxyArgs = proxyUrl
      ? `-c http.proxy=${proxyUrl} -c https.proxy=${proxyUrl}`
      : '';

    const cloneCmd = [
      ...(proxyArgs ? ['git', proxyArgs, 'clone'] : ['git', 'clone']),
      '--depth', '1', '--filter=blob:none', '--sparse', '--no-checkout',
      repoUrl, tmpDir,
    ].join(' ');

    execSync(cloneCmd, { stdio: 'pipe', timeout: 120000 });

    if (skillPath) {
      if (onProgress) {
        onProgress({ stage: 'checkout', percent: 40, message: getServerMessage('SKILL_PROGRESS_SPARSE_CHECKOUT', { path: skillPath }) });
      }
      const sparseCmd = [
        ...(proxyArgs ? ['git', proxyArgs, '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]
          : ['git', '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]),
      ].join(' ');
      execSync(sparseCmd, { stdio: 'pipe', timeout: 60000 });
    }

    if (onProgress) {
      onProgress({ stage: 'checking-out', percent: 60, message: getServerMessage('SKILL_PROGRESS_CHECKOUT_FILES') });
    }
    execSync(`git -C "${tmpDir}" checkout`, { stdio: 'pipe', timeout: 60000 });

    const skillDir = skillPath ? join(tmpDir, ...skillPath.split('/')) : tmpDir;

    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      throw new Error(getServerMessage('SKILL_ERROR_README_NOT_FOUND'));
    }

    if (onProgress) {
      onProgress({ stage: 'copying', percent: 80, message: getServerMessage('SKILL_PROGRESS_COPYING') });
    }
    cpSync(skillDir, targetDir, { recursive: true, force: true });

    if (onProgress) {
      onProgress({ stage: 'cloned', percent: 85, message: getServerMessage('SKILL_PROGRESS_CLONE_DONE') });
    }
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
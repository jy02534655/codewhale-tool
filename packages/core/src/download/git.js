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
import { getServerMessage } from '../utils/i18n.js';
import { DOWNLOAD_STAGES, emitProgress, proxyToUrl } from './utils.js';

/**
 * 使用 git sparse checkout（partial clone）下载单个 skill 子目录
 */
export async function cloneWithGitSparse(repoUrl, skillPath, targetDir, proxy, onProgress) {
  const tmpDir = join(tmpdir(), `skill-git-${randomUUID()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // 通知前端进入 git 稀疏克隆阶段。
    emitProgress(onProgress, DOWNLOAD_STAGES.CLONING, 10, getServerMessage('SKILL_PROGRESS_GIT_SPARSE_CLONE'));

    // 复用公共代理 URL 拼装逻辑，并同时注入 http/https 代理配置给 git CLI。
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
      // 稀疏路径设置单独提示，便于区分 clone 与 checkout 两段耗时。
      emitProgress(onProgress, DOWNLOAD_STAGES.CHECKOUT, 40, getServerMessage('SKILL_PROGRESS_SPARSE_CHECKOUT', { path: skillPath }));
      const sparseCmd = [
        ...(proxyArgs ? ['git', proxyArgs, '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]
          : ['git', '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]),
      ].join(' ');
      execSync(sparseCmd, { stdio: 'pipe', timeout: 60000 });
    }

    // 统一将真正 checkout 文件的阶段名收敛为 checkout。
    emitProgress(onProgress, DOWNLOAD_STAGES.CHECKOUT, 60, getServerMessage('SKILL_PROGRESS_CHECKOUT_FILES'));
    execSync(`git -C "${tmpDir}" checkout`, { stdio: 'pipe', timeout: 60000 });

    const skillDir = skillPath ? join(tmpDir, ...skillPath.split('/')) : tmpDir;

    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      throw new Error(getServerMessage('SKILL_ERROR_README_NOT_FOUND'));
    }

    // 将临时目录中的最终 skill 内容复制到目标目录。
    emitProgress(onProgress, DOWNLOAD_STAGES.COPYING, 80, getServerMessage('SKILL_PROGRESS_COPYING'));
    cpSync(skillDir, targetDir, { recursive: true, force: true });

    // 统一完成态，避免前端额外兼容 cloned/done 两套别名。
    emitProgress(onProgress, DOWNLOAD_STAGES.DONE, 85, getServerMessage('SKILL_PROGRESS_CLONE_DONE'));
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
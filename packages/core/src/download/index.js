/**
 * download/index.js — 下载模块主入口 + 统一导出
 *
 * 核心函数：downloadSkillFromGitHub — 从 GitHub 仓库下载 Skill 的协调入口。
 *
 * @module download
 */

import path from 'node:path';
import fs from 'node:fs';
import { Logger, formatBytes, formatTimestamp } from '../utils/logger.js';
import {
  downloadViaTar, downloadViaApi,
  detectTarballSize, detectSkillPrefix,
} from './http.js';
import { createAgent, parseRepoUrl } from './utils.js';
import { getServerMessage } from '../utils/i18n.js';

export function writeSkillLog(level, keyOrMessage, params, extra) {
  try {
    const ts = formatTimestamp();
    const useRawMessage = !!(extra && extra.rawMessage);
    const msg = useRawMessage ? keyOrMessage : getServerMessage(keyOrMessage, params);
    const safeExtra = extra && extra.rawMessage
      ? Object.fromEntries(Object.entries(extra).filter(([key]) => key !== 'rawMessage'))
      : extra;
    const extraStr = safeExtra && Object.keys(safeExtra).length ? ' | ' + JSON.stringify(safeExtra, null, 0) : '';
    const line = `[${ts}] [${level}] ${msg}${extraStr}`;
    fs.appendFileSync(path.join(process.cwd(), 'download-skill.log'), line + '\n', 'utf-8');
  } catch { /* 日志写入失败不阻塞流程 */ }
}

// ===================== 主入口 =====================

export async function downloadSkillFromGitHub({
  repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, onLog, level,
}) {
  const logger = new Logger();
  logger.setCallback(onLog);
  logger.setFile(path.join(process.cwd(), 'download-skill.log'));
  logger.log('INFO', 'SKILL_LOG_DOWNLOAD_START');

  const startTime = Date.now();
  logger.log('INFO', 'SKILL_LOG_PARAMS', null, {
    repoUrl, skillName, destDir,
    hasProxy: !!proxy, proxyType: proxy?.type,
    hasToken: !!token, hasRenameMap: !!renameMap,
    hasOnProgress: !!onProgress, level,
  });

  const { owner, repo } = parseRepoUrl(repoUrl);
  const agent = createAgent(proxy);
  const branch = 'main';
  logger.log('INFO', 'SKILL_LOG_REPO_INFO', null, { owner, repo, branch });

  // 代理通道创建日志
  if (agent) {
    logger.log('INFO', 'SKILL_LOG_PROXY_AGENT_CREATED', { type: proxy?.type, host: proxy?.host, port: proxy?.port });
  }

  if (onProgress) {
    onProgress({ stage: 'connecting', percent: 5, message: getServerMessage('SKILL_PROGRESS_PARSING_REPO'), speed: 0, speedFormatted: '' });
  }

  // 1. 探测 skill 前缀
  const spanPrefix = logger.span('SKILL_LOG_PREFIX_PROBE');
  const { prefix, treeCount, noMatch } = await detectSkillPrefix(owner, repo, skillName, branch, agent, token);
  const skillPrefix = prefix;
  spanPrefix.finish('INFO', 'SKILL_LOG_PREFIX_RESULT', { prefix: skillPrefix });

  if (noMatch) {
    logger.log('ERROR', 'SKILL_ERROR_SKILL_NOT_FOUND_REPO', { owner, repo, skillName, count: treeCount });
    throw new Error(getServerMessage('SKILL_ERROR_SKILL_NOT_FOUND_REPO', { owner, repo, skillName, count: treeCount }));
  }

  if (onProgress) {
    onProgress({ stage: 'detected', percent: 10, message: getServerMessage('SKILL_PROGRESS_DETECTED_PREFIX', { prefix: skillPrefix }), speed: 0, speedFormatted: '' });
  }

  // 2. 探测 tarball 大小
  const spanSize = logger.span('SKILL_LOG_TARBALL_PROBE');
  const tarballSize = await detectTarballSize(owner, repo, branch, agent);
  spanSize.finish('INFO', tarballSize ? 'SKILL_LOG_SIZE' : 'SKILL_LOG_SIZE_UNKNOWN', tarballSize ? { size: formatBytes(tarballSize) } : null);

  if (onProgress) {
    onProgress({
      stage: 'sizing', percent: 15, message: tarballSize
        ? getServerMessage('SKILL_PROGRESS_TARBALL_SIZE', { size: formatBytes(tarballSize) })
        : getServerMessage('SKILL_PROGRESS_CANNOT_DETECT_SIZE'),
      speed: 0, speedFormatted: '',
    });
  }

  let targetDir;
  const fallbackPrefixes = skillName.includes('/') ? [] : [`skills/${skillName}/`, `${skillName}/`];
  const tryPrefixes = [...new Set([skillPrefix, ...fallbackPrefixes])];
  logger.log('INFO', 'SKILL_LOG_TRY_PREFIXES', null, { tryPrefixes, treeCount, hasSize: !!tarballSize });

  // 策略路由
  const tarballTooBig = tarballSize && tarballSize >= 5 * 1024 * 1024;
  const treeTooBig = !tarballSize && treeCount > 300;
  const useApi = tarballTooBig || treeTooBig;

  logger.log('INFO', 'SKILL_LOG_STRATEGY_ROUTE', null, {
    strategy: useApi ? 'API (B)' : 'Tar (A)',
    reason: tarballTooBig ? `tarball ${formatBytes(tarballSize)} >= 5MB`
      : treeTooBig ? `tree ${treeCount} entries > 300, use API`
      : tarballSize ? `tarball ${formatBytes(tarballSize)} < 5MB`
      : 'cannot detect size, small repo try Tar',
    tarballSize, treeCount,
  });

  // ─── 策略 A：Tar 流式下载 ───
  if (!useApi) {
    logger.log('INFO', 'SKILL_LOG_STRATEGY_TAR');

    if (onProgress) {
      onProgress({ stage: 'downloading', percent: 15, message: getServerMessage('SKILL_PROGRESS_TAR_STREAMING'), speed: 0, speedFormatted: '' });
    }

    let tarSucceeded = false;
    let lastTarError;
    let tarAttempt = 0;

    for (const candidatePrefix of tryPrefixes) {
      tarAttempt++;
      const spanTar = logger.span('SKILL_LOG_TAR_ATTEMPT', { n: tarAttempt });
      try {
        targetDir = await downloadViaTar({
          owner, repo, branch, skillPrefix: candidatePrefix,
          targetDir: destDir, agent, onProgress, renameMap,
        });

        const files = fs.readdirSync(targetDir);
        const hasSkillMd = fs.existsSync(path.join(targetDir, 'SKILL.md'));
        logger.log('INFO', 'SKILL_LOG_EXTRACT_RESULT', null, { filesCount: files.length, hasSkillMd });

        if (files.length > 0 && hasSkillMd) {
          tarSucceeded = true;
          spanTar.finish('INFO', 'SKILL_LOG_SUCCESS_N_FILES', { n: files.length });
          break;
        }

        if (candidatePrefix !== skillPrefix || files.length === 0 || !hasSkillMd) {
          spanTar.finish('WARN', 'SKILL_LOG_FAILED', { msg: `${files.length} files, SKILL.md=${hasSkillMd}` }, { filesCount: files.length, hasSkillMd });
          if (onProgress) {
            onProgress({
              stage: 'fallback', percent: 50,
              message: getServerMessage('SKILL_PROGRESS_EXTRACT_NO_README', { n: files.length }),
              speed: 0, speedFormatted: '',
            });
          }
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      } catch (tarErr) {
        lastTarError = tarErr;
        spanTar.finish('ERROR', 'SKILL_LOG_ERROR', { msg: tarErr.message });
        if (onProgress) {
          onProgress({
            stage: 'fallback', percent: 50,
            message: getServerMessage('SKILL_PROGRESS_TAR_FAILED', { msg: tarErr.message }),
            speed: 0, speedFormatted: '',
          });
        }
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }
        // 网络级错误（fetch failed / abort）换前缀无意义，直接跳到 API
        const msg = tarErr.message || '';
        if (msg.includes('fetch failed') || tarErr.name === 'AbortError') {
          logger.log('WARN', 'SKILL_LOG_TAR_NETWORK_FAIL', null, { msg });
          break;
        }
      }
    }

    // Tar 全部失败 → 回退 API
    if (!tarSucceeded) {
      logger.log('WARN', 'SKILL_LOG_API_ATTEMPT', { n: tarAttempt }, { message: 'all Tar attempts failed, fallback to API' });
      if (onProgress) {
        onProgress({ stage: 'fallback', percent: 50, message: getServerMessage('SKILL_PROGRESS_FALLBACK_API'), speed: 0, speedFormatted: '' });
      }
      try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }

      logger.log('INFO', 'SKILL_LOG_API_ATTEMPT', { n: 0 }, { tryPrefixes });
      let apiSucceeded = false;
      let apiAttempt = 0;

      for (const candidatePrefix of tryPrefixes) {
        apiAttempt++;
        const spanApi = logger.span('SKILL_LOG_API_ATTEMPT', { n: apiAttempt });
        try {
          targetDir = await downloadViaApi({
            owner, repo, branch, skillPrefix: candidatePrefix,
            targetDir: destDir, agent, token, onProgress, renameMap,
          });

          const hasSkillMd = fs.existsSync(path.join(targetDir, 'SKILL.md'));
          logger.log('INFO', 'SKILL_LOG_EXTRACT_RESULT', null, { hasSkillMd });

          if (hasSkillMd) {
            apiSucceeded = true;
            spanApi.finish('INFO', 'SKILL_LOG_SUCCESS_WITH_README');
            break;
          }
          spanApi.finish('WARN', 'SKILL_LOG_FAILED', { msg: 'no SKILL.md, continue next prefix' });
          try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }
        } catch (apiErr) {
          spanApi.finish('ERROR', 'SKILL_LOG_ERROR', { msg: apiErr.message });
          try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 50, message: getServerMessage('SKILL_PROGRESS_ALSO_FAILED', { prefix: candidatePrefix, msg: apiErr.message }) });
          }
          // 网络级错误换前缀无意义，直接跳出
          const msg = apiErr.message || '';
          if (msg.includes('fetch failed') || msg.includes('socket disconnected') || apiErr.name === 'AbortError') {
            logger.log('WARN', 'SKILL_LOG_API_NETWORK_FAIL', null, { msg });
            break;
          }
        }
      }

      if (!apiSucceeded) {
        const errMsg = lastTarError ? lastTarError.message : getServerMessage('SKILL_ERROR_ALL_STRATEGIES_FAILED');
        logger.log('ERROR', 'SKILL_ERROR_ALL_STRATEGIES_FAILED');
        throw new Error(errMsg);
      }
    }
  } else {
    // ─── 策略 B：大仓库 → API 并发下载 ───
    logger.log('INFO', 'SKILL_LOG_STRATEGY_API');

    if (onProgress) {
      onProgress({ stage: 'fetching-tree', percent: 15, message: getServerMessage('SKILL_PROGRESS_FETCHING_TREE'), speed: 0, speedFormatted: '' });
    }

    let apiSucceeded = false;
    let apiAttempt = 0;

    for (const candidatePrefix of tryPrefixes) {
      apiAttempt++;
      const spanApi = logger.span('SKILL_LOG_API_ATTEMPT', { n: apiAttempt });
      try {
        targetDir = await downloadViaApi({
          owner, repo, branch, skillPrefix: candidatePrefix,
          targetDir: destDir, agent, token, onProgress, renameMap,
        });

        const hasSkillMd = fs.existsSync(path.join(targetDir, 'SKILL.md'));
        logger.log('INFO', 'SKILL_LOG_EXTRACT_RESULT', null, { filesCount: fs.readdirSync(targetDir).length, hasSkillMd });

        if (hasSkillMd) {
          apiSucceeded = true;
          spanApi.finish('INFO', 'SKILL_LOG_SUCCESS_WITH_README');
          break;
        }
        spanApi.finish('WARN', 'SKILL_LOG_FAILED', { msg: 'no SKILL.md, continue next prefix' });
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }
      } catch (apiErr) {
        spanApi.finish('ERROR', 'SKILL_LOG_ERROR', { msg: apiErr.message });
        if (onProgress) {
          onProgress({ stage: 'fallback', percent: 50, message: getServerMessage('SKILL_PROGRESS_ALSO_FAILED', { prefix: candidatePrefix, msg: apiErr.message }) });
        }
        try { if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true }); } catch { /* ignore */ }
      }
    }

    if (!apiSucceeded) {
      logger.log('ERROR', 'SKILL_ERROR_API_ALL_PREFIXES_FAILED');
      throw new Error(getServerMessage('SKILL_ERROR_API_ALL_PREFIXES_FAILED'));
    }
  }

  // 最终验证
  if (!fs.existsSync(path.join(destDir, 'SKILL.md'))) {
    logger.log('ERROR', 'SKILL_LOG_FINAL_VERIFY_FAILED');
    throw new Error(getServerMessage('SKILL_ERROR_README_NOT_FOUND'));
  }

  const totalElapsed = Date.now() - startTime;
  logger.log('INFO', 'SKILL_LOG_DOWNLOAD_DONE', null, { elapsed: totalElapsed + 'ms' });

  if (onProgress) {
    onProgress({ stage: 'registering', percent: 90, message: getServerMessage('SKILL_PROGRESS_REGISTERING'), speed: 0, speedFormatted: '' });
  }

  return { targetDir: destDir };
}

// ===================== 统一导出 =====================

export { createAgent, parseRepoUrl, ProgressEmitter, applyRenameMap } from './utils.js';
export { downloadViaTar, downloadViaApi, detectTarballSize, detectSkillPrefix } from './http.js';
export { cloneWithGitSparse } from './git.js';
export { downloadAndExtractZip } from './zip.js';
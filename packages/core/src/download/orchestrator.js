/**
 * download/orchestrator.js — 下载编排层
 *
 * 承载 downloadSkillFromGitHub 的主流程编排：
 *   前缀探测 → 大小探测 → 策略路由 → Tar/API 回退 → 最终验证
 *
 * 分离策略执行和回退逻辑为独立函数，消除 index.js 中两层回退的重复代码。
 * 进度语义统一使用 emitProgress + ProgressEmitter（http.js 内部使用）。
 *
 * @module download/orchestrator
 */

import path from 'node:path';
import fs from 'node:fs';
import { Logger, formatBytes } from '../utils/logger.js';
import { getServerMessage } from '../utils/i18n.js';
import {
  downloadViaTar, downloadViaApi,
  detectTarballSize, detectSkillPrefix,
} from './http.js';
import {
  DOWNLOAD_STAGES, createAgent, parseRepoUrl,
  emitProgress,
} from './utils.js';

// ===================== 主入口 =====================

/**
 * 从 GitHub 仓库下载 Skill 的协调入口
 *
 * 接收结构化参数，处理后按策略路由到 Tar 或 API 下载，
 * Tar 失败时自动回退到 API。最终验证 SKILL.md 完整性。
 *
 * 与 index.js 版本相比，核心变化：
 *   - 回退逻辑提取为独立函数，消除两层重复
 *   - 探测阶段用 emitProgress 统一语义（无速度字段）
 *   - REGISTERING 阶段归还给 skill 层，此函数只负责下载到 DONE
 */
export async function downloadSkillFromGitHub({
  repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, onLog, level,
}) {
  const logger = _setupLogger(onLog);
  const startTime = Date.now();
  logger.log('INFO', 'SKILL_LOG_DOWNLOAD_START');

  _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level });

  const { owner, repo } = parseRepoUrl(repoUrl);
  const agent = createAgent(proxy);
  const branch = 'main';
  logger.log('INFO', 'SKILL_LOG_REPO_INFO', null, { owner, repo, branch });

  if (agent) {
    logger.log('INFO', 'SKILL_LOG_PROXY_AGENT_CREATED',
      { type: proxy?.type, host: proxy?.host, port: proxy?.port });
  }

  // 1. 前缀探测
  emitProgress(onProgress, DOWNLOAD_STAGES.CONNECTING, 5,
    getServerMessage('SKILL_PROGRESS_PARSING_REPO'));

  const spPrefix = logger.span('SKILL_LOG_PREFIX_PROBE');
  const { prefix, treeCount, noMatch } = await detectSkillPrefix(
    owner, repo, skillName, branch, agent, token,
  );
  spPrefix.finish('INFO', 'SKILL_LOG_PREFIX_RESULT', { prefix });

  if (noMatch) {
    logger.log('ERROR', 'SKILL_ERROR_SKILL_NOT_FOUND_REPO',
      { owner, repo, skillName, count: treeCount });
    throw new Error(getServerMessage('SKILL_ERROR_SKILL_NOT_FOUND_REPO',
      { owner, repo, skillName, count: treeCount }));
  }

  emitProgress(onProgress, DOWNLOAD_STAGES.DETECTED, 10,
    getServerMessage('SKILL_PROGRESS_DETECTED_PREFIX', { prefix }));

  // 2. tarball 大小探测
  const spSize = logger.span('SKILL_LOG_TARBALL_PROBE');
  const tarballSize = await detectTarballSize(owner, repo, branch, agent);
  spSize.finish('INFO', tarballSize ? 'SKILL_LOG_SIZE' : 'SKILL_LOG_SIZE_UNKNOWN',
    tarballSize ? { size: formatBytes(tarballSize) } : null);

  emitProgress(onProgress, DOWNLOAD_STAGES.SIZING, 15,
    tarballSize
      ? getServerMessage('SKILL_PROGRESS_TARBALL_SIZE', { size: formatBytes(tarballSize) })
      : getServerMessage('SKILL_PROGRESS_CANNOT_DETECT_SIZE'));

  // 3. 构建尝试前缀列表 + 策略路由
  const fallbackPrefixes = skillName.includes('/') ? [] : [`skills/${skillName}/`, `${skillName}/`];
  const tryPrefixes = [...new Set([prefix, ...fallbackPrefixes])];
  logger.log('INFO', 'SKILL_LOG_TRY_PREFIXES', null, { tryPrefixes, treeCount, hasSize: !!tarballSize });

  const useApi = _shouldUseApi(tarballSize, treeCount);
  _logStrategy(logger, useApi, tarballSize, treeCount);

  // 4. 执行下载（含自动回退）
  useApi
    ? await _executeApiStrategy({
        owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      })
    : await _executeTarWithFallback({
        owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      });

  // 5. 最终验证
  _verifyResult(destDir, logger);

  const totalElapsed = Date.now() - startTime;
  logger.log('INFO', 'SKILL_LOG_DOWNLOAD_DONE', null, { elapsed: `${totalElapsed}ms` });

  return { targetDir: destDir };
}

// ===================== 内部辅助 =====================

function _setupLogger(onLog) {
  const logger = new Logger();
  logger.setCallback(onLog);
  logger.setFile(path.join(process.cwd(), 'download-skill.log'));
  return logger;
}

function _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level }) {
  logger.log('INFO', 'SKILL_LOG_PARAMS', null, {
    repoUrl, skillName, destDir,
    hasProxy: !!proxy, proxyType: proxy?.type,
    hasToken: !!token, hasRenameMap: !!renameMap,
    hasOnProgress: !!onProgress, level,
  });
}

function _shouldUseApi(tarballSize, treeCount) {
  return (tarballSize && tarballSize >= 5 * 1024 * 1024) || (!tarballSize && treeCount > 300);
}

function _logStrategy(logger, useApi, tarballSize, treeCount) {
  const reason = useApi
    ? (tarballSize && tarballSize >= 5 * 1024 * 1024
        ? `tarball ${formatBytes(tarballSize)} >= 5MB`
        : `tree ${treeCount} entries > 300, use API`)
    : (tarballSize
        ? `tarball ${formatBytes(tarballSize)} < 5MB`
        : 'cannot detect size, small repo try Tar');

  logger.log('INFO', 'SKILL_LOG_STRATEGY_ROUTE', null, {
    strategy: useApi ? 'API (B)' : 'Tar (A)',
    reason, tarballSize, treeCount,
  });
}

// ─── Tar 策略 + API 回退 ───

async function _executeTarWithFallback({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger }) {
  logger.log('INFO', 'SKILL_LOG_STRATEGY_TAR');
  emitProgress(onProgress, DOWNLOAD_STAGES.DOWNLOADING, 15,
    getServerMessage('SKILL_PROGRESS_TAR_STREAMING'));

  let tarSucceeded = false;
  let lastTarError;
  let tarAttempt = 0;

  for (const candidatePrefix of tryPrefixes) {
    tarAttempt++;
    const span = logger.span('SKILL_LOG_TAR_ATTEMPT', { n: tarAttempt });
    try {
      await downloadViaTar({
        owner, repo, branch, skillPrefix: candidatePrefix,
        targetDir: destDir, agent, onProgress, renameMap,
      });

      const files = fs.readdirSync(destDir);
      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'SKILL_LOG_EXTRACT_RESULT', null, { filesCount: files.length, hasSkillMd });

      if (files.length > 0 && hasSkillMd) {
        tarSucceeded = true;
        span.finish('INFO', 'SKILL_LOG_SUCCESS_N_FILES', { n: files.length });
        break;
      }

      span.finish('WARN', 'SKILL_LOG_FAILED',
        { msg: `${files.length} files, SKILL.md=${hasSkillMd}` });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('SKILL_PROGRESS_EXTRACT_NO_README', { n: files.length }));
      _safeRm(destDir);
    } catch (tarErr) {
      lastTarError = tarErr;
      span.finish('ERROR', 'SKILL_LOG_ERROR', { msg: tarErr.message });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('SKILL_PROGRESS_TAR_FAILED', { msg: tarErr.message }));
      _safeRm(destDir);

      const msg = tarErr.message || '';
      if (msg.includes('fetch failed') || tarErr.name === 'AbortError') {
        logger.log('WARN', 'SKILL_LOG_TAR_NETWORK_FAIL', null, { msg });
        break;
      }
    }
  }

  if (!tarSucceeded) {
    return _fallbackToApi({
      owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      lastTarError, tarAttempt,
    });
  }

  return destDir;
}

// ─── API 回退（从 Tar 降级） ───

async function _fallbackToApi({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger, lastTarError, tarAttempt }) {
  logger.log('WARN', 'SKILL_LOG_API_ATTEMPT', { n: tarAttempt },
    { message: 'all Tar attempts failed, fallback to API' });
  emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
    getServerMessage('SKILL_PROGRESS_FALLBACK_API'));
  _safeRm(destDir);

  return _executeApiStrategy({
    owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
    isFallback: true, lastTarError,
  });
}

// ─── 纯 API 策略（直接或回退） ───

async function _executeApiStrategy({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger, isFallback, lastTarError }) {
  if (!isFallback) {
    logger.log('INFO', 'SKILL_LOG_STRATEGY_API');
    emitProgress(onProgress, DOWNLOAD_STAGES.FETCHING_TREE, 15,
      getServerMessage('SKILL_PROGRESS_FETCHING_TREE'));
  }

  let apiSucceeded = false;
  let apiAttempt = 0;

  for (const candidatePrefix of tryPrefixes) {
    apiAttempt++;
    const span = logger.span('SKILL_LOG_API_ATTEMPT', { n: apiAttempt });
    try {
      await downloadViaApi({
        owner, repo, branch, skillPrefix: candidatePrefix,
        targetDir: destDir, agent, token, onProgress, renameMap,
      });

      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'SKILL_LOG_EXTRACT_RESULT', null, {
        filesCount: fs.readdirSync(destDir).length, hasSkillMd,
      });

      if (hasSkillMd) {
        apiSucceeded = true;
        span.finish('INFO', 'SKILL_LOG_SUCCESS_WITH_README');
        break;
      }

      span.finish('WARN', 'SKILL_LOG_FAILED', { msg: 'no SKILL.md, continue next prefix' });
      _safeRm(destDir);
    } catch (apiErr) {
      span.finish('ERROR', 'SKILL_LOG_ERROR', { msg: apiErr.message });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('SKILL_PROGRESS_ALSO_FAILED',
          { prefix: candidatePrefix, msg: apiErr.message }));
      _safeRm(destDir);

      const msg = apiErr.message || '';
      if (msg.includes('fetch failed') || msg.includes('socket disconnected') || apiErr.name === 'AbortError') {
        logger.log('WARN', 'SKILL_LOG_API_NETWORK_FAIL', null, { msg });
        break;
      }
    }
  }

  if (!apiSucceeded) {
    const errMsg = isFallback && lastTarError
      ? lastTarError.message
      : getServerMessage(isFallback ? 'SKILL_ERROR_ALL_STRATEGIES_FAILED' : 'SKILL_ERROR_API_ALL_PREFIXES_FAILED');
    logger.log('ERROR',
      isFallback ? 'SKILL_ERROR_ALL_STRATEGIES_FAILED' : 'SKILL_ERROR_API_ALL_PREFIXES_FAILED');
    throw new Error(errMsg);
  }

  return destDir;
}

// ─── 最终验证 ───

function _verifyResult(destDir, logger) {
  if (!fs.existsSync(path.join(destDir, 'SKILL.md'))) {
    logger.log('ERROR', 'SKILL_LOG_FINAL_VERIFY_FAILED');
    throw new Error(getServerMessage('SKILL_ERROR_README_NOT_FOUND'));
  }
}

function _safeRm(dir) {
  try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}
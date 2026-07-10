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
  DOWNLOAD_STAGES, createAgent, parseRepoUrl, parseGithubTreeUrl,
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
  repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, onLog, level, branch,
}) {
  const logger = _setupLogger(onLog);
  const startTime = Date.now();
  logger.log('INFO', 'skillLogDownloadStart');

  _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level });

  const { owner, repo } = parseRepoUrl(repoUrl);
  const agent = createAgent(proxy);

  // 分支解析优先级：显式传入 > tree URL 中提取 > 默认 main
  let effectiveBranch = branch;
  if (!effectiveBranch) {
    const treeParsed = parseGithubTreeUrl(repoUrl);
    effectiveBranch = treeParsed?.branch || 'main';
  }
  logger.log('INFO', 'skillLogRepoInfo', null, { owner, repo, branch: effectiveBranch });

  if (agent) {
    logger.log('INFO', 'skillLogProxyAgentCreated',
      { type: proxy?.type, host: proxy?.host, port: proxy?.port });
  }

  // 1. 前缀探测
  emitProgress(onProgress, DOWNLOAD_STAGES.CONNECTING, 5,
    getServerMessage('skillProgressParsingRepo'));

  const spPrefix = logger.span('skillLogPrefixProbe');
  const { prefix, treeCount, noMatch } = await detectSkillPrefix(
    owner, repo, skillName, effectiveBranch, agent, token,
  );
  spPrefix.finish('INFO', 'skillLogPrefixResult', { prefix });

  if (noMatch) {
    logger.log('ERROR', 'skillErrorSkillNotFoundRepo',
      { owner, repo, skillName, count: treeCount });
    throw new Error(getServerMessage('skillErrorSkillNotFoundRepo',
      { owner, repo, skillName, count: treeCount }));
  }

  emitProgress(onProgress, DOWNLOAD_STAGES.DETECTED, 10,
    getServerMessage('skillProgressDetectedPrefix', { prefix }));

  // 2. tarball 大小探测
  const spSize = logger.span('skillLogTarballProbe');
  const tarballSize = await detectTarballSize(owner, repo, effectiveBranch, agent);
  spSize.finish('INFO', tarballSize ? 'skillLogSize' : 'skillLogSizeUnknown',
    tarballSize ? { size: formatBytes(tarballSize) } : null);

  emitProgress(onProgress, DOWNLOAD_STAGES.SIZING, 15,
    tarballSize
      ? getServerMessage('skillProgressTarballSize', { size: formatBytes(tarballSize) })
      : getServerMessage('skillProgressCannotDetectSize'));

  // 3. 构建尝试前缀列表 + 策略路由
  const fallbackPrefixes = skillName.includes('/') ? [] : [`skills/${skillName}/`, `${skillName}/`];
  const tryPrefixes = [...new Set([prefix, ...fallbackPrefixes])];
  logger.log('INFO', 'skillLogTryPrefixes', null, { tryPrefixes, treeCount, hasSize: !!tarballSize });

  const useApi = _shouldUseApi(tarballSize, treeCount);
  _logStrategy(logger, useApi, tarballSize, treeCount);

  // 4. 执行下载（含自动回退）
  useApi
    ? await _executeApiStrategy({
        owner, repo, branch: effectiveBranch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      })
    : await _executeTarWithFallback({
        owner, repo, branch: effectiveBranch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      });

  // 5. 最终验证
  _verifyResult(destDir, logger);

  const totalElapsed = Date.now() - startTime;
  logger.log('INFO', 'skillLogDownloadDone', null, { elapsed: `${totalElapsed}ms` });

  return { targetDir: destDir };
}

// ===================== 内部辅助 =====================

function _setupLogger(onLog) {
  const logger = new Logger();
  logger.setCallback(onLog);
  logger.setFile(path.join(process.cwd(), 'data', 'download-skill.log'));
  return logger;
}

function _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level }) {
  logger.log('INFO', 'skillLogParams', null, {
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

  logger.log('INFO', 'skillLogStrategyRoute', null, {
    strategy: useApi ? 'API (B)' : 'Tar (A)',
    reason, tarballSize, treeCount,
  });
}

// ─── Tar 策略 + API 回退 ───

async function _executeTarWithFallback({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger }) {
  logger.log('INFO', 'skillLogStrategyTar');
  emitProgress(onProgress, DOWNLOAD_STAGES.DOWNLOADING, 15,
    getServerMessage('skillProgressTarStreaming'));

  let tarSucceeded = false;
  let lastTarError;
  let tarAttempt = 0;

  for (const candidatePrefix of tryPrefixes) {
    tarAttempt++;
    const span = logger.span('skillLogTarAttempt', { n: tarAttempt });
    try {
      await downloadViaTar({
        owner, repo, branch, skillPrefix: candidatePrefix,
        targetDir: destDir, agent, onProgress, renameMap,
      });

      const files = fs.readdirSync(destDir);
      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'skillLogExtractResult', null, { filesCount: files.length, hasSkillMd });

      if (files.length > 0 && hasSkillMd) {
        tarSucceeded = true;
        span.finish('INFO', 'skillLogSuccessNFiles', { n: files.length });
        break;
      }

      span.finish('WARN', 'skillLogFailed',
        { msg: `${files.length} files, SKILL.md=${hasSkillMd}` });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('skillProgressExtractNoReadme', { n: files.length }));
      _safeRm(destDir);
    } catch (tarErr) {
      lastTarError = tarErr;
      span.finish('ERROR', 'skillLogError', { msg: tarErr.message });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('skillProgressTarFailed', { msg: tarErr.message }));
      _safeRm(destDir);

      const msg = tarErr.message || '';
      if (msg.includes('fetch failed') || tarErr.name === 'AbortError') {
        logger.log('WARN', 'skillLogTarNetworkFail', null, { msg });
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
  logger.log('WARN', 'skillLogApiAttempt', { n: tarAttempt },
    { message: 'all Tar attempts failed, fallback to API' });
  emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
    getServerMessage('skillProgressFallbackApi'));
  _safeRm(destDir);

  return _executeApiStrategy({
    owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
    isFallback: true, lastTarError,
  });
}

// ─── 纯 API 策略（直接或回退） ───

async function _executeApiStrategy({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger, isFallback, lastTarError }) {
  if (!isFallback) {
    logger.log('INFO', 'skillLogStrategyApi');
    emitProgress(onProgress, DOWNLOAD_STAGES.FETCHING_TREE, 15,
      getServerMessage('skillProgressFetchingTree'));
  }

  let apiSucceeded = false;
  let apiAttempt = 0;

  for (const candidatePrefix of tryPrefixes) {
    apiAttempt++;
    const span = logger.span('skillLogApiAttempt', { n: apiAttempt });
    try {
      await downloadViaApi({
        owner, repo, branch, skillPrefix: candidatePrefix,
        targetDir: destDir, agent, token, onProgress, renameMap,
      });

      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'skillLogExtractResult', null, {
        filesCount: fs.readdirSync(destDir).length, hasSkillMd,
      });

      if (hasSkillMd) {
        apiSucceeded = true;
        span.finish('INFO', 'skillLogSuccessWithReadme');
        break;
      }

      span.finish('WARN', 'skillLogFailed', { msg: 'no SKILL.md, continue next prefix' });
      _safeRm(destDir);
    } catch (apiErr) {
      span.finish('ERROR', 'skillLogError', { msg: apiErr.message });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('skillProgressAlsoFailed',
          { prefix: candidatePrefix, msg: apiErr.message }));
      _safeRm(destDir);

      const msg = apiErr.message || '';
      if (msg.includes('fetch failed') || msg.includes('socket disconnected') || apiErr.name === 'AbortError') {
        logger.log('WARN', 'skillLogApiNetworkFail', null, { msg });
        break;
      }
    }
  }

  if (!apiSucceeded) {
    const errMsg = isFallback && lastTarError
      ? lastTarError.message
      : getServerMessage(isFallback ? 'skillErrorAllStrategiesFailed' : 'skillErrorApiAllPrefixesFailed');
    logger.log('ERROR',
      isFallback ? 'skillErrorAllStrategiesFailed' : 'skillErrorApiAllPrefixesFailed');
    throw new Error(errMsg);
  }

  return destDir;
}

// ─── 最终验证 ───

function _verifyResult(destDir, logger) {
  if (!fs.existsSync(path.join(destDir, 'SKILL.md'))) {
    logger.log('ERROR', 'skillLogFinalVerifyFailed');
    throw new Error(getServerMessage('skillErrorReadmeNotFound'));
  }
}

function _safeRm(dir) {
  try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}
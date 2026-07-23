/**
 * download/orchestrator.js — 下载编排层
 *
 * 承载 downloadSkillFromGitHub 的主流程编排：
 *   1. 前缀探测：确定 skill 在仓库中的路径
 *   2. 大小探测：获取 tarball 大小，用于策略路由
 *   3. 策略路由：根据大小和文件数选择 Tar 或 API 策略
 *   4. 执行下载：含自动回退（Tar 失败 -> API）
 *   5. 最终验证：确认 SKILL.md 存在
 *
 * 分离策略执行和回退逻辑为独立函数，消除重复代码。
 * 进度语义统一使用 emitProgress + ProgressEmitter（http.js 内部使用）。
 *
 * @module download/orchestrator
 */
import path from 'node:path';
import fs from 'node:fs';
import { Logger, formatBytes } from '../utils/logger.js';
import { getServerMessage } from '../utils/i18n.js';
import { TARBALL_SIZE_THRESHOLD, TREE_COUNT_THRESHOLD } from '../constants.js';
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
 * 这是 download 层的核心函数，被 skill/install.js 调用。
 * 接收结构化参数，处理后按策略路由到 Tar 或 API 下载，
 * Tar 失败时自动回退到 API。最终验证 SKILL.md 完整性。
 *
 * 与旧版 index.js 相比，核心变化：
 *   - 回退逻辑提取为独立函数，消除两层重复
 *   - 探测阶段用 emitProgress 统一语义（无速度字段）
 *   - REGISTERING 阶段归还给 skill 层，此函数只负责下载到 DONE
 *
 * @param {object} params
 * @param {string} params.repoUrl - GitHub 仓库 URL（支持普通 URL 和 tree URL）
 * @param {string} params.skillName - skill 名称，可能包含路径（如 skills/my-skill/）
 * @param {string} params.destDir - 下载目标目录
 * @param {object} [params.proxy] - 代理配置，格式见 utils.proxyToUrl
 * @param {string} [params.token] - GitHub Personal Access Token，用于提高 API 限额和访问私有仓库
 * @param {object} [params.renameMap] - 路径重命名映射表，格式见 utils.applyRenameMap
 * @param {Function} [params.onProgress] - 进度回调函数，前端 SSE 推送用
 * @param {Function} [params.onLog] - 日志回调函数，用于前端实时日志展示
 * @param {string} [params.level] - 日志级别过滤，如 'INFO'、'WARN'、'ERROR'
 * @param {string} [params.branch] - 分支名，默认从 URL 或 tree 中提取，失败时回退到 'main'
 * @returns {Promise<{ targetDir: string }>} 下载结果，targetDir 为 skill 根目录
 */
export async function downloadSkillFromGitHub({
  repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, onLog, level, branch,
}) {
  const logger = _setupLogger(onLog);
  const startTime = Date.now();
  logger.log('INFO', 'skillLogDownloadStart');
  _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level });
  // 从 repoUrl 中提取 owner 和 repo（支持 https://github.com/owner/repo 格式）
  const { owner, repo } = parseRepoUrl(repoUrl);
  // 创建 HTTP 代理 agent，供 fetch 和 Octokit 使用
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
  // 1. 前缀探测：确定 skill 在仓库中的路径前缀
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
  // 2. tarball 大小探测：用于策略路由
  const spSize = logger.span('skillLogTarballProbe');
  const tarballSize = await detectTarballSize(owner, repo, effectiveBranch, agent);
  spSize.finish('INFO', tarballSize ? 'skillLogSize' : 'skillLogSizeUnknown',
    tarballSize ? { size: formatBytes(tarballSize) } : null);
  emitProgress(onProgress, DOWNLOAD_STAGES.SIZING, 15,
    tarballSize
      ? getServerMessage('skillProgressTarballSize', { size: formatBytes(tarballSize) })
      : getServerMessage('skillProgressCannotDetectSize'));
  // 3. 构建尝试前缀列表 + 策略路由
  //    如果 skillName 不包含 '/'，则先尝试 skills/{skillName}/，再尝试 {skillName}/
  const fallbackPrefixes = skillName.includes('/') ? [] : [`skills/${skillName}/`, `${skillName}/`];
  const tryPrefixes = [...new Set([prefix, ...fallbackPrefixes])];
  logger.log('INFO', 'skillLogTryPrefixes', null, { tryPrefixes, treeCount, hasSize: !!tarballSize });
  // 策略选择条件：
  //   - 使用 API：tarball >= 5MB，或无法探测大小且文件数 > 300
  //   - 使用 Tar：tarball < 5MB，或无法探测大小且文件数 <= 300
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
  // 5. 最终验证：确认下载结果包含 SKILL.md
  _verifyResult(destDir, logger);
  const totalElapsed = Date.now() - startTime;
  logger.log('INFO', 'skillLogDownloadDone', null, { elapsed: `${totalElapsed}ms` });
  return { targetDir: destDir };
}
// ===================== 内部辅助 =====================
/**
 * 创建带日志回调的 Logger 实例
 * @param {Function} [onLog] - 日志回调函数
 * @returns {Logger} Logger 实例
 */
function _setupLogger(onLog) {
  const logger = new Logger();
  logger.setCallback(onLog);
  logger.setFile(path.join(process.cwd(), 'data', 'download-skill.log'));
  return logger;
}
/**
 * 记录下载参数到日志
 * @param {Logger} logger - Logger 实例
 * @param {object} params - 下载参数
 */
function _logParams(logger, { repoUrl, skillName, destDir, proxy, token, renameMap, onProgress, level }) {
  logger.log('INFO', 'skillLogParams', null, {
    repoUrl, skillName, destDir,
    hasProxy: !!proxy, proxyType: proxy?.type, proxyHost: proxy?.host, proxyPort: proxy?.port,
    hasToken: !!token, hasRenameMap: !!renameMap,
    hasOnProgress: !!onProgress, level,
  });
}
/**
 * 判断是否使用 API 策略
 * @param {number|null} tarballSize - tarball 大小（字节）
 * @param {number} treeCount - 仓库文件数
 * @returns {boolean} true 表示使用 API 策略，false 表示使用 Tar 策略
 */
function _shouldUseApi(tarballSize, treeCount) {
  return (tarballSize && tarballSize >= TARBALL_SIZE_THRESHOLD) || (!tarballSize && treeCount > TREE_COUNT_THRESHOLD);
}
/**
 * 记录策略选择到日志
 * @param {Logger} logger - Logger 实例
 * @param {boolean} useApi - 是否使用 API 策略
 * @param {number|null} tarballSize - tarball 大小
 * @param {number} treeCount - 仓库文件数
 */
function _logStrategy(logger, useApi, tarballSize, treeCount) {
  const reason = useApi
    ? (tarballSize && tarballSize >= TARBALL_SIZE_THRESHOLD
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
/**
 * 执行 Tar 策略，失败时自动回退到 API 策略
 *
 * Tar 策略失败原因：
 *   - 网络超时或连接失败
 *   - 解压后内容不符合预期（前缀匹配错误）
 *   - 所有候选前缀都失败
 *
 * @param {object} params
 * @param {string} params.owner - GitHub 仓库 owner
 * @param {string} params.repo - GitHub 仓库名
 * @param {string} params.branch - 分支名
 * @param {string[]} params.tryPrefixes - 尝试的前缀列表
 * @param {string} params.destDir - 下载目标目录
 * @param {ProxyAgent} params.agent - 代理实例
 * @param {string} [params.token] - GitHub Token
 * @param {object} [params.renameMap] - 路径重命名映射表
 * @param {Function} [params.onProgress] - 进度回调函数
 * @param {Logger} logger - Logger 实例
 */
async function _executeTarWithFallback({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger }) {
  logger.log('INFO', 'skillLogStrategyTar');
  emitProgress(onProgress, DOWNLOAD_STAGES.DOWNLOADING, 15,
    getServerMessage('skillProgressTarStreaming'));
  let lastTarError;
  let tarAttempt = 0;
  // 依次尝试每个前缀，成功后跳出循环
  for (const candidatePrefix of tryPrefixes) {
    tarAttempt++;
    const span = logger.span('skillLogTarAttempt', { n: tarAttempt });
    try {
      await downloadViaTar({
        owner, repo, branch, skillPrefix: candidatePrefix,
        targetDir: destDir, agent, onProgress, renameMap,
      });
      // 验证下载结果：检查目标目录是否非空且包含 SKILL.md
      const files = fs.readdirSync(destDir);
      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'skillLogExtractResult', null, { filesCount: files.length, hasSkillMd });
      if (files.length > 0 && hasSkillMd) {
        span.finish('INFO', 'skillLogSuccessNFiles', { n: files.length });
        break;
      }
      // 解压成功但内容不符合预期（可能是前缀匹配错误），清理后继续尝试
      span.finish('WARN', 'skillLogFailed',
        { msg: `${files.length} files, SKILL.md=${hasSkillMd}` });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('skillProgressExtractNoReadme', { n: files.length }));
      _safeRm(destDir);
    } catch (tarErr) {
      // Tar 下载失败，记录错误并清理
      lastTarError = tarErr;
      span.finish('ERROR', 'skillLogError', { msg: tarErr.message }, { error: tarErr.stack });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 50,
        getServerMessage('skillProgressTarFailed', { msg: tarErr.message }));
      _safeRm(destDir);
      // 如果不是最后一个前缀，继续尝试下一个
      if (candidatePrefix !== tryPrefixes[tryPrefixes.length - 1]) {
        continue;
      }
      // 所有前缀都失败，回退到 API 策略
      logger.log('WARN', 'skillLogTarAllFailed', { msg: lastTarError.message });
      await _executeApiStrategy({
        owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger,
      });
      return;
    }
  }
}
// ─── API 策略（含回退） ───
/**
 * 执行 API 策略，失败时回退到另一个前缀或抛出错误
 *
 * API 策略失败原因：
 *   - GitHub API 速率限制
 *   - 网络错误
 *   - 所有候选前缀下都无匹配文件
 *
 * @param {object} params
 * @param {string} params.owner - GitHub 仓库 owner
 * @param {string} params.repo - GitHub 仓库名
 * @param {string} params.branch - 分支名
 * @param {string[]} params.tryPrefixes - 尝试的前缀列表
 * @param {string} params.destDir - 下载目标目录
 * @param {ProxyAgent} params.agent - 代理实例
 * @param {string} [params.token] - GitHub Token
 * @param {object} [params.renameMap] - 路径重命名映射表
 * @param {Function} [params.onProgress] - 进度回调函数
 * @param {Logger} logger - Logger 实例
 */
async function _executeApiStrategy({ owner, repo, branch, tryPrefixes, destDir, agent, token, renameMap, onProgress, logger }) {
  logger.log('INFO', 'skillLogStrategyApi');
  emitProgress(onProgress, DOWNLOAD_STAGES.FETCHING_TREE, 20,
    getServerMessage('skillProgressFetchingTree'));
  // 依次尝试每个前缀
  for (const prefix of tryPrefixes) {
    const span = logger.span('skillLogApiAttempt', { prefix });
    try {
      await downloadViaApi({
        owner, repo, branch, skillPrefix: prefix,
        targetDir: destDir, agent, token, onProgress, renameMap,
      });
      const files = fs.readdirSync(destDir);
      const hasSkillMd = fs.existsSync(path.join(destDir, 'SKILL.md'));
      logger.log('INFO', 'skillLogApiResult', null, { prefix, filesCount: files.length, hasSkillMd });
      if (files.length > 0 && hasSkillMd) {
        span.finish('INFO', 'skillLogSuccessNFiles', { n: files.length });
        return;
      }
      span.finish('WARN', 'skillLogFailed', { msg: `${files.length} files, SKILL.md=${hasSkillMd}` });
      emitProgress(onProgress, DOWNLOAD_STAGES.FALLBACK, 70,
        getServerMessage('skillProgressExtractNoReadme', { n: files.length }));
      _safeRm(destDir);
    } catch (err) {
      span.finish('ERROR', 'skillLogError', { msg: err.message }, { error: err.stack });
      if (prefix !== tryPrefixes[tryPrefixes.length - 1]) continue;
      logger.log('ERROR', 'skillLogApiAllFailed', { msg: err.message }, { error: err.stack });
      throw new Error(getServerMessage('skillErrorAllStrategiesFailed', { msg: err.message }), { cause: err });
    }
  }
}
/**
 * 验证下载结果：确认目标目录非空且包含 SKILL.md
 * @param {string} destDir - 下载目标目录
 * @param {Logger} logger - Logger 实例
 * @throws {Error} 目录为空或缺少 SKILL.md
 */
function _verifyResult(destDir, logger) {
  const files = fs.readdirSync(destDir);
  logger.log('INFO', 'skillLogVerifyResult', null, { filesCount: files.length });
  if (!files.length) {
    throw new Error(getServerMessage('skillErrorEmptyResult'));
  }
  if (!fs.existsSync(path.join(destDir, 'SKILL.md'))) {
    throw new Error(getServerMessage('skillErrorReadmeNotFound'));
  }
}
/**
 * 安全删除目录（忽略错误）
 * @param {string} dir - 要删除的目录
 */
function _safeRm(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

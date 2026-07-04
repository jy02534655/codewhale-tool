/**
 * Skill 安装模块
 * 提供 GitHub / ZIP / Registry / 本地目录 / Tree Path 等多种安装方式
 */

import { existsSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import AdmZip from 'adm-zip';
import { downloadSkillFromGitHub, downloadAndExtractZip } from '../download/index.js';
import { okMsg, failMsg, fail } from '../utils/result.js';
import { getServerMessage } from '../utils/i18n.js';
import { emitSkillInstallLog, _extractMeta, _parseGitHubUrl, _parseProxyUrl } from './shared.js';


// ------------------------------------------------------------------ //
// 内部辅助
// ------------------------------------------------------------------ //

/**
 * 统一收尾：写入 store entry + 记录安装参数（供前端回填）
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} level
 * @param {{name:string, description:string}} meta
 * @param {string} targetDir
 * @param {Object} rawOpts
 */
function _finalizeInstall(store, skillId, level, meta, targetDir, rawOpts) {
  store.addToConfig({
    id: skillId,
    name: meta.name || skillId,
    description: meta.description,
    path: targetDir,
    enabled: true,
    source: 'community',
    version: 'latest',
    installed_at: Date.now(),
    updated_at: Date.now(),
  }, level);

  // 浅拷贝原始参数供前端回填，去掉内部字段
  if (rawOpts) {
    const params = Object.assign({}, rawOpts);
    delete params._skillId;
    delete params._targetDir;
    store.mutate(skillId, function (entries, idx) {
      if (idx >= 0) entries[idx].installParams = params;
    }, level);
  }
}


// ------------------------------------------------------------------ //
// 底层安装函数
// ------------------------------------------------------------------ //

/**
 * 从 GitHub 仓库安装 skill（V2 内部实现）
 * @param {SkillStore} store
 * @param {Object} opts
 * @param {string} opts.repoUrl
 * @param {string} [opts.skillPath]
 * @param {string} [opts.level='global']
 * @param {Object} [opts.proxyConfig]
 * @param {string} [opts.proxyUrl]
 * @param {string} [opts.proxyId]
 * @param {string} [opts.tokenId]
 * @param {string} [opts._skillId]      - 内部覆盖 skillId（update 场景）
 * @param {string} [opts._targetDir]    - 内部覆盖 targetDir（update 场景）
 * @param {Function} [progressCb]
 * @param {Function} [logCb]
 */
export async function _installFromGitHubV2(store, opts, progressCb, logCb) {
  const targetLevel = opts.level || 'global';
  const onProgress = progressCb;
  const onLog = logCb;

  const parsed = _parseGitHubUrl(opts.repoUrl);
  if (!parsed) return failMsg('SKILL_INVALID_REPO_URL');

  const finalSkillId = opts._skillId || (opts.skillPath ? basename(opts.skillPath) : parsed.repo);
  const finalTargetDir = opts._targetDir || (targetLevel === 'project'
    ? join(process.cwd(), store.projectSkillsDir, finalSkillId)
    : join(store.skillsDir, finalSkillId));

  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.id === finalSkillId; })) {
    return failMsg('SKILL_ALREADY_INSTALLED');
  }

  try {
    if (onProgress) {
      onProgress({ stage: 'connecting', percent: 5, message: getServerMessage('SKILL_PROGRESS_CONNECTING_GITHUB') });
    }

    if (!opts.proxyConfig && opts.proxyUrl) {
      opts.proxyConfig = _parseProxyUrl(opts.proxyUrl);
    }
    if (!opts.proxyConfig && opts.proxyId) {
      const proxyEntry = store.engine.findProxy(opts.proxyId);
      if (proxyEntry) {
        opts.proxyConfig = {
          type: proxyEntry.type,
          host: proxyEntry.host,
          port: proxyEntry.port,
          auth: proxyEntry.auth
            ? { username: proxyEntry.auth.username, password: proxyEntry.auth.password }
            : undefined,
        };
      }
    }

    let token;
    if (opts.tokenId) {
      const tokenEntry = store.engine.findToken(opts.tokenId);
      if (tokenEntry) token = tokenEntry.token;
    }

    await downloadSkillFromGitHub({
      repoUrl: opts.repoUrl,
      skillName: opts.skillPath || parsed.repo,
      destDir: finalTargetDir,
      proxy: opts.proxyConfig,
      token,
      onProgress,
      onLog,
      branch: opts.branch,
    });

    if (onProgress) {
      onProgress({ stage: 'registering', percent: 90, message: getServerMessage('SKILL_PROGRESS_REGISTERING') });
    }

    const meta = _extractMeta(finalTargetDir);
    _finalizeInstall(store, finalSkillId, targetLevel, meta, finalTargetDir, opts);

    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
    }

    return okMsg('synced');
  } catch (err) {
    try { if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
    return fail(failMessage, 'SKILL_INSTALL_FAILED');
  }
}

/**
 * 从 ZIP 源安装 skill（URL 或本地文件）
 * @param {SkillStore} store
 * @param {string} zipSource
 * @param {string} [skillPath]
 * @param {string} [level='global']
 * @param {Object|string} [proxyConfig]
 * @param {Function} [onProgress]
 * @param {Object} [_internal]          - 内部覆盖字段（update 场景）
 * @param {string} [_internal._skillId]
 * @param {string} [_internal._targetDir]
 * @param {Object} [_internal._rawOpts]
 */
export async function installFromZip(store, zipSource, skillPath, level, proxyConfig, onProgress, _internal) {
  const targetLevel = level || 'global';

  const finalSkillId = (_internal && _internal._skillId) ||
    (skillPath ? basename(skillPath) : basename(zipSource).replace(/\.zip$/i, '') || 'skill');
  const finalTargetDir = (_internal && _internal._targetDir) ||
    (targetLevel === 'project'
      ? join(process.cwd(), store.projectSkillsDir, finalSkillId)
      : join(store.skillsDir, finalSkillId));

  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.id === finalSkillId; })) {
    return failMsg('SKILL_ALREADY_INSTALLED');
  }

  try {
    const tempDir = join(tmpdir(), 'skill-extract-' + randomUUID());
    let extractRoot;

    if (/^https?:\/\//i.test(zipSource)) {
      let finalProxyConfig;
      if (typeof proxyConfig === 'string') {
        finalProxyConfig = _parseProxyUrl(proxyConfig);
      } else if (proxyConfig) {
        finalProxyConfig = proxyConfig;
      }
      extractRoot = await downloadAndExtractZip(zipSource, tempDir, finalProxyConfig, onProgress);
    } else {
      const zip = new AdmZip(zipSource);
      zip.extractAllTo(tempDir, true);
      extractRoot = tempDir;
    }

    let sourceDir;
    if (skillPath) {
      sourceDir = store.findSkillDir(extractRoot, skillPath);
      if (!sourceDir) {
        if (existsSync(join(extractRoot, 'SKILL.md'))) {
          sourceDir = extractRoot;
        } else {
          try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
          return failMsg('SKILL_NOT_FOUND');
        }
      }
    } else {
      sourceDir = extractRoot;
      if (!existsSync(join(sourceDir, 'SKILL.md'))) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
        return failMsg('SKILL_NOT_FOUND');
      }
    }

    if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true });

    const meta = _extractMeta(sourceDir);
    store.copyDir(sourceDir, finalTargetDir);

    const rawOpts = (_internal && _internal._rawOpts) || { type: 'zip', zipPath: zipSource, zipSkillName: skillPath, level: targetLevel };
    _finalizeInstall(store, finalSkillId, targetLevel, meta, finalTargetDir, rawOpts);

    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
    }

    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return okMsg('synced');
  } catch (err) {
    try { if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
    return fail(failMessage, 'SKILL_INSTALL_FAILED');
  }
}


// ------------------------------------------------------------------ //
// 封装层
// ------------------------------------------------------------------ //

/**
 * 从本地 ZIP 文件路径安装 skill（带日志回调）
 * @param {SkillStore} store
 * @param {string} zipPath
 * @param {string} [skillName]
 * @param {string} [level]
 * @param {string} [proxyId]
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 * @param {Object} [_internal]          - 内部覆盖字段（update 场景）
 */
export async function installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog, _internal) {
  let proxyConfig;
  if (proxyId) {
    const proxyEntry = store.engine.findProxy(proxyId);
    if (proxyEntry) {
      proxyConfig = {
        type: proxyEntry.type,
        host: proxyEntry.host,
        port: proxyEntry.port,
        auth: proxyEntry.auth
          ? { username: proxyEntry.auth.username, password: proxyEntry.auth.password }
          : undefined,
      };
    }
  }

  emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_PROGRESS_EXTRACTING' });
  const result = await installFromZip(store, zipPath, skillName, level, proxyConfig, onProgress, _internal);
  if (result.success) {
    emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_PROGRESS_DONE' });
  } else {
    const failMessage = result.message || getServerMessage('SKILL_INSTALL_FAILED');
    emitSkillInstallLog(onLog, 'ERROR', { message: failMessage });
  }
  return result;
}

/**
 * 从 GitHub Tree URL 安装 skill
 * @param {SkillStore} store
 * @param {string} githubUrl
 * @param {string} [level]
 * @param {string} [proxyId]
 * @param {string} [tokenId]
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 * @param {Object} [_extraOpts]         - 内部覆盖字段（update 场景）
 */
export async function installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog, _extraOpts) {
  const { parseGithubTreeUrl } = await import('../download/utils.js');
  const parsed = parseGithubTreeUrl(githubUrl);
  if (!parsed) {
    return failMsg('SKILL_INVALID_REPO_URL');
  }

  const repoUrl = 'https://github.com/' + parsed.owner + '/' + parsed.repo;
  const skillPath = parsed.path;

  // 防止原始请求体中的空 repoUrl / skillPath 覆盖解析结果
  const safeExtra = _extraOpts || {};
  delete safeExtra.repoUrl;
  delete safeExtra.skillPath;

    return _installFromGitHubV2(store, {
      repoUrl, skillPath, level, proxyId, tokenId,
      branch: parsed.branch,
      ...safeExtra,
    }, onProgress, onLog);
}


// ------------------------------------------------------------------ //
// 统一入口
// ------------------------------------------------------------------ //

/**
 * 统一安装入口
 * @param {SkillStore} store
 * @param {Object} opts
 * @param {string} opts.type
 * @param {string} [opts.level]
 * @param {string} [opts._skillId]     - 内部覆盖 skillId（update 场景）
 * @param {string} [opts._targetDir]   - 内部覆盖 targetDir（update 场景）
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 */
export async function install(store, opts, onProgress, onLog) {
  const type = opts.type || opts.installMode || 'github';
  const level = opts.level;
  const proxyId = opts.proxyId || opts.selectedProxyId;
  const tokenId = opts.tokenId || opts.selectedTokenId;
  const proxyUrl = opts.proxyUrl;
  const proxyConfig = opts.proxyConfig;

  if (type === 'github') {
    return _installFromGitHubV2(store, opts, onProgress, onLog);
  }
  if (type === 'githubPath') {
    const githubUrl = opts.githubUrl || opts.githubTreeUrl;
    return installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog, opts);
  }
  if (type === 'zip') {
    const zipPath = opts.zipPath || opts.selectedFilePath;
    const skillName = opts.zipSkillName || opts.skillName;
    return installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog, {
      _skillId: opts._skillId,
      _targetDir: opts._targetDir,
      _rawOpts: opts,
    });
  }
  return failMsg('SKILL_INVALID_INSTALL_TYPE');
}


// ------------------------------------------------------------------ //
// 更新
// ------------------------------------------------------------------ //

/**
 * 更新已安装的 skill（安全原子替换：先装到临时目录，成功后再替换）
 * @param {SkillStore} store
 * @param {Object} opts
 * @param {string} opts.skillId      - 必填，要更新的 skill id
 * @param {string} [opts.level]
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 */
export async function update(store, opts, onProgress, onLog) {
  const skillId = opts.skillId;
  if (!skillId) {
    emitSkillInstallLog(onLog, 'ERROR', { key: 'SKILL_UPDATE_MISSING_ID' });
    return failMsg('SKILL_UPDATE_REQUIRES_ID');
  }

  // 查找现有 skill，不存在则记录错误日志
  const existing = store.findEntry(skillId);
  if (!existing) {
    emitSkillInstallLog(onLog, 'ERROR', { key: 'SKILL_UPDATE_NOT_FOUND', params: { skillId } });
    return failMsg('SKILL_NOT_FOUND');
  }

  const level = opts.level || existing.level || 'global';
  const baseTargetDir = level === 'project'
    ? join(process.cwd(), store.projectSkillsDir, skillId)
    : join(store.skillsDir, skillId);

  const tempSkillId = skillId + '-update-' + randomUUID();
  const tempTargetDir = baseTargetDir + '.tmp-' + randomUUID();

  // 调用 install 引擎安装到临时位置
  const tempOpts = {
    ...opts,
    _skillId: tempSkillId,
    _targetDir: tempTargetDir,
  };
  const result = await install(store, tempOpts, onProgress, onLog);

  if (!result.success) {
    // 临时安装失败，清理临时目录并记录错误日志
    try { rmSync(tempTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    emitSkillInstallLog(onLog, 'ERROR', { key: 'SKILL_UPDATE_TEMP_INSTALL_FAILED', params: { message: result.message || getServerMessage('SKILL_UPDATE_UNKNOWN_ERROR') } });
    return result;
  }

  // --- 安装成功，执行原子替换 ---
  // 临时副本安装成功，开始原子替换旧版本
  emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_UPDATE_REPLACING' });

  // 1. 删除旧目录
  try { rmSync(baseTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }

  // 2. 重命名临时目录为正式目录
  try {
    renameSync(tempTargetDir, baseTargetDir);
  } catch (err) {
    // 替换目录失败，清理临时目录并记录错误日志
    try { rmSync(tempTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    emitSkillInstallLog(onLog, 'ERROR', { key: 'SKILL_UPDATE_REPLACE_FAILED' });
    return fail('更新失败：无法替换目录', 'SKILL_UPDATE_FAILED');
  }

  // 3. 清理 store 中临时 entry
  store.mutate(tempSkillId, function (entries, idx) {
    if (idx >= 0) entries.splice(idx, 1);
  }, level);

  // 4. 更新原 skill entry：路径 / 更新时间 / 安装参数
  const params = Object.assign({}, opts);
  delete params._skillId;
  delete params._targetDir;
  delete params.skillId;
  store.mutate(skillId, function (entries, idx) {
    if (idx >= 0) {
      entries[idx].path = baseTargetDir;
      entries[idx].updated_at = Date.now();
      entries[idx].installParams = params;
    }
  }, level);

  // 原子替换完成，记录更新成功日志
  emitSkillInstallLog(onLog, 'INFO', { key: 'SKILL_UPDATE_SUCCESS', params: { skillId } });
  return okMsg('updated');
}
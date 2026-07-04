/**
 * Skill 安装模块
 * 提供 GitHub / ZIP / Registry / 本地目录 / Tree Path 等多种安装方式
 */

import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import AdmZip from 'adm-zip';
import { downloadSkillFromGitHub, downloadAndExtractZip } from '../download/index.js';
import { okMsg, failMsg, fail } from '../utils/result.js';
import { getServerMessage } from '../utils/i18n.js';
import { emitSkillInstallLog, _extractMeta, _parseGitHubUrl, _parseProxyUrl } from './shared.js';


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
 * @param {Function} [progressCb]
 * @param {Function} [logCb]
 */
export async function _installFromGitHubV2(store, opts, progressCb, logCb) {
  const targetLevel = opts.level || 'global';
  const onProgress = progressCb;
  const onLog = logCb;

  const parsed = _parseGitHubUrl(opts.repoUrl);
  if (!parsed) return failMsg('SKILL_INVALID_REPO_URL');

  const skillId = opts.skillPath ? basename(opts.skillPath) : parsed.repo;
  const targetDir = targetLevel === 'project'
    ? join(process.cwd(), store.projectSkillsDir, skillId)
    : join(store.skillsDir, skillId);

  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.id === skillId; })) {
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
      destDir: targetDir,
      proxy: opts.proxyConfig,
      token,
      onProgress,
      onLog,
    });

    if (onProgress) {
      onProgress({ stage: 'registering', percent: 90, message: getServerMessage('SKILL_PROGRESS_REGISTERING') });
    }

    const meta = _extractMeta(targetDir);
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
    }, targetLevel);

    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
    }

    return okMsg('synced');
  } catch (err) {
    try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
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
 */
export async function installFromZip(store, zipSource, skillPath, level, proxyConfig, onProgress) {
  const targetLevel = level || 'global';
  const skillId = skillPath ? basename(skillPath) : basename(zipSource).replace(/\.zip$/i, '') || 'skill';
  const targetDir = targetLevel === 'project'
    ? join(process.cwd(), store.projectSkillsDir, skillId)
    : join(store.skillsDir, skillId);

  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.id === skillId; })) {
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

    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });

    const meta = _extractMeta(sourceDir);
    store.copyDir(sourceDir, targetDir);

    store.addToConfig({
      id: skillId,
      name: meta.name,
      description: meta.description,
      path: targetDir,
      enabled: true,
      source: 'zip',
      version: 'latest',
      installed_at: Date.now(),
      updated_at: Date.now(),
    }, targetLevel);

    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('SKILL_PROGRESS_DONE') });
    }

    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return okMsg('synced');
  } catch (err) {
    try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message;
    return fail(failMessage, 'SKILL_INSTALL_FAILED');
  }
}


/**
 * 从本地 ZIP 文件路径安装 skill（带日志回调）
 * @param {SkillStore} store
 * @param {string} zipPath
 * @param {string} [skillName]
 * @param {string} [level]
 * @param {string} [proxyId]
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 */
export async function installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog) {
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
  const result = await installFromZip(store, zipPath, skillName, level, proxyConfig, onProgress);
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
 */
export async function installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog) {
  const { parseGithubTreeUrl } = await import('../download/utils.js');
  const parsed = parseGithubTreeUrl(githubUrl);
  if (!parsed) {
    return failMsg('SKILL_INVALID_REPO_URL');
  }

  const repoUrl = 'https://github.com/' + parsed.owner + '/' + parsed.repo;
  const skillPath = parsed.path;

  return _installFromGitHubV2(store, {
    repoUrl, skillPath, level, proxyId, tokenId,
  }, onProgress, onLog);
}

/**
 * 统一安装入口
 * @param {SkillStore} store
 * @param {Object} opts
 * @param {string} opts.type
 * @param {string} [opts.level]
 * @param {Function} [onProgress]
 * @param {Function} [onLog]
 */
export function install(store, opts, onProgress, onLog) {
  const type = opts.type || opts.installMode || 'github';
  const level = opts.level;
  const proxyId = opts.proxyId || opts.selectedProxyId;
  const tokenId = opts.tokenId || opts.selectedTokenId;
  const proxyUrl = opts.proxyUrl;
  const proxyConfig = opts.proxyConfig;

  if (type === 'github') {
    return _installFromGitHubV2(store, {
      repoUrl: opts.repoUrl,
      skillPath: opts.skillPath,
      level,
      proxyId,
      tokenId,
      proxyUrl,
      proxyConfig,
    }, onProgress, onLog);
  }
  if (type === 'githubPath') {
    const githubUrl = opts.githubUrl || opts.githubTreeUrl;
    return installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog);
  }
  if (type === 'zip') {
    const zipPath = opts.zipPath || opts.selectedFilePath;
    const skillName = opts.zipSkillName || opts.skillName;
    return installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog);
  }
  return failMsg('SKILL_INVALID_INSTALL_TYPE');
}
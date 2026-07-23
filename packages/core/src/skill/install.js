/**
 * Skill 安装模块
 * 提供 GitHub / ZIP / Registry / 本地目录 / Tree Path 等多种安装方式
 */

import { existsSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import AdmZip from 'adm-zip';
import { downloadSkillFromGitHub, downloadAndExtractZip, writeSkillLog } from '../download/index.js';
import { okMsg, failMsg, fail } from '../utils/result.js';
import { getServerMessage } from '../utils/i18n.js';
import { emitSkillInstallLog, _extractMeta, _parseGitHubUrl, _parseProxyUrl } from './shared.js';


// ------------------------------------------------------------------ //
// 内部辅助
// ------------------------------------------------------------------ //

/**
 * 统一收尾：写入 store entry + 记录安装参数（供前端回填）
 * 不管是哪种安装方式，最终都要走到这里完成注册
 * @param {SkillStore} store - 数据存储层
 * @param {string} skillId - skill 标识（slug 或 UUID）
 * @param {string} level - 'global' 或 'project'
 * @param {{name:string, description:string}} meta - 从 SKILL.md 提取的元数据
 * @param {string} targetDir - skill 实际安装到的目录路径
 * @param {Object} rawOpts - 原始安装参数，用于记录 installParams 供前端回填
 * @param {string} [projectId] - 项目 ID
 */
function _finalizeInstall(store, skillId, level, meta, targetDir, rawOpts, projectId) {
  // update 场景使用临时 skillId，保持 ID 不变；新安装生成随机 UUID 保证唯一性
  const isTempUpdate = rawOpts && rawOpts._skillId;
  const finalId = isTempUpdate ? skillId : randomUUID();
  
  // 构造 skill 条目并写入 store 配置
  store.addToConfig({
    id: finalId,
    slug: skillId,
    name: meta.name || skillId,
    description: meta.description,
    path: targetDir,
    enabled: true,
    source: 'community',
    version: 'latest',
    installed_at: Date.now(),
    updated_at: Date.now(),
  }, level, projectId);

  // 将原始安装参数浅拷贝后存入 installParams，供前端回填表单使用
  // 去掉内部字段 _skillId 和 _targetDir，避免前端误用
  if (rawOpts) {
    const params = Object.assign({}, rawOpts);
    delete params._skillId;
    delete params._targetDir;
    store.mutate(finalId, function (entries, idx) {
      if (idx >= 0) entries[idx].installParams = params;
    }, level, projectId);
  }
}


// ------------------------------------------------------------------ //
// 路径与 projectId 解析
// ------------------------------------------------------------------ //

/**
 * 根据安装级别返回基础目录
 * project 级返回 projectPath，global 级返回空字符串（表示使用默认全局目录）
 * @param {string} level - 'global' 或 'project'
 * @param {string} projectPath - 项目路径
 * @returns {string} 基础目录路径
 */
function _getProjectBaseDir(level, projectPath) {
  return level === 'project' ? projectPath : '';
}

/**
 * 解析 projectId
 * 优先使用传入的 projectId，否则根据 projectPath 查找
 * @param {string} level - 'global' 或 'project'
 * @param {string} projectId - 项目 ID
 * @param {string} projectPath - 项目路径
 * @param {SkillStore} store - 数据存储层
 * @returns {string|null} 项目 ID，非 project 级返回 null
 */
function _resolveProjectId(level, projectId, projectPath, store) {
  if (level !== 'project') return null;
  return projectId || store.getProjectIdByPath(projectPath);
}


// ------------------------------------------------------------------ //
// 底层安装函数
// ------------------------------------------------------------------ //

/**
 * 从 GitHub 仓库安装 skill（V2 内部实现）
 * 这是 GitHub 安装的核心逻辑，被多个上层函数复用
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 安装选项
 * @param {string} opts.repoUrl - GitHub 仓库 URL
 * @param {string} [opts.skillPath] - skill 在仓库中的子目录路径
 * @param {string} [opts.level='global'] - 安装级别
 * @param {Object} [opts.proxyConfig] - 代理配置
 * @param {string} [opts.proxyUrl] - 代理 URL（字符串形式）
 * @param {string} [opts.proxyId] - 代理 ID（从 store 中查找）
 * @param {string} [opts.tokenId] - Token ID，用于 GitHub 认证
 * @param {string} [opts._skillId] - 内部覆盖 skillId（update 场景）
 * @param {string} [opts._targetDir] - 内部覆盖目标目录（update 场景）
 * @param {Function} [progressCb] - 进度回调函数
 * @param {Function} [logCb] - 日志回调函数
 */
export async function _installFromGitHubV2(store, opts, progressCb, logCb) {
  // 规范化安装级别，默认 global
  const targetLevel = opts.level || 'global';
  const onProgress = progressCb;
  const onLog = logCb;

  // 解析 GitHub URL，提取 owner 和 repo
  const parsed = _parseGitHubUrl(opts.repoUrl);
  if (!parsed) return failMsg('skillInvalidRepoUrl');

  // 确定 skillId：优先使用内部覆盖（update 场景），否则使用 skillPath 的 basename 或 repo 名
  const finalSkillId = opts._skillId || (opts.skillPath ? basename(opts.skillPath) : parsed.repo);
  // 确定最终安装目录：优先使用内部覆盖（update 场景）
  const finalTargetDir = opts._targetDir || (targetLevel === 'project'
    ? join(_getProjectBaseDir(targetLevel, opts.projectPath), store.projectSkillsDir, finalSkillId)
    : join(_getProjectBaseDir(targetLevel, opts.projectPath), store.skillsDir, finalSkillId));

  // 解析 projectId
  const projectId = _resolveProjectId(targetLevel, opts.projectId, opts.projectPath, store);

  // 检查是否已安装同名 skill
  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.slug === finalSkillId; })) {
    return failMsg('skillAlreadyInstalled');
  }

  try {
    // 通知前端开始连接 GitHub
    if (onProgress) {
      onProgress({ stage: 'connecting', percent: 5, message: getServerMessage('skillProgressConnectingGithub') });
    }

    // 解析代理配置：优先使用传入的 proxyConfig，其次解析 proxyUrl 字符串，最后通过 proxyId 查找
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

    // 解析 Token：通过 tokenId 查找存储的 GitHub Token
    let token;
    if (opts.tokenId) {
      const tokenEntry = store.engine.findToken(opts.tokenId);
      if (tokenEntry) token = tokenEntry.token;
    }

    // 调用下载引擎从 GitHub 拉取 skill 到目标目录
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

    // 通知前端正在注册
    if (onProgress) {
      onProgress({ stage: 'registering', percent: 90, message: getServerMessage('skillProgressRegistering') });
    }

    // 从安装目录提取 SKILL.md 元数据
    const meta = _extractMeta(finalTargetDir);
    // 写入 store 配置，完成安装
    _finalizeInstall(store, finalSkillId, targetLevel, meta, finalTargetDir, opts, projectId);

    // 通知前端安装完成
    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('skillProgressDone') });
    }

    return okMsg('synced');
  } catch (err) {
    // 安装失败，清理已创建的目录
    try { if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('skillInstallFailed') + ': ' + err.message;
    writeSkillLog('ERROR', 'skillInstallFailed', { message: failMessage }, { error: err.stack });
    return fail(failMessage, 'skillInstallFailed');
  }
}

/**
 * 从 ZIP 源安装 skill（URL 或本地文件）
 * 支持从远程 URL 下载 ZIP 或直接使用本地 ZIP 文件
 * @param {SkillStore} store - 数据存储层
 * @param {string} zipSource - ZIP 源，可以是 URL 或本地文件路径
 * @param {string} [skillPath] - skill 在 ZIP 内的子目录路径
 * @param {string} [level='global'] - 安装级别
 * @param {Object|string} [proxyConfig] - 代理配置
 * @param {Function} [onProgress] - 进度回调
 * @param {Object} [_internal] - 内部覆盖字段（update 场景）
 * @param {string} [_internal._skillId]
 * @param {string} [_internal._targetDir]
 * @param {Object} [_internal._rawOpts]
 */
export async function installFromZip(store, zipSource, skillPath, level, proxyConfig, onProgress, _internal) {
  const targetLevel = level || 'global';

  // 确定 skillId：优先使用内部覆盖，其次使用 skillPath 或 ZIP 文件名
  const finalSkillId = (_internal && _internal._skillId) ||
    (skillPath ? basename(skillPath) : basename(zipSource).replace(/\.zip$/i, '') || 'skill');

  const projectPath = (_internal && _internal._rawOpts && _internal._rawOpts.projectPath) || '';

  // 确定最终安装目录
  const finalTargetDir = (_internal && _internal._targetDir) ||
    (targetLevel === 'project'
      ? join(_getProjectBaseDir(targetLevel, projectPath), store.projectSkillsDir, finalSkillId)
      : join(_getProjectBaseDir(targetLevel, projectPath), store.skillsDir, finalSkillId));

  // 解析 projectId
  const projectId = _resolveProjectId(targetLevel,
    (_internal && _internal._rawOpts && _internal._rawOpts.projectId),
    projectPath,
    store
  );

  // 检查是否已安装
  const installed = store.getLevelInstalled(targetLevel);
  if (installed.some(function (s) { return s.slug === finalSkillId; })) {
    return failMsg('skillAlreadyInstalled');
  }

  try {
    // 创建临时解压目录
    const tempDir = join(tmpdir(), 'skill-extract-' + randomUUID());
    let extractRoot;

    // 判断 ZIP 源类型：远程 URL 或本地文件
    if (/^https?:\/\//i.test(zipSource)) {
      // 远程 ZIP：先下载再解压
      let finalProxyConfig;
      if (typeof proxyConfig === 'string') {
        finalProxyConfig = _parseProxyUrl(proxyConfig);
      } else if (proxyConfig) {
        finalProxyConfig = proxyConfig;
      }
      extractRoot = await downloadAndExtractZip(zipSource, tempDir, finalProxyConfig, onProgress);
    } else {
      // 本地 ZIP：直接解压
      const zip = new AdmZip(zipSource);
      zip.extractAllTo(tempDir, true);
      extractRoot = tempDir;
    }

    // 定位 skill 目录
    let sourceDir;
    if (skillPath) {
      // 指定了子目录路径，尝试在解压结果中查找
      sourceDir = store.findSkillDir(extractRoot, skillPath);
      if (!sourceDir) {
        // 如果找不到指定路径，检查解压根目录是否直接包含 SKILL.md
        if (existsSync(join(extractRoot, 'SKILL.md'))) {
          sourceDir = extractRoot;
        } else {
          // 既没有指定路径，根目录也没有 SKILL.md，说明不是有效的 skill 包
          try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
          return failMsg('skillNotFound');
        }
      }
    } else {
      // 未指定子目录，直接使用解压根目录
      sourceDir = extractRoot;
      if (!existsSync(join(sourceDir, 'SKILL.md'))) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }
        return failMsg('skillNotFound');
      }
    }

    // 如果目标目录已存在，先删除
    if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true });

    // 从临时目录复制 skill 到最终目标目录
    const meta = _extractMeta(sourceDir);
    store.copyDir(sourceDir, finalTargetDir);

    // 准备原始参数用于记录
    const rawOpts = (_internal && _internal._rawOpts) || { type: 'zip', zipPath: zipSource, zipSkillName: skillPath, level: targetLevel };
    // 写入 store 配置，完成安装
    _finalizeInstall(store, finalSkillId, targetLevel, meta, finalTargetDir, rawOpts, projectId);

    // 通知前端安装完成
    if (onProgress) {
      onProgress({ stage: 'done', percent: 100, message: getServerMessage('skillProgressDone') });
    }

    // 清理临时解压目录
    try { rmSync(tempDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return okMsg('synced');
  } catch (err) {
    // 安装失败，清理目标目录
    try { if (existsSync(finalTargetDir)) rmSync(finalTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('skillInstallFailed') + ': ' + err.message;
    writeSkillLog('ERROR', 'skillInstallFailed', { message: failMessage }, { error: err.stack });
    return fail(failMessage, 'skillInstallFailed');
  }
}


// ------------------------------------------------------------------ //
// 封装层
// ------------------------------------------------------------------ //

/**
 * 从本地 ZIP 文件路径安装 skill（带日志回调）
 * 是 installFromZip 的封装，增加了日志记录和代理配置解析
 * @param {SkillStore} store - 数据存储层
 * @param {string} zipPath - 本地 ZIP 文件路径
 * @param {string} [skillName] - skill 名称
 * @param {string} [level] - 安装级别
 * @param {string} [proxyId] - 代理 ID
 * @param {Function} [onProgress] - 进度回调
 * @param {Function} [onLog] - 日志回调
 * @param {Object} [_internal] - 内部覆盖字段（update 场景）
 */
export async function installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog, _internal) {
  let proxyConfig;
  if (proxyId) {
    // 通过 proxyId 查找代理配置
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

  // 记录开始解压的日志
  emitSkillInstallLog(onLog, 'INFO', { key: 'skillProgressExtracting' });
  // 调用底层 ZIP 安装函数
  const result = await installFromZip(store, zipPath, skillName, level, proxyConfig, onProgress, _internal);
  // 根据结果记录成功或失败日志
  if (result.success) {
    emitSkillInstallLog(onLog, 'INFO', { key: 'skillProgressDone' });
  } else {
    const failMessage = result.message || getServerMessage('skillInstallFailed');
    emitSkillInstallLog(onLog, 'ERROR', { message: failMessage });
  }
  return result;
}

/**
 * 从 GitHub Tree URL 安装 skill
 * 适用于安装仓库中特定目录下的 skill，而不是整个仓库
 * @param {SkillStore} store - 数据存储层
 * @param {string} githubUrl - GitHub Tree URL
 * @param {string} [level] - 安装级别
 * @param {string} [proxyId] - 代理 ID
 * @param {string} [tokenId] - Token ID
 * @param {Function} [onProgress] - 进度回调
 * @param {Function} [onLog] - 日志回调
 * @param {Object} [_extraOpts] - 内部覆盖字段（update 场景）
 */
export async function installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog, _extraOpts) {
  // 动态导入 URL 解析工具，避免循环依赖
  const { parseGithubTreeUrl } = await import('../download/utils.js');
  const parsed = parseGithubTreeUrl(githubUrl);
  if (!parsed) {
    return failMsg('skillInvalidRepoUrl');
  }

  // 构造标准 GitHub 仓库 URL
  const repoUrl = 'https://github.com/' + parsed.owner + '/' + parsed.repo;
  const skillPath = parsed.path;

  // 防止原始请求体中的空 repoUrl / skillPath 覆盖解析结果
  const safeExtra = _extraOpts || {};
  delete safeExtra.repoUrl;
  delete safeExtra.skillPath;

  // 委托给 GitHub V2 安装函数
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
 * 根据安装类型分发到不同的安装实现
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 安装选项
 * @param {string} opts.type - 安装类型：'github' / 'githubPath' / 'zip'
 * @param {string} [opts.level] - 安装级别
 * @param {string} [opts._skillId] - 内部覆盖 skillId（update 场景）
 * @param {string} [opts._targetDir] - 内部覆盖目标目录（update 场景）
 * @param {Function} [onProgress] - 进度回调
 * @param {Function} [onLog] - 日志回调
 */
export async function install(store, opts, onProgress, onLog) {
  const type = opts.type || opts.installMode || 'github';
  const level = opts.level;
  const proxyId = opts.proxyId || opts.selectedProxyId;
  const tokenId = opts.tokenId || opts.selectedTokenId;

  if (type === 'github') {
    // GitHub 仓库安装
    return _installFromGitHubV2(store, opts, onProgress, onLog);
  }
  if (type === 'githubPath') {
    // GitHub Tree Path 安装（仓库子目录）
    const githubUrl = opts.githubUrl || opts.githubTreeUrl;
    return installFromGithubTreePath(store, githubUrl, level, proxyId, tokenId, onProgress, onLog, opts);
  }
  if (type === 'zip') {
    // ZIP 文件安装
    const zipPath = opts.zipPath || opts.selectedFilePath;
    const skillName = opts.zipSkillName || opts.skillName;
    return installFromZipStream(store, zipPath, skillName, level, proxyId, onProgress, onLog, {
      _skillId: opts._skillId,
      _targetDir: opts._targetDir,
      _rawOpts: opts,
    });
  }
  return failMsg('skillInvalidInstallType');
}


// ------------------------------------------------------------------ //
// 更新
// ------------------------------------------------------------------ //

/**
 * 更新已安装的 skill（安全原子替换：先装到临时目录，成功后再替换）
 * 更新流程：
 * 1. 查找现有 skill
 * 2. 安装到临时目录
 * 3. 删除旧目录
 * 4. 重命名临时目录为正式目录
 * 5. 清理 store 中的临时 entry
 * 6. 更新原 skill entry 的路径和参数
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 更新选项
 * @param {string} opts.skillId - 必填，要更新的 skill id
 * @param {string} [opts.level] - 更新级别
 * @param {Function} [onProgress] - 进度回调
 * @param {Function} [onLog] - 日志回调
 */
export async function update(store, opts, onProgress, onLog) {
  const skillId = opts.skillId;
  if (!skillId) {
    emitSkillInstallLog(onLog, 'ERROR', { key: 'skillUpdateMissingId' });
    return failMsg('skillUpdateRequiresId');
  }

  // 查找现有 skill，不存在则记录错误日志
  const existing = store.findEntry(skillId);
  if (!existing) {
    emitSkillInstallLog(onLog, 'ERROR', { key: 'skillUpdateNotFound', params: { skillId } });
    return failMsg('skillNotFound');
  }

  const level = opts.level || existing.level || 'global';
  const baseTargetDir = (level === 'project'
    ? join(_getProjectBaseDir(level, opts.projectPath), store.projectSkillsDir, existing.slug)
    : join(_getProjectBaseDir(level, opts.projectPath), store.skillsDir, existing.slug));

  const projectId = _resolveProjectId(level, opts.projectId, opts.projectPath, store);

  // 创建临时 skillId 和临时目录，用于安全安装新版本
  const tempSkillId = existing.slug + '-update-' + randomUUID();
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
    emitSkillInstallLog(onLog, 'ERROR', { key: 'skillUpdateTempInstallFailed', params: { message: result.message || getServerMessage('skillUpdateUnknownError') } });
    return result;
  }

  // --- 安装成功，执行原子替换 ---
  // 临时副本安装成功，开始原子替换旧版本
  emitSkillInstallLog(onLog, 'INFO', { key: 'skillUpdateReplacing' });

  // 1. 删除旧目录
  try { rmSync(baseTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }

  // 2. 重命名临时目录为正式目录
  try {
    renameSync(tempTargetDir, baseTargetDir);
  } catch {
    // 替换目录失败，清理临时目录并记录错误日志
    try { rmSync(tempTargetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    emitSkillInstallLog(onLog, 'ERROR', { key: 'skillUpdateReplaceFailed' });
    return fail('更新失败：无法替换目录', 'skillUpdateFailed');
  }

  // 3. 清理 store 中临时 entry（刚才是用 tempSkillId 安装的）
  store.mutate(tempSkillId, function (entries, idx) {
    if (idx >= 0) entries.splice(idx, 1);
  }, level, projectId);

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
  }, level, projectId);

  // 原子替换完成，记录更新成功日志
  emitSkillInstallLog(onLog, 'INFO', { key: 'skillUpdateSuccess', params: { skillId } });
  return okMsg('updated');
}

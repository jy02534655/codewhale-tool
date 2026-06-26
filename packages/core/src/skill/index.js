/**
 * SkillManager — 双层 Skill 管理（全局 + 项目）
 *
 * Skill 存储架构：
 *   全局层 → store.json → skills.installed[] （由 ConfigEngine 管理）
 *   项目层 → .codewhale/skills.json → installed[]（由 ProjectSkillEngine 管理）
 *
 * Skill 文件位置：
 *   全局 → ~/.codewhale/skills/<skill-id>/SKILL.md
 *   项目 → <project>/.codewhale/skills/<skill-id>/SKILL.md
 *
 * 安装模式：
 *   - community：从 deepseek-ai/codewhale-skills 社区仓库安装（git clone --sparse）
 *   - github：从任意 GitHub 仓库安装（codeload zipball → adm-zip 解压）
 *   - zip：从 URL 或本地 ZIP 文件安装
 *   - registry：从 skills.sh 注册表标识符安装（解析后委托 github 模式）
 *
 * 核心能力：
 *   - 双层注册表（全局独立 + 项目独立）
 *   - discover() 自动扫描磁盘发现未注册 skill
 *   - 自动从 SKILL.md 提取 name/description
 *   - remark（用户备注） + tags（标签）独立管理
 *   - 社区 skill 列表缓存（24h 自动刷新）
 *
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * @module skill
 */

import { existsSync, rmSync, readFileSync, readdirSync, writeFileSync, createWriteStream, mkdirSync, cpSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { PassThrough, Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import zlib from 'node:zlib';
import { getServerMessage, failMsg } from '../i18n.js';
import { ok, fail } from '../result.js';
import AdmZip from 'adm-zip';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { extract as tarExtract } from 'tar';
import { downloadSkillFromGitHub } from './download.js';

/** CodeWhale skill 社区仓库的基础 URL */
const SKILL_REPO_BASE = 'https://github.com/deepseek-ai/codewhale-skills';

/** 社区缓存有效期（24 小时，毫秒） */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * 从 SKILL.md 内容中提取名称和描述
 * @param {string} content
 * @returns {{name: string, description: string}}
 * @private
 */
function _parseReadmeMeta(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = '';
  let description = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 首行 # 标题作为 name
    if (!name && line.startsWith('# ')) {
      name = line.slice(2).trim();
      continue;
    }
    // 第一个非标题、非空行作为 description
    if (name && !description && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('---')) {
      description = line;
      break;
    }
  }

  // 如果没有 # 标题，用首行做 name
  if (!name) name = lines[0] || '';
  return { name, description };
}

/**
 * 从磁盘读取 SKILL.md 并提取元数据
 * @param {string} skillPath - skill 目录路径
 * @returns {{name: string, description: string}}
 * @private
 */
function _extractMeta(skillPath) {
  const readmePath = join(skillPath, 'SKILL.md');
  if (!existsSync(readmePath)) return { name: basename(skillPath), description: '' };
  try {
    const content = readFileSync(readmePath, 'utf-8');
    return _parseReadmeMeta(content);
  } catch {
    return { name: basename(skillPath), description: '' };
  }
}

/**
 * 解析 GitHub URL 中的 owner 和 repo
 * @param {string} repoUrl - 如 https://github.com/vercel-labs/skills 或 https://github.com/vercel-labs/skills.git
 * @returns {{owner: string, repo: string}|null}
 * @private
 */
function _parseGitHubUrl(repoUrl) {
  const cleaned = repoUrl.replace(/\.git\/?$/, '').replace(/\/$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

/**
 * 安全调用 onLog（用于安装后注册阶段的日志记录）
 * 生成 download-skill.log 兼容格式：[YYYY-MM-DD HH:MM:SS.SSS] [LEVEL] message
 * @param {Function|null} onLog - 日志回调
 * @param {string} level - INFO/WARN/ERROR/DEBUG
 * @param {string} message - 日志内容
 */
function _sseLogSafe(onLog, level, message) {
  if (!onLog) return;
  try {
    var d = new Date();
    var ts = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0') + '.' +
      String(d.getMilliseconds()).padStart(3, '0');
    var line = '[' + ts + '] [' + level + '] ' + message;
    onLog({ level: level, message: line });
  } catch { /* 日志失败不阻塞安装 */ }
}

export class SkillManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine         - 全局配置引擎
   * @param {import('./project.js').ProjectSkillEngine} [projectEngine] - 项目 skill 引擎（可选）
   * @param {string}                            [skillsDir]    - 全局 skill 存储目录
   */
  constructor(engine, projectEngine, skillsDir) {
    /** @type {import('./config.js').ConfigEngine} */
    this._engine = engine;
    /** @type {import('./project.js').ProjectSkillEngine|null} */
    this._projectEngine = projectEngine || null;
    /** @type {string} 全局 skill 文件存储根目录 */
    this._skillsDir = skillsDir || join(homedir(), '.codewhale', 'skills');
    /** @type {string} 项目 skill 文件存储目录（相对于项目根） */
    this._projectSkillsDir = '.codewhale/skills';
  }

  // ─── 列表查询 ───────────────────────────────────────────────

  /**
   * 列出所有 skill（全局 + 项目合并，带 level 标记）
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listAll() {
    const global = this._getGlobalInstalled().map((s) => ({ ...s, level: 'global' }));
    const project = this._getProjectInstalled().map((s) => ({ ...s, level: 'project' }));
    return ok([...global, ...project]);
  }

  /**
   * 列出全局 skill
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listGlobal() {
    return ok(this._getGlobalInstalled());
  }

  /**
   * 列出项目 skill
   * @returns {{success: boolean, data: import('./types.js').SkillEntry[]}}
   */
  listProject() {
    return ok(this._getProjectInstalled());
  }

  // ─── 单 Skill 操作 ──────────────────────────────────────────

  /**
   * 获取单个 skill 的详细信息（包含 SKILL.md 内容）
   * @param {string} skillId
   * @param {'global'|'project'} [level] - 指定层级，不指定则自动查找
   * @returns {{success: boolean, data?: {entry: object|null, readme: string, level: string|null}, message?: string, errorCode?: string}}
   */
  show(skillId, level) {
    let entry = null;
    let resolvedLevel = null;

    if (level === 'global') {
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'global';
    } else if (level === 'project') {
      entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = 'project';
    } else {
      // 自动查找：全局优先
      entry = this._getGlobalInstalled().find((s) => s.id === skillId) || null;
      resolvedLevel = entry ? 'global' : null;
      if (!entry) {
        entry = this._getProjectInstalled().find((s) => s.id === skillId) || null;
        resolvedLevel = entry ? 'project' : null;
      }
    }

    let readme = '';
    if (entry && entry.path) {
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        if (existsSync(readmePath)) {
          readme = readFileSync(readmePath, 'utf-8');
        }
      } catch {
        readme = '(无法读取 SKILL.md)';
      }
    }

    if (!entry) return fail('Not found', 'SKILL_NOT_FOUND');
    return ok({ entry, readme, level: resolvedLevel });
  }

  /**
   * 更新用户备注
   * @param {string} skillId
   * @param {string} remark
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateRemark(skillId, remark) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].remark = remark;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage('updated'));
    });
  }

  /**
   * 更新标签
   * @param {string} skillId
   * @param {string[]} tags
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateTags(skillId, tags) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].tags = tags;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage('updated'));
    });
  }

  /**
   * 更新别名
   * @param {string} skillId
   * @param {string} alias
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias(skillId, alias, level) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].alias = alias;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage('updated'));
    }, level);
  }

  /**
   * 合并更新 skill 元数据（alias + remark + tags）
   * @param {string} skillId
   * @param {{ alias?: string, remark?: string, tags?: string[] }} data
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateMeta(skillId, data, level) {
    return this._mutate(skillId, (entries, idx) => {
      if (data.alias !== undefined) entries[idx].alias = data.alias;
      if (data.remark !== undefined) entries[idx].remark = data.remark;
      if (data.tags !== undefined) entries[idx].tags = data.tags;
      entries[idx].updated_at = Date.now();
      return ok(entries[idx], getServerMessage('updated'));
    }, level);
  }

  // ─── 启用 / 禁用 ────────────────────────────────────────────

  /** @param {string} skillId */
  enable(skillId) {
    return this._toggle(skillId, true);
  }

  /** @param {string} skillId */
  disable(skillId) {
    return this._toggle(skillId, false);
  }

  // ─── ZIP 下载解压（共用底层） ──────────────────────────────

  /**
   * 下载并解压 ZIP 文件到目标目录
   * @param {string} zipUrl     - ZIP 文件的下载 URL
   * @param {string} targetDir  - 解压目标目录
   * @param {string} [proxyUrl]  - 代理地址（可选，如 socks5://127.0.0.1:1080 或 http://127.0.0.1:10808）
   * @returns {Promise<string>} - 解压后的实际根目录（处理 GitHub zipball 包装）
   * @private
   */
  async _downloadAndExtractZip(zipUrl, targetDir, proxyUrl, onProgress) {
    const tmpFile = join(tmpdir(), `skill-${randomUUID()}.zip`);

    // 1. 下载 ZIP（有代理走 SOCKS5/HTTP 代理，无代理走原生 fetch）
    try {
      if (onProgress) {
        onProgress({ stage: 'connecting', percent: 5, message: '连接 GitHub...' });
      }
      if (proxyUrl) {
        await this._downloadZipWithProxy(zipUrl, tmpFile, proxyUrl, onProgress);
      } else {
        const response = await fetch(zipUrl, {
          redirect: 'follow',
          signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) {
          throw new Error(`ZIP 下载失败: HTTP ${response.status}`);
        }
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        // 将响应流写入临时文件
        const fileStream = createWriteStream(tmpFile);
        const reader = response.body.getReader();
        let totalBytes = 0;
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
                    onProgress({ stage: 'downloading', percent: Math.min(pct, 99), message: `下载中 ${pct}%` });
                  }
                  pump();
                }
              });
            }).catch(reject);
          }
          pump();
        });
      }

      if (onProgress) {
        onProgress({ stage: 'extracting', percent: 60, message: '解压中...' });
      }

      // 2. 解压
      const zip = new AdmZip(tmpFile);
      zip.extractAllTo(targetDir, /* overwrite */ true);

      // 3. 处理 GitHub zipball 包装目录
      const entries = readdirSync(targetDir, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory());
      // 如果解压后只有一个目录 → 那是 GitHub 的包装目录，回退一层
      return dirs.length === 1 && entries.length === 1
        ? join(targetDir, dirs[0].name)
        : targetDir;
    } finally {
      // 清理临时文件
      try { rmSync(tmpFile); } catch { /* ignore */ }
    }
  }

  /**
   * 递归复制目录
   * @param {string} src  - 源目录
   * @param {string} dest - 目标目录
   * @private
   */
  _copyDir(src, dest) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    cpSync(src, dest, { recursive: true, force: true });
  }

  /**
   * 通过代理下载文件（自动识别 SOCKS5/HTTP 协议）
   * @param {string} url      - 下载 URL
   * @param {string} destPath - 目标文件路径
   * @param {string} proxyUrl - 代理地址，如 socks5://127.0.0.1:1080 或 http://127.0.0.1:10808
   * @returns {Promise<void>}
   * @private
   */
  async _downloadZipWithProxy(url, destPath, proxyUrl, onProgress) {
    const { createWriteStream } = await import('node:fs');
    
    const { get } = await import('node:https');

    // 根据代理协议自动选择 agent
    let agent;
    if (proxyUrl.startsWith('http://') || proxyUrl.startsWith('https://')) {
      agent = new HttpsProxyAgent(proxyUrl);
    } else if (proxyUrl.startsWith('socks')) {
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      throw new Error(`不支持代理协议: ${proxyUrl}`);
    }

    const fileStream = createWriteStream(destPath);

    // 递归处理重定向（codeload.github.com → CDN）
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
          reject(new Error(`代理下载失败: HTTP ${res.statusCode}`));
          return;
        }
        const contentLength = parseInt(res.headers['content-length'] || '0', 10);
        let totalBytes = 0;

        res.on('data', (chunk) => {
          totalBytes += chunk.length;
          fileStream.write(chunk);
          if (onProgress && contentLength > 0) {
            const pct = Math.round((totalBytes / contentLength) * 100);
            onProgress({ stage: 'downloading', percent: Math.min(pct, 99), message: `下载中 ${pct}%` });
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

  /**
   * 使用 git sparse checkout（partial clone）下载单个 skill 子目录
   *
   * 比 ZIP 全量下载快得多（只下载目标子目录，而非整个仓库）。
   * git 原生支持 http.proxy/https.proxy，兼容 SOCKS5/HTTP 代理。
   *
   * @param {string} repoUrl    - GitHub 仓库 URL
   * @param {string} [skillPath] - 子目录路径（可选，无则克隆整个仓库根目录）
   * @param {string} targetDir  - 目标目录
   * @param {string} [proxyUrl]  - 代理地址（可选）
   * @param {Function} [onProgress] - 进度回调
   * @returns {Promise<void>}
   * @private
   */
  async _cloneWithGitSparse(repoUrl, skillPath, targetDir, proxyUrl, onProgress) {
    const { execSync } = await import('node:child_process');
    const tmpDir = join(tmpdir(), `skill-git-${randomUUID()}`);
    mkdirSync(tmpDir, { recursive: true });

    try {
      onProgress?.({ stage: 'cloning', percent: 10, message: 'git sparse clone...' });

      // 构建 git clone 参数
      // --depth 1: 浅克隆，只取最新 commit
      // --filter=blob:none: partial clone，不下载文件 blob
      // --sparse: 开启稀疏检出
      // --no-checkout: 暂不检出，后续 sparse-checkout 后统一 checkout
      const proxyArgs = proxyUrl
        ? `-c http.proxy=${proxyUrl} -c https.proxy=${proxyUrl}`
        : '';
      const cloneArgs = [
        'clone',
        '--depth', '1',
        '--filter=blob:none',
        '--sparse',
        '--no-checkout',
        repoUrl,
        tmpDir,
      ];
      const cloneCmd = [
        ...(proxyArgs ? ['git', proxyArgs, ...cloneArgs] : ['git', ...cloneArgs]),
      ].join(' ');

      execSync(cloneCmd, { stdio: 'pipe', timeout: 120000 });

      // 设置稀疏检出路径
      if (skillPath) {
        onProgress?.({ stage: 'checkout', percent: 40, message: `sparse-checkout: ${skillPath}...` });
        const sparseArgs = [
          ...(proxyArgs ? ['git', proxyArgs, '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]
            : ['git', '-C', `"${tmpDir}"`, 'sparse-checkout', 'set', `"${skillPath}"`]),
        ].join(' ');
        execSync(sparseArgs, { stdio: 'pipe', timeout: 60000 });
      }

      onProgress?.({ stage: 'checking-out', percent: 60, message: 'checkout files...' });
      execSync(`git -C "${tmpDir}" checkout`, { stdio: 'pipe', timeout: 60000 });

      // 定位 skill 目录并复制到目标
      const skillDir = skillPath
        ? join(tmpDir, ...skillPath.split('/'))
        : tmpDir;

      if (!existsSync(join(skillDir, 'SKILL.md'))) {
        throw new Error('SKILL.md not found after sparse checkout');
      }

      onProgress?.({ stage: 'copying', percent: 80, message: '复制到目标目录...' });
      this._copyDir(skillDir, targetDir);

      onProgress?.({ stage: 'cloned', percent: 85, message: 'clone 完成' });
    } finally {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }

  /**
   * 代理下载回退方案：ZIP 下载（archive/codeload 直链）
   * 当 git sparse checkout 失败时使用。通过代理下载整个仓库 ZIP 后解压搜索子目录。
   * @param {string} owner      - GitHub 仓库 owner
   * @param {string} repo       - GitHub 仓库 repo
   * @param {string} [skillPath] - 子目录路径
   * @param {string} targetDir  - 目标安装目录
   * @param {string} [proxyUrl]  - 代理地址
   * @param {Function} [onProgress]
   * @returns {Promise<boolean>}
   * @private
   */
  async _proxyDownloadFallback(owner, repo, skillPath, targetDir, proxyUrl, onProgress) {
    const tempDir = join(tmpdir(), `skill-extract-${randomUUID()}`);
    const branches = ['main', 'master'];
    const zipUrlFormats = [
      (branch) => `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`,
      (branch) => `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`,
    ];
    let extractRoot = null;
    let lastError = null;
    for (const branch of branches) {
      for (const fmt of zipUrlFormats) {
        try {
          extractRoot = await this._downloadAndExtractZip(fmt(branch), tempDir, proxyUrl, onProgress);
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (extractRoot) break;
      try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
    if (!extractRoot) throw lastError || new Error('ZIP download failed');

    let skillDir;
    if (skillPath) {
      skillDir = this._findSkillDir(extractRoot, skillPath);
      if (!skillDir) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
        return false;
      }
    } else {
      skillDir = extractRoot;
      if (!existsSync(join(skillDir, 'SKILL.md'))) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
        return false;
      }
    }

    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
      return false;
    }

    onProgress?.({ stage: 'finding', percent: 75, message: '定位 Skill 目录...' });
    this._copyDir(skillDir, targetDir);
    try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
    return true;
  }

  /**
   * 在解压目录中搜索 skill 子目录
   * 策略：优先精确匹配 skillPath，其次递归搜索同名目录
   * @param {string} extractRoot - 解压根目录
   * @param {string} skillPath   - skill 路径/名称
   * @returns {string|null} - 找到的 skill 目录路径，或 null
   * @private
   */
  _findSkillDir(extractRoot, skillPath) {
    // 1. 精确匹配：extractRoot/skillPath
    const direct = join(extractRoot, ...skillPath.split('/'));
    if (existsSync(direct) && existsSync(join(direct, 'SKILL.md'))) {
      return direct;
    }

    // 2. 递归搜索同名目录
    const skillName = basename(skillPath);
    const found = [];
    function _walk(dir) {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          const full = join(dir, e.name);
          if (e.name === skillName && existsSync(join(full, 'SKILL.md'))) {
            found.push(full);
            continue;
          }
          // 限制深度避免全盘扫描
          if (full.split(/[/\\]/).length - extractRoot.split(/[/\\]/).length < 5) {
            _walk(full);
          }
        }
      } catch { /* ignore permission errors */ }
    }
    _walk(extractRoot);

    return found.length > 0 ? found[0] : null;
  }

  // ─── 新辅助方法（Tar 流式下载 + API 并发下载） ─────────────

  /**
   * 字节数格式化
   * @param {number} bytes
   * @returns {string}
   * @private
   */
  _formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  /**
   * 根据代理地址创建代理 agent
   * @param {string} proxyUrl - 如 socks5://127.0.0.1:1080 或 http://127.0.0.1:7890
   * @returns {object|undefined}
   * @private
   */
  _createAgent(proxyUrl) {
    if (!proxyUrl) return undefined;
    if (proxyUrl.startsWith('http://') || proxyUrl.startsWith('https://')) {
      return new HttpsProxyAgent(proxyUrl);
    }
    if (proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(proxyUrl);
    }
    throw new Error(`不支持代理协议: ${proxyUrl}`);
  }

  /**
   * Tar.gz 流式下载 + 解压（仅提取目标 skill 子目录）
   *
   * 通过 filter 只保留 skillPrefix 下的文件，map 移除目录前缀。
   * 比全量 ZIP 下载后搜索快得多，且流式处理节省磁盘 IO。
   *
   * @param {object}       opts
   * @param {string}       opts.owner       - GitHub owner
   * @param {string}       opts.repo        - GitHub repo
   * @param {string}       opts.branch      - 分支（默认 main）
   * @param {string}       opts.skillPrefix - 子目录前缀
   * @param {string}       opts.targetDir   - 解压目标目录
   * @param {object}       [opts.agent]     - 代理 agent
   * @param {Function}     [opts.onProgress] - 进度回调
   * @returns {Promise<string>} targetDir
   * @private
   */
  async _downloadViaTar({ owner, repo, branch, skillPrefix, targetDir, agent, onProgress }) {
    const downloadUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${branch}`;
    const repoPrefix = `${repo}-${branch}/`;

    const res = await fetch(downloadUrl, { agent, headers: { 'User-Agent': 'CodeWhale/1.0' } });
    if (!res.ok) throw new Error(`Tar 下载失败: HTTP ${res.status}`);
    if (!res.body) throw new Error('响应没有 body 流');
    const nodeBody = Readable.fromWeb(res.body);

    const total = parseInt(res.headers.get('content-length') || 0) || null;
    let downloaded = 0;
    let extractedFiles = 0;

    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    mkdirSync(targetDir, { recursive: true });

    // 进度监控 PassThrough
    const progressStream = new PassThrough();
    progressStream.on('data', (chunk) => {
      downloaded += chunk.length;
      if (onProgress) {
        onProgress({
          stage: 'download',
          downloaded,
          total,
          percent: total ? (downloaded / total) * 100 : null,
          currentFile: `${owner}/${repo}.tar.gz`,
        });
      }
    });

    // filter 看到的是原始路径（如 repo-main/skills/find-skills/SKILL.md）
    // map 剥离前缀后写入 targetDir
    const extractor = tarExtract({
      cwd: targetDir,
      filter: (entryPath) => entryPath.startsWith(`${repoPrefix}${skillPrefix}`),
      map: (header) => {
        header.name = header.name.replace(`${repoPrefix}${skillPrefix}`, '');
        return header;
      },
    });

    extractor.on('entry', () => {
      extractedFiles++;
    });

    const gunzip = zlib.createGunzip();

    return new Promise((resolve, reject) => {
      if (!nodeBody) return reject(new Error('res.body is null'));
      nodeBody.on('error', reject);
      progressStream.on('error', reject);
      gunzip.on('error', reject);
      extractor.on('error', reject);

      nodeBody
        .pipe(progressStream)
        .pipe(gunzip)
        .pipe(extractor)
        .on('finish', () => {
          if (onProgress) {
            onProgress({ stage: 'extracted', percent: 70, message: `解压完成 (${extractedFiles} 个文件)` });
          }
          resolve(targetDir);
        });
    });
  }

  /**
   * API 并发下载（适用于大仓库）
   *
   * 通过 GitHub Tree API 获取文件列表，然后以 5 并发下载每个文件。
   * 带 3 次重试和速率限制检测。
   *
   * @param {object}       opts
   * @param {string}       opts.owner        - GitHub owner
   * @param {string}       opts.repo         - GitHub repo
   * @param {string}       opts.branch       - 分支
   * @param {string}       opts.skillPrefix  - 子目录前缀
   * @param {string}       opts.targetDir    - 目标目录
   * @param {object}       [opts.agent]      - 代理 agent
   * @param {string}       [opts.token]      - GitHub token（防限流）
   * @param {Function}     [opts.onProgress] - 进度回调
   * @returns {Promise<string>} targetDir
   * @private
   */
  async _downloadViaApi({ owner, repo, branch, skillPrefix, targetDir, agent, token, onProgress }) {
    const headers = {
      'User-Agent': 'CodeWhale/1.0',
      'Accept': 'application/vnd.github.v3+json',
      ...(token && { Authorization: `token ${token}` }),
    };

    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    // Tree API 增加 15s 超时控制
    const treeCtrl = new AbortController();
    const treeTimer = setTimeout(() => treeCtrl.abort(), 15000);
    let treeRes;
    try {
      treeRes = await fetch(treeUrl, { agent, headers, signal: treeCtrl.signal });
    } finally {
      clearTimeout(treeTimer);
    }
    const treeData = await treeRes.json().catch(() => ({}));
    if (treeRes.status === 403 && treeData.message?.includes('rate limit')) {
      throw new Error('GitHub API 速率限制已达，请提供 token');
    }
    if (!treeRes.ok) throw new Error(`Tree API 失败: HTTP ${treeRes.status}`);

    const { tree } = treeData;
    const files = tree.filter((f) => f.type === 'blob' && f.path.startsWith(skillPrefix));
    if (!files.length) throw new Error(`未找到 skill 文件（前缀 "${skillPrefix}"）`);

    const totalFiles = files.length;
    const totalBytes = files.reduce((s, f) => s + (f.size || 0), 0);
    let completed = 0;
    let downloaded = 0;

    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    mkdirSync(targetDir, { recursive: true });

    const downloadFile = async (file) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
      let relativePath = file.path.replace(skillPrefix, '');
      const localPath = join(targetDir, relativePath);
      mkdirSync(dirname(localPath), { recursive: true });

      for (let attempt = 1; attempt <= 3; attempt++) {
        let res = null;
        try {
          // AbortSignal 30s 超时控制，防止 fetch 永远挂起
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 30000);
          try {
            res = await fetch(rawUrl, {
              agent,
              signal: ctrl.signal,
              headers: { 'User-Agent': 'CodeWhale/1.0' },
            });
          } finally {
            clearTimeout(timer);
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          if (!res.body) throw new Error('响应没有 body');
          const nodeBody = Readable.fromWeb(res.body);

          const writer = createWriteStream(localPath);
          let fileDownloaded = 0;
          const fileTotal = parseInt(res.headers.get('content-length') || 0) || file.size || 0;

          nodeBody.on('data', (chunk) => {
            fileDownloaded += chunk.length;
            downloaded += chunk.length;
            if (onProgress) {
              onProgress({
                stage: 'download',
                completed,
                totalFiles,
                downloaded,
                totalBytes,
                percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
                filePercent: fileTotal ? (fileDownloaded / fileTotal) * 100 : null,
                currentFile: file.path,
              });
            }
          });

          nodeBody.pipe(writer);
          await new Promise((resolve, reject) => {
            writer.on('finish', () => {
              completed++;
              if (onProgress) {
                onProgress({
                  stage: 'download',
                  completed,
                  totalFiles,
                  downloaded,
                  totalBytes,
                  percent: totalBytes ? (downloaded / totalBytes) * 100 : (completed / totalFiles) * 100,
                  filePercent: 100,
                  currentFile: file.path,
                });
              }
              resolve();
            });
            writer.on('error', (e) => {
              try { writer.destroy(); } catch {}
              reject(e);
            });
            nodeBody.on('error', (e) => {
              try { nodeBody.destroy(); } catch {}
              reject(e);
            });
          });

          return;
        } catch (err) {
          if (res && nodeBody && !nodeBody.destroyed) {
            nodeBody.destroy();
          }
          const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
          const retryMsg = attempt < 3 ? ` (重试 ${attempt + 1}/3...)` : '';
          console.warn(`[Skill] 下载 ${file.path} 第${attempt}次失败: ${err.message}${isTimeout ? ' (超时)' : ''}${retryMsg}`);
          if (attempt === 3) throw new Error(`下载 ${file.path} 失败: ${err.message}`);
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    };

    const CONCURRENCY = 5;
    const queue = [...files];

    async function worker() {
      while (queue.length > 0) {
        await downloadFile(queue.shift());
      }
    }

    await Promise.all(
      Array(Math.min(CONCURRENCY, files.length)).fill().map(() => worker())
    );

    if (onProgress) {
      onProgress({ stage: 'api_complete', percent: 70, message: `API 下载完成 (${completed}/${totalFiles})` });
    }

    return targetDir;
  }

  /**
   * 探测正确的 skill 子目录前缀
   *
   * 策略：通过 GitHub Tree API 快速确认两个候选前缀中哪一个实际存在。
   *   候选1: skills/<skillName>/（社区仓库约定）
   *   候选2: <skillName>/（直接子目录）
   *   如果 API 不可用，默认使用 skills/<skillName>/
   *
   * @param {string} owner       - GitHub owner
   * @param {string} repo        - GitHub repo
   * @param {string} skillName   - skill 名称/子路径
   * @param {string} [branch]    - 分支
   * @param {object} [agent]     - 代理 agent
   * @param {string} [token]     - GitHub token
   * @returns {Promise<{prefix: string}>}
   * @private
   */
  async _detectSkillPrefix(owner, repo, skillName, branch = 'main', agent, token) {
    const candidatePrefixes = [`skills/${skillName}/`, `${skillName}/`];

    // 通过 Tree API 快速探测
    const apiHeaders = {
      'User-Agent': 'CodeWhale/1.0',
      'Accept': 'application/vnd.github.v3+json',
      ...(token && { Authorization: `token ${token}` }),
    };
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    try {
      const treeRes = await fetch(treeUrl, { agent, headers: apiHeaders });
      if (treeRes.ok) {
        const { tree } = await treeRes.json();
        for (const prefix of candidatePrefixes) {
          if (tree.some((f) => f.type === 'blob' && f.path.startsWith(prefix))) {
            return { prefix };
          }
        }
      }
    } catch { /* ignore */ }

    // API 不可用 → 默认 skills/<skillName>/（社区仓库约定）
    return { prefix: candidatePrefixes[0] };
  }

  // ─── 安装 ───────────────────────────────────────────────────

  /**
   * 从社区仓库安装一个 skill（内部委托到 installFromGitHub）
   * @param {string} skillId
   * @param {'global'|'project'} [level='global'] - 安装到全局还是项目
   * @param {string}       [proxyUrl] - 代理地址（可选）
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async install(skillId, level, proxyUrl) {
    return this.installFromGitHub(SKILL_REPO_BASE, skillId, level, proxyUrl);
  }

  /**
   * 从任意 GitHub 仓库安装一个 skill
   *
   * 下载策略（基于 skill-downloader-final.mjs 的成熟方案）：
   *   小仓库 → Tar.gz 流式下载解压（filter+map 仅提取目标子目录，快且可靠）
   *   大仓库 → API 获取文件列表 → 5 并发下载每个文件
   *   有代理 → 优先 git sparse clone，失败回退 Tar/API（代理穿透）
   *
   * @param {string}       repoUrl   - GitHub 仓库 URL（如 https://github.com/vercel-labs/skills）
   * @param {string}       [skillPath] - 仓库内 skill 子路径（如 "find-skills"），可选
   * @param {'global'|'project'} [level='global']
   * @param {string}       [proxyUrl] - 代理地址（可选）
   * @param {Function}     [onProgress] - 进度回调
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async installFromGitHub(repoUrl, skillPath, level, proxyUrl, onProgress, onLog) {
    // 兼容新旧两种调用方式
    if (typeof repoUrl === 'object' && repoUrl !== null) {
      return this._installFromGitHubV2(repoUrl, skillPath, level);
    }
    const targetLevel = level || 'global';

    // 1. 解析 GitHub URL 获取 owner/repo
    const parsed = _parseGitHubUrl(repoUrl);
    if (!parsed) {
      return failMsg('SKILL_INVALID_REPO_URL');
    }
    const { owner, repo } = parsed;

    // 2. 确定 skillId 和目标目录
    const skillId = skillPath ? basename(skillPath) : repo;
    const targetDir = targetLevel === 'project'
      ? join(process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    // 3. 重复安装检测
    const installed = this._getLevelInstalled(targetLevel);
    if (installed.some((s) => s.id === skillId)) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    try {
      if (onProgress) {
        onProgress({ stage: 'connecting', percent: 5, message: '连接 GitHub...' });
      }

      const agent = this._createAgent(proxyUrl);
      const branch = 'main';

      if (proxyUrl) {
        // ── 有代理：优先 git sparse clone（原生代理穿透，快），失败回退 Tar ──
        let downloaded = false;
        try {
          await this._cloneWithGitSparse(`https://github.com/${owner}/${repo}`, skillPath, targetDir, proxyUrl, onProgress);
          downloaded = true;
        } catch (gitErr) {
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 10, message: `git clone 失败 (${gitErr.message}), 回退 Tar 下载...` });
          }
          // 回退：Tar 流式下载
          if (skillPath) {
            const { prefix } = await this._detectSkillPrefix(owner, repo, skillPath, branch, agent);
            await this._downloadViaTar({
              owner, repo, branch, skillPrefix: prefix,
              targetDir, agent, onProgress,
            });
          } else {
            await this._downloadViaTar({
              owner, repo, branch, skillPrefix: '',
              targetDir, agent, onProgress,
            });
          }
          downloaded = true;
        }
        if (!downloaded) throw new Error('下载失败');
      } else {
        // ── 无代理：始终优先 Tar 流式下载，失败回退 API ──
        const skillName = skillPath || repo;
        const { prefix } = await this._detectSkillPrefix(owner, repo, skillName, branch, agent);
        const skillPrefix = skillPath ? prefix : '';
        // 候选 fallback 前缀（demo 同款策略）
        const fallbackPrefixes = [`skills/${skillName}/`, `${skillName}/`];

        let tarFailed = false;
        try {
          if (onProgress) {
            onProgress({ stage: 'downloading', percent: 15, message: 'Tarball 流式下载...' });
          }
          await this._downloadViaTar({
            owner, repo, branch, skillPrefix,
            targetDir, agent, onProgress,
          });
        } catch (tarErr) {
          tarFailed = true;
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 15, message: `Tar 下载失败 (${tarErr.message}), 回退 API 并发下载...` });
          }
          // 清理 tar 残留
          try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}

          await this._downloadViaApi({
            owner, repo, branch, skillPrefix,
            targetDir, agent, onProgress,
          });
        }
      }

      if (onProgress) {
        onProgress({ stage: 'extracted', percent: 85, message: '验证 SKILL.md...' });
      }

      // ── 安装后检测：SKILL.md 是否存在（prefix 可能不准确）──
      if (skillPath && !existsSync(join(targetDir, 'SKILL.md'))) {
        let recovered = false;

        // 1. 尝试 fallback 前缀（demo 同款策略）
        for (const fbPrefix of fallbackPrefixes) {
          if (fbPrefix === skillPrefix) continue;
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 70, message: `尝试前缀 "${fbPrefix}"...` });
          }
          try {
            try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}
            await this._downloadViaTar({
              owner, repo, branch, skillPrefix: fbPrefix,
              targetDir, agent, onProgress,
            });
            if (existsSync(join(targetDir, 'SKILL.md'))) {
              recovered = true;
              break;
            }
          } catch (fbTarErr) {
            if (onProgress) {
              onProgress({ stage: 'fallback', percent: 70, message: `前缀 "${fbPrefix}" 也失败: ${fbTarErr.message}` });
            }
          }
        }

        // 2. ZIP 全量下载 + 目录搜索（终极回退）
        if (!recovered && !existsSync(join(targetDir, 'SKILL.md'))) {
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 75, message: '回退 ZIP 全量下载 + 目录搜索...' });
          }
          try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}

          const tempRoot = join(tmpdir(), `skill-fallback-${randomUUID()}`);
          mkdirSync(tempRoot, { recursive: true });
          try {
            await this._downloadAndExtractZip(
              `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`,
              tempRoot, proxyUrl, onProgress
            );
            // ZIP 解压后在 tempRoot 下生成 <repo>-<branch>/ 子目录
            const innerDir = join(tempRoot, `${repo}-${branch}`);
            const actualRoot = existsSync(innerDir) ? innerDir : tempRoot;
            const foundDir = this._findSkillDir(actualRoot, skillPath);
            if (foundDir) {
              this._copyDir(foundDir, targetDir);
              recovered = true;
            }
          } finally {
            try { rmSync(tempRoot, { recursive: true, force: true }); } catch {}
          }
        }

        // 3. API 并发下载（最后的回退）
        if (!recovered && !existsSync(join(targetDir, 'SKILL.md'))) {
          if (onProgress) {
            onProgress({ stage: 'fallback', percent: 80, message: '回退 API 并发下载...' });
          }
          try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}
          await this._downloadViaApi({
            owner, repo, branch, skillPrefix,
            targetDir, agent, onProgress,
          });
        }
      }

      // 验证 SKILL.md 存在
      if (!existsSync(join(targetDir, 'SKILL.md'))) {
        throw new Error('SKILL.md 未找到');
      }

      // 4. 注册到配置
      const meta = _extractMeta(targetDir);
      const entry = {
        id: skillId,
        name: meta.name,
        description: meta.description,
        path: targetDir,
        enabled: true,
        source: 'community',
        version: 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      };
      this._addToConfig(entry, targetLevel);

      if (onProgress) {
        onProgress({ stage: 'done', percent: 100, message: '安装完成' });
      }

      return ok(null, getServerMessage('synced'));
    } catch (err) {
      // 清理残留
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}
      return fail(getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message, 'SKILL_INSTALL_FAILED');
    }
  }

  /**
   * 新版：接受 options 对象，委托 downloadSkillFromGitHub
   *
   * @param {object}   opts
   * @param {string}   opts.repoUrl    - GitHub 仓库 URL
   * @param {string}   [opts.skillPath] - 仓库内 skill 子路径
   * @param {'global'|'project'} [opts.level='global']
   * @param {string}   [opts.proxyId]  - 代理配置 ID
   * @param {string}   [opts.tokenId]  - GitHub Token ID
   * @param {Function} [onProgress]    - 进度回调
   * @param {Function} [onLog]         - 日志回调（可选，用于 SSE 实时推送）
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   * @private
   */
  async _installFromGitHubV2({ repoUrl, skillPath, level, proxyId, tokenId, proxyConfig, projectPath } = {}, onProgress, onLog) {
    const targetLevel = level || 'global';

    const parsed = _parseGitHubUrl(repoUrl);
    if (!parsed) return failMsg('SKILL_INVALID_REPO_URL');
    const { owner, repo } = parsed;

    const skillId = skillPath ? basename(skillPath) : repo;
    const targetDir = targetLevel === 'project'
      ? join(projectPath || process.cwd(), this._projectSkillsDir, skillId)
      : join(this._skillsDir, skillId);

    if (this._getLevelInstalled(targetLevel).some((s) => s.id === skillId)) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    try {
      if (onProgress) {
        onProgress({ stage: 'connecting', percent: 5, message: '连接 GitHub...' });
      }

      // 解析代理配置：优先使用直接传入的 proxyConfig，其次从 proxyId 查找
      if (!proxyConfig && proxyId) {
        const proxyEntry = this._engine.findProxy(proxyId);
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

      // 解析 Token
      let token = undefined;
      if (tokenId) {
        const tokenEntry = this._engine.findToken(tokenId);
        if (tokenEntry) token = tokenEntry.token;
      }

      // 委托 downloadSkillFromGitHub 执行核心下载
      await downloadSkillFromGitHub({
        repoUrl,
        skillName: skillPath || repo,
        destDir: targetDir,
        proxy: proxyConfig,
        token,
        onProgress,
        onLog,
      });

      // 验证 SKILL.md 存在
      if (!existsSync(join(targetDir, 'SKILL.md'))) {
        _sseLogSafe(onLog, 'WARN', 'SKILL.md 未找到');
        throw new Error('SKILL.md 未找到');
      }
      _sseLogSafe(onLog, 'INFO', 'SKILL.md 验证通过');

      // 注册到配置
      _sseLogSafe(onLog, 'INFO', '注册 Skill 到配置 | ' + JSON.stringify({ skillId, targetDir, level: targetLevel }));
      if (onProgress) {
        onProgress({ stage: 'registering', percent: 95, message: '注册 Skill...' });
      }
      const meta = _extractMeta(targetDir);
      this._addToConfig({
        id: skillId,
        name: meta.name,
        description: meta.description,
        path: targetDir,
        enabled: true,
        source: 'community',
        version: 'latest',
        installed_at: Date.now(),
        updated_at: Date.now(),
      }, targetLevel);

      if (onProgress) {
        onProgress({ stage: 'done', percent: 100, message: '安装完成' });
      }

      return ok(null, getServerMessage('synced'));
    } catch (err) {
      try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch {}
      return fail(getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message, 'SKILL_INSTALL_FAILED');
    }
  }

  /**
   * 从 ZIP 文件安装一个 skill
   *
   * @param {string} zipSource - ZIP 文件下载 URL 或本地路径
   * @param {'global'|'project'} [level='global']
   * @param {string}       [proxyUrl] - 代理地址（可选，如 socks5://127.0.0.1:1080 或 http://127.0.0.1:10808）
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async installFromZip(zipSource, level, proxyUrl) {
    const targetLevel = level || 'global';

    const tempDir = join(tmpdir(), `skill-extract-${randomUUID()}`);

    try {
      let extractRoot;

      // 判断是 URL 还是本地路径
      if (/^https?:\/\//i.test(zipSource)) {
        // URL → 下载并解压
        extractRoot = await this._downloadAndExtractZip(zipSource, tempDir, proxyUrl);
      } else {
        // 本地路径 → 直接解压
        if (!existsSync(zipSource)) {
          return failMsg('SKILL_DIR_NOT_EXISTS');
        }
        const zip = new AdmZip(zipSource);
        zip.extractAllTo(tempDir, true);
        const entries = readdirSync(tempDir, { withFileTypes: true });
        const dirs = entries.filter((e) => e.isDirectory());
        extractRoot = dirs.length === 1 && entries.length === 1
          ? join(tempDir, dirs[0].name)
          : tempDir;
      }

      // 在解压根目录中找 SKILL.md
      let skillDir = extractRoot;
      if (!existsSync(join(skillDir, 'SKILL.md'))) {
        // 递归搜索一层
        const subDirs = readdirSync(skillDir, { withFileTypes: true })
          .filter((e) => e.isDirectory());
        for (const sd of subDirs) {
          if (existsSync(join(skillDir, sd.name, 'SKILL.md'))) {
            skillDir = join(skillDir, sd.name);
            break;
          }
        }
      }

      if (!existsSync(join(skillDir, 'SKILL.md'))) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
        return failMsg('SKILL_DIR_NO_README');
      }

      // 确定 skillId
      const meta = _extractMeta(skillDir);
      const skillId = meta.name
        ? meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : basename(skillDir);

      // 重复检测
      const installed = this._getLevelInstalled(targetLevel);
      if (installed.some((s) => s.id === skillId)) {
        try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
        return failMsg('SKILL_ALREADY_INSTALLED');
      }

      // 复制到目标
      const targetDir = targetLevel === 'project'
        ? join(process.cwd(), this._projectSkillsDir, skillId)
        : join(this._skillsDir, skillId);
      this._copyDir(skillDir, targetDir);

      // 清理临时目录
      try { rmSync(tempDir, { recursive: true, force: true }); } catch {}

      // 注册
      const finalMeta = _extractMeta(targetDir);
      const entry = {
        id: skillId,
        name: finalMeta.name,
        description: finalMeta.description,
        path: targetDir,
        enabled: true,
        source: 'local',
        installed_at: Date.now(),
        updated_at: Date.now(),
      };
      this._addToConfig(entry, targetLevel);

      if (onProgress) {
        onProgress({ stage: 'done', percent: 100, message: '安装完成' });
      }

      return ok(null, getServerMessage('synced'));
    } catch (err) {
      try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
      return fail(getServerMessage('SKILL_ZIP_EXTRACT_FAILED') + ': ' + err.message, 'SKILL_ZIP_EXTRACT_FAILED');
    }
  }

  /**
   * 从注册表标识符安装一个 skill
   *
   * 支持格式：
   *   - "owner/repo/skill" → 解析后委托 installFromGitHub
   *   - "skill-id"        → 委托 install()（社区仓库）
   *
   * @param {string} identifier - 注册表标识符（如 vercel-labs/skills/find-skills）
   * @param {'global'|'project'} [level='global']
   * @param {string}       [proxyUrl] - 代理地址（可选，如 socks5://127.0.0.1:1080 或 http://127.0.0.1:10808）
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async installFromRegistry(identifier, level) {
    const parts = identifier.split('/').filter(Boolean);

    // 格式: owner/repo/skill（至少 3 段）
    if (parts.length >= 3) {
      const owner = parts[0];
      const repo = parts[1];
      const skillPath = parts.slice(2).join('/');
      return this.installFromGitHub(
        `https://github.com/${owner}/${repo}`,
        skillPath,
        level
      );
    }

    // 只有 skill 名 → 回退到社区仓库
    return this.install(identifier, level);
  }

  /**
   * 从本地目录安装一个 skill
   * @param {string} skillId
   * @param {string} localPath - 本地目录路径
   * @param {'global'|'project'} [level='global']
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  installLocal(skillId, localPath, level) {
    const targetLevel = level || 'global';
    const installed = this._getLevelInstalled(targetLevel);

    if (installed.some((s) => s.id === skillId)) {
      return failMsg('SKILL_ALREADY_INSTALLED');
    }

    if (!existsSync(localPath)) {
      return failMsg('SKILL_DIR_NOT_EXISTS');
    }
    if (!existsSync(join(localPath, 'SKILL.md'))) {
      return failMsg('SKILL_DIR_NO_README');
    }

    const meta = _extractMeta(localPath);
    const entry = {
      id: skillId,
      name: meta.name,
      description: meta.description,
      path: localPath,
      enabled: true,
      source: 'local',
      installed_at: Date.now(),
      updated_at: Date.now(),
    };
    this._addToConfig(entry, targetLevel);

    return ok(null, getServerMessage('synced'));
  }

  // ─── 删除 ───────────────────────────────────────────────────

  /**
   * 删除一个 skill（从磁盘删除 + 从注册表移除）
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(skillId, level) {
    return this._mutate(skillId, (entries, idx, entry, resolvedLevel) => {
      if (entry.path && existsSync(entry.path)) {
        try {
          rmSync(entry.path, { recursive: true, force: true });
        } catch {
          return failMsg('DELETE_DIR_FAILED');
        }
      }
      entries.splice(idx, 1);
      return ok(null, getServerMessage('deleted'));
    }, level);
  }

  // ─── 更新 ───────────────────────────────────────────────────

  /**
   * 更新一个 community 来源的 skill（git pull）
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {Promise<{success: boolean, data?: any, message?: string, errorCode?: string}>}
   */
  async update(skillId, level) {
    return this._mutateAsync(skillId, async (entries, idx, entry, resolvedLevel) => {
      if (entry.source !== 'community') {
        return failMsg('SKILL_NOT_COMMUNITY');
      }
      try {
        execSync(`cd "${entry.path}" && git pull`, { stdio: 'pipe', timeout: 15000, shell: true });
        // 更新元数据
        const meta = _extractMeta(entry.path);
        entries[idx].name = meta.name;
        entries[idx].description = meta.description;
        entries[idx].updated_at = Date.now();
        return ok(null, getServerMessage('updated'));
      } catch {
        return failMsg('GIT_PULL_FAILED');
      }
    }, level);
  }

  /**
   * 获取 SKILL.md 原始内容
   * @param {string} skillId
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: string, message?: string, errorCode?: string}}
   */
  getReadme(skillId, level) {
    return this._mutate(skillId, (entries, idx, entry) => {
      if (!entry.path) return fail('路径为空', 'PATH_EMPTY');
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        return ok(readFileSync(readmePath, 'utf-8'));
      } catch {
        return fail('无法读取 SKILL.md', 'READ_FAILED');
      }
    }, level);
  }

  /**
   * 保存 SKILL.md 内容到磁盘并更新元数据
   * @param {string} skillId
   * @param {string} content - 新的 Markdown 内容
   * @param {'global'|'project'} [level]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  saveReadme(skillId, content, level) {
    return this._mutate(skillId, (entries, idx, entry) => {
      if (!entry.path) return fail('路径为空', 'PATH_EMPTY');
      const readmePath = join(entry.path, 'SKILL.md');
      try {
        writeFileSync(readmePath, content, 'utf-8');
        // 重新提取 name/description
        const meta = _extractMeta(entry.path);
        entries[idx].name = meta.name;
        entries[idx].description = meta.description;
        entries[idx].updated_at = Date.now();
        return ok(entries[idx], getServerMessage('updated'));
      } catch (err) {
        return fail('写入文件失败: ' + err.message, 'WRITE_FAILED');
      }
    }, level);
  }

  // ─── 自动发现 ───────────────────────────────────────────────

  /**
   * 自动扫描磁盘上的 skill 目录，将未注册的 skill 加入注册表
   *
   * 扫描范围：
   *   全局 → ~/.codewhale/skills/
   *   项目 → <cwd>/.codewhale/skills/
   *
   * 规则：只新增不覆盖，已注册的保留不修改
   *
   * @param {'global'|'project'} [level] - 指定扫描层级，不指定则全扫
   * @returns {{success: boolean, data?: {found: number, added: number, errors: string[]}, message?: string}}
   */
  discover(level) {
    const result = { found: 0, added: 0, errors: [] };

    const scanFn = (dir, targetLevel) => {
      if (!existsSync(dir)) return;
      const entries = [];
      try {
        const names = readdirSync(dir, { withFileTypes: true });
        for (const dirent of names) {
          if (!dirent.isDirectory()) continue;
          const skillPath = join(dir, dirent.name);
          if (!existsSync(join(skillPath, 'SKILL.md'))) continue;
          result.found++;
          const installed = this._getLevelInstalled(targetLevel);
          if (installed.some((s) => s.id === dirent.name)) continue;
          const meta = _extractMeta(skillPath);
          const entry = {
            id: dirent.name,
            name: meta.name,
            description: meta.description,
            path: skillPath,
            enabled: true,
            source: 'local',
            installed_at: Date.now(),
            updated_at: Date.now(),
          };
          this._addToConfig(entry, targetLevel);
          result.added++;
        }
      } catch (err) {
        result.errors.push(`扫描 ${dir}: ${err.message}`);
      }
    };

    // 全局扫描
    if (!level || level === 'global') {
      scanFn(this._skillsDir, 'global');
    }

    // 项目扫描
    if ((!level || level === 'project') && this._projectEngine) {
      const projectDir = join(process.cwd(), this._projectSkillsDir);
      scanFn(projectDir, 'project');
    }

    return ok(result, getServerMessage('synced'));
  }

  // ─── 社区搜索（带缓存） ─────────────────────────────────────

  /**
   * 获取社区可用 skill 列表
   *
   * 优先使用本地缓存，缓存过期或 force=true 时从 GitHub API 拉取。
   * 缓存存储在 store.json 的 skills.community_cache 中，有效期 24 小时。
   *
   * @param {boolean} [force=false] - 强制刷新缓存
   * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
   */
  async searchCommunity(force) {
    const skillsCfg = this._engine.getSkills();
    const cache = skillsCfg.community_cache || [];
    const cachedAt = skillsCfg.cached_at || 0;
    const now = Date.now();

    // 缓存有效且非强制刷新
    if (!force && cache.length > 0 && (now - cachedAt) < CACHE_TTL) {
      return ok(cache);
    }

    // 拉取远程
    try {
      const apiUrl = 'https://api.github.com/repos/deepseek-ai/codewhale-skills/contents/';
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (!response.ok) {
        // 网络失败但有缓存则回退
        if (cache.length > 0) return ok(cache);
        return fail(`GitHub API 返回 ${response.status}`);
      }

      const data = await response.json();
      const skills = data
        .filter((item) => item.type === 'dir')
        .map((item) => ({ id: item.name }));

      // 更新缓存
      skillsCfg.community_cache = skills;
      skillsCfg.cached_at = Date.now();
      this._engine.setSkills(skillsCfg);

      return ok(skills);
    } catch (err) {
      if (cache.length > 0) return ok(cache);
      return fail(`请求失败: ${err.message}`);
    }
  }

  // ─── 内部方法 ───────────────────────────────────────────────

  /**
   * 按层级获取 installed 列表
   * @param {'global'|'project'} level
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getLevelInstalled(level) {
    return level === 'project' ? this._getProjectInstalled() : this._getGlobalInstalled();
  }

  /**
   * 按层级获取引擎
   * @param {'global'|'project'} level
   * @returns {object}
   * @private
   */
  _getLevelEngine(level) {
    return level === 'project' ? this._projectEngine : this._engine;
  }

  /**
   * 获取全局已安装列表
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getGlobalInstalled() {
    return this._engine.getSkills().installed || [];
  }

  /**
   * 获取项目已安装列表
   * @returns {import('./types.js').SkillEntry[]}
   * @private
   */
  _getProjectInstalled() {
    return this._projectEngine ? this._projectEngine.getInstalled() : [];
  }

  /**
   * 向指定层级的注册表添加一个条目
   * @param {import('./types.js').SkillEntry} entry
   * @param {'global'|'project'} level
   * @private
   */
  _addToConfig(entry, level) {
    if (level === 'project' && this._projectEngine) {
      const installed = this._projectEngine.getInstalled();
      installed.push(entry);
      this._projectEngine.setInstalled(installed);
    } else {
      const skillsCfg = this._engine.getSkills();
      const installed = skillsCfg.installed || [];
      installed.push(entry);
      skillsCfg.installed = installed;
      this._engine.setSkills(skillsCfg);
    }
  }

  /**
   * 查找 skill 所在层级并执行回调（同步版）
   * @param {string} skillId
   * @param {(entries: Array, idx: number, entry: object, level: string, engine: object) => any} fn
   * @param {'global'|'project'} [hintLevel]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   * @private
   */
  _mutate(skillId, fn, hintLevel) {
    // 尝试提示层级
    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return failMsg('SKILL_NOT_FOUND');
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = fn(entries, idx, entries[idx], hintLevel, engine);
      this._setLevelInstalled(hintLevel, entries);
      return result;
    }

    // 全局优先
    const globalEntries = this._getGlobalInstalled();
    let idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = fn(globalEntries, idx, globalEntries[idx], 'global', this._engine);
      this._setLevelInstalled('global', globalEntries);
      return result;
    }

    // 项目
    if (this._projectEngine) {
      const projectEntries = this._getProjectInstalled();
      idx = projectEntries.findIndex((s) => s.id === skillId);
      if (idx !== -1) {
        const result = fn(projectEntries, idx, projectEntries[idx], 'project', this._projectEngine);
        this._setLevelInstalled('project', projectEntries);
        return result;
      }
    }

    return failMsg('SKILL_NOT_FOUND');
  }

  /**
   * 异步版 _mutate
   * @private
   */
  async _mutateAsync(skillId, fn, hintLevel) {

    if (hintLevel) {
      const engine = this._getLevelEngine(hintLevel);
      if (!engine) return failMsg('SKILL_NOT_FOUND');
      const entries = this._getLevelInstalled(hintLevel);
      const idx = entries.findIndex((s) => s.id === skillId);
      if (idx === -1) return failMsg('SKILL_NOT_FOUND');
      const result = await fn(entries, idx, entries[idx], hintLevel, engine);
      this._setLevelInstalled(hintLevel, entries);
      return result;
    }

    const globalEntries = this._getGlobalInstalled();
    let idx = globalEntries.findIndex((s) => s.id === skillId);
    if (idx !== -1) {
      const result = await fn(globalEntries, idx, globalEntries[idx], 'global', this._engine);
      this._setLevelInstalled('global', globalEntries);
      return result;
    }

    if (this._projectEngine) {
      const projectEntries = this._getProjectInstalled();
      idx = projectEntries.findIndex((s) => s.id === skillId);
      if (idx !== -1) {
        const result = await fn(projectEntries, idx, projectEntries[idx], 'project', this._projectEngine);
        this._setLevelInstalled('project', projectEntries);
        return result;
      }
    }

    return failMsg('SKILL_NOT_FOUND');
  }

  /**
   * 设置某层级的 installed 列表
   * @param {'global'|'project'} level
   * @param {import('./types.js').SkillEntry[]} entries
   * @private
   */
  _setLevelInstalled(level, entries) {
    if (level === 'project' && this._projectEngine) {
      this._projectEngine.setInstalled(entries);
    } else {
      const skillsCfg = this._engine.getSkills();
      skillsCfg.installed = entries;
      this._engine.setSkills(skillsCfg);
    }
  }

  /**
   * 启用/禁用切换
   * @param {string} skillId
   * @param {boolean} enabled
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   * @private
   */
  _toggle(skillId, enabled) {
    return this._mutate(skillId, (entries, idx) => {
      entries[idx].enabled = enabled;
      entries[idx].updated_at = Date.now();
      return ok(null, getServerMessage('updated'));
    });
  }

  /** @returns {string} */
  get skillsDir() {
    return this._skillsDir;
  }
}
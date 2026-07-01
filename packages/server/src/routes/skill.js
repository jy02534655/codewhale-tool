/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 * 只保留从 GitHub 安装（SSE 流式）。
 */

import { Router } from 'express';
import { guard, guardAsync } from '../utils/guard.js';
import multer from 'multer';
import { tmpdir } from 'node:os';

/**
 * @param {import('@codewhale/core').SkillManager} skillMgr
 * @returns {import('express').Router}
 */
export function createSkillRouter(skillMgr) {
  const router = Router();

  // ─── 列表查询 ────────────────────────────────────────────────

  router.get('/list', (_req, res) => {
    res.json(guard(() => skillMgr.listAll()));
  });

  router.get('/list/global', (_req, res) => {
    res.json(guard(() => skillMgr.listGlobal()));
  });

  router.get('/list/project', (_req, res) => {
    res.json(guard(() => skillMgr.listProject()));
  });

  router.get('/show/:id', (req, res) => {
    res.json(guard(() => skillMgr.show(req.params.id)));
  });

  // ─── 编辑（备注 / 标签 / 别名） ──────────────────────────────

  router.put('/remark/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateRemark(req.params.id, req.body.remark)));
  });

  router.put('/tags/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateTags(req.params.id, req.body.tags)));
  });

  router.put('/meta/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateMeta(req.params.id, req.body, req.body.level)));
  });

  // ─── SKILL.md 在线编辑 ──────────────────────────────────────

  router.get('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.getReadme(req.params.id)));
  });

  router.put('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveReadme(req.params.id, req.body.content)));
  });

  // ─── Skill 文件浏览 ──────────────────────────────────────────

  /** GET /api/skill/files/:id — 获取 skill 目录下所有文件列表 */
  router.get('/files/:id', (req, res) => {
    res.json(guard(() => skillMgr.getSkillFiles(req.params.id, req.query.level)));
  });

  /** GET /api/skill/file/:id — 读取 skill 目录下的指定文件（?path=相对路径） */
  router.get('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.readSkillFile(req.params.id, req.query.path, req.query.level)));
  });

  /** PUT /api/skill/file/:id — 保存 skill 目录下的指定文件（body: { path, content }） */
  router.put('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveSkillFile(req.params.id, req.body.path, req.body.content, req.body.level)));
  });
  /** DELETE /api/skill/file/:id — 删除 skill 目录下的指定文件（body: { path }） */
  router.delete('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.removeSkillFile(req.params.id, req.body.path, req.body.level)));
  });

  // ─── 操作 ──────────────────────────────────────────────────

  router.post('/discover', (req, res) => {
    res.json(guard(() => skillMgr.discover(req.body.level)));
  });

  router.post('/install', async (req, res) => {
    res.json(await guardAsync(() => skillMgr.install(req.body.id, req.body.level)));
  });

  router.post('/enable/:id', (req, res) => {
    res.json(guard(() => skillMgr.enable(req.params.id)));
  });

  router.post('/disable/:id', (req, res) => {
    res.json(guard(() => skillMgr.disable(req.params.id)));
  });

  router.delete('/remove/:id', (req, res) => {
    res.json(guard(() => skillMgr.remove(req.params.id)));
  });

  router.post('/update/:id', async (req, res) => {
    res.json(await guardAsync(() => skillMgr.update(req.params.id)));
  });

  // ─── 安装：GitHub SSE 进度流 ────────────────────────────────────

  /**
   * SSE 流式安装 — 从 GitHub 仓库下载 skill
   * query: repoUrl, skillPath, level, proxyId, tokenId
   */
  router.get('/install-github-stream', async (req, res) => {
    const { repoUrl, skillPath, level, proxyId, tokenId, proxyUrl, projectPath } = req.query;

    // 解析 proxyUrl 为结构化代理配置（支持直接传 URL 而非 proxyId）
    let proxyConfig;
    if (proxyUrl && !proxyId) {
      try {
        const url = new URL(proxyUrl);
        proxyConfig = {
          type: url.protocol.replace(':', ''),
          host: url.hostname,
          port: parseInt(url.port) || (url.protocol === 'socks5:' ? 1080 : 8080),
          auth: url.username
            ? { username: decodeURIComponent(url.username), password: decodeURIComponent(url.password) }
            : undefined,
        };
      } catch { /* ignore invalid URL */ }
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let clientConnected = true;
    req.on('close', () => { clientConnected = false; });

    function sendSSE(event, data) {
      if (!clientConnected) return;
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
    }

    const onProgress = (progress) => {
      sendSSE('progress', progress);
    };

    // 日志回调 → SSE log 事件（转发 download-skill.log 内容）
    const onLog = (logEntry) => {
      sendSSE('log', { level: logEntry.level || 'INFO', message: logEntry.message });
    };

    try {
      const result = await skillMgr.installFromGitHub({
        repoUrl,
        skillPath,
        level,
        proxyId,
        tokenId,
        proxyConfig,
        projectPath,
      }, onProgress, onLog);
      if (result.success) {
        sendSSE('complete', { success: true, data: result.data });
      } else {
        sendSSE('error', { success: false, message: result.message, errorCode: result.errorCode });
      }
    } catch (err) {
      sendSSE('error', { success: false, message: err.message });
    } finally {
      // 始终尝试结束响应，即使客户端已断开连接
      // 如果客户端已断开，res.end() 是安全的空操作
      try { res.end(); } catch { /* ignore */ }
    }
  });

  // ─── 社区搜索 ──────────────────────────────────────────────────────────────────────────────────────────

  router.get('/search', async (req, res) => {
    res.json(await guardAsync(async () => {
      const force = req.query.force === '1' || req.query.force === 'true';
      return await skillMgr.searchCommunity(force, req.query.q);
    }));
  });

  // ─── 安装日志查看 / 清除 ─────────────────────────────────

  /** GET /api/skill/install-log — 读取最近安装日志 */
  router.get('/install-log', (_req, res) => {
    res.json(guard(() => skillMgr.getInstallLog()));
  });

  /** DELETE /api/skill/install-log — 清除安装日志 */
  router.delete('/install-log', (_req, res) => {
    res.json(guard(() => skillMgr.clearInstallLog()));
  });

  /** GET /api/skill/current-project — 返回当前项目工作目录 */
  router.get('/current-project', (_req, res) => {
    res.json(guard(() => skillMgr.getCurrentProject()));
  });

  // ─── ZIP 上传安装 ──────────────────────────────────────────────

  const _upload = multer({ dest: tmpdir() });
  const _pendingZipInstalls = new Map();

  /**
   * POST /api/skill/install-zip-stream — 上传 ZIP 文件，返回 streamId
   * body: multipart/form-data — file (ZIP), skillName, level
   */
  router.post('/install-zip-stream', _upload.single('file'), (req, res) => {
    if (!req.file) {
      res.json({ success: false, message: 'No file uploaded' })
      return
    }
    const streamId = crypto.randomUUID();
    _pendingZipInstalls.set(streamId, {
      filePath: req.file.path,
      skillName: req.body.skillName || '',
      level: req.body.level || 'global',
      createdAt: Date.now(),
    });
    res.json({ success: true, streamId });
  });

  /**
   * GET /api/skill/install-zip-stream/sse/:streamId — SSE 流式安装进度
   */
  router.get('/install-zip-stream/sse/:streamId', async (req, res) => {
    const pending = _pendingZipInstalls.get(req.params.streamId);
    if (!pending) {
      res.status(404).json({ success: false, message: 'Stream not found' });
      return;
    }
    _pendingZipInstalls.delete(req.params.streamId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let clientConnected = true;
    req.on('close', () => { clientConnected = false; });

    const sendSSE = (event, data) => {
      if (!clientConnected) return;
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
    };

    const onProgress = (progress) => sendSSE('progress', progress);
    const onLog = (logEntry) => sendSSE('log', { level: logEntry.level || 'INFO', message: logEntry.message });

    try {
      const result = await skillMgr.installFromZipStream(pending.filePath, pending.skillName, pending.level, onProgress, onLog);
      if (result.success) {
        sendSSE('complete', { success: true, data: result.data });
      } else {
        sendSSE('error', { success: false, message: result.message });
      }
    } catch (err) {
      sendSSE('error', { success: false, message: err.message });
    } finally {
      try { res.end(); } catch { /* ignore */ }
    }
  });

  // ─── GitHub Tree 路径安装 ──────────────────────────────────────

  /**
   * GET /api/skill/install-github-path-stream — SSE 流式安装进度
   * query: githubUrl, level, proxyId, tokenId
   */
  router.get('/install-github-path-stream', async (req, res) => {
    const { githubUrl, level, proxyId, tokenId } = req.query;

    if (!githubUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'githubUrl is required' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let clientConnected = true;
    req.on('close', () => { clientConnected = false; });

    const sendSSE = (event, data) => {
      if (!clientConnected) return;
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
    };

    const onProgress = (progress) => sendSSE('progress', progress);
    const onLog = (logEntry) => sendSSE('log', { level: logEntry.level || 'INFO', message: logEntry.message });

    try {
      const result = await skillMgr.installFromGithubTreePath(githubUrl, level, proxyId, tokenId, onProgress, onLog);
      if (result.success) {
        sendSSE('complete', { success: true, data: result.data });
      } else {
        sendSSE('error', { success: false, message: result.message });
      }
    } catch (err) {
      sendSSE('error', { success: false, message: err.message });
    } finally {
      try { res.end(); } catch { /* ignore */ }
    }
  });

  return router;
}
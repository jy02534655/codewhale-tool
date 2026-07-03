/**
 * @codewhale/server — Skill 安装路由（SSE 流式）
 *
 * 挂载路径: /api/skill
 */

import { guardAsync } from '../../utils/guard.js';
import multer from 'multer';
import { tmpdir } from 'node:os';

export function registerInstallRoutes(router, skillMgr, upload, pendingZipInstalls) {
  /**
   * SSE 桥接工厂
   * 为单个 SSE 连接提供事件发送、进度回调、日志上报和统一完成/失败处理。
   */
  function createInstallSSEBridge(res) {
    let clientConnected = true;
    const close = () => {
      clientConnected = false;
    };
    const sendSSE = (event, data) => {
      if (!clientConnected) return;
      res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
    };
    const onProgress = (progress) => {
      sendSSE('progress', progress);
    };
    const onLog = (logEntry) => {
      sendSSE('log', { level: logEntry.level || 'INFO', message: logEntry.message });
    };
    const sendFailure = (message, errorCode) => {
      onLog({ level: 'ERROR', message });
      sendSSE('error', { success: false, message, errorCode });
    };
    const sendComplete = (data) => {
      sendSSE('complete', { success: true, data });
    };
    const end = () => {
      try { res.end(); } catch { /* ignore */ }
    };
    return { close, onProgress, onLog, sendFailure, sendComplete, end };
  }

  /**
   * 共享 SSE 配置工具
   * 自动设置 SSE 响应头、创建 bridge、监听连接、统一完成/失败处理。
   */
  async function withSSE(req, res, handler) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    const sse = createInstallSSEBridge(res);
    req.on('close', sse.close);
    try {
      const result = await handler(sse);
      if (result.success) {
        sse.sendComplete(result.data);
      } else {
        sse.sendFailure(result.message, result.errorCode);
      }
    } catch (err) {
      sse.sendFailure(err.message);
    } finally {
      sse.end();
    }
  }

  /** GET /api/skill/install-github-stream — SSE 流式安装 skill（GitHub 仓库） */
  router.get('/install-github-stream', async (req, res) => {
    const { repoUrl, skillPath, level, proxyId, tokenId, proxyUrl, projectPath } = req.query;
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
    await withSSE(req, res, async (sse) => {
      return await skillMgr.installFromGitHub({
        repoUrl,
        skillPath,
        level,
        proxyId,
        tokenId,
        proxyConfig,
        projectPath,
      }, sse.onProgress, sse.onLog);
    });
  });

  /** POST /api/skill/install-zip-stream — 上传 ZIP 文件，返回 streamId */
  router.post('/install-zip-stream', upload.single('file'), (req, res) => {
    if (!req.file) {
      res.json({ success: false, message: 'No file uploaded' });
      return;
    }
    const streamId = crypto.randomUUID();
    pendingZipInstalls.set(streamId, {
      filePath: req.file.path,
      skillName: req.body.skillName || '',
      level: req.body.level || 'global',
      createdAt: Date.now(),
    });
    res.json({ success: true, streamId });
  });

  /** GET /api/skill/install-zip-stream/sse/:streamId — SSE 流式安装进度（ZIP 上传） */
  router.get('/install-zip-stream/sse/:streamId', async (req, res) => {
    const pending = pendingZipInstalls.get(req.params.streamId);
    if (!pending) {
      res.status(404).json({ success: false, message: 'Stream not found' });
      return;
    }
    pendingZipInstalls.delete(req.params.streamId);
    await withSSE(req, res, async (sse) => {
      return await skillMgr.installFromZipStream(pending.filePath, pending.skillName, pending.level, sse.onProgress, sse.onLog);
    });
  });

  /** GET /api/skill/install-github-path-stream — SSE 流式安装 skill（GitHub 目录路径） */
  router.get('/install-github-path-stream', async (req, res) => {
    const { githubUrl, level, proxyId, tokenId } = req.query;
    if (!githubUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'githubUrl is required' }));
      return;
    }
    await withSSE(req, res, async (sse) => {
      return await skillMgr.installFromGithubTreePath(githubUrl, level, proxyId, tokenId, sse.onProgress, sse.onLog);
    });
  });
}

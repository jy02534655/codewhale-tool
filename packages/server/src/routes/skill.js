/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 * 只保留从 GitHub 安装（SSE 流式）。
 */

import { Router } from 'express';
import { guard, guardAsync } from '@codewhale/core';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

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
    const { repoUrl, skillPath, level, proxyId, tokenId, proxyUrl } = req.query;

    // 解析 proxyUrl 为结构化代理配置（支持直接传 URL 而非 proxyId）
    let proxyConfig = undefined;
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let clientConnected = true;
    req.on('close', () => { clientConnected = false; });

    function sendSSE(event, data) {
      if (!clientConnected) return;
      res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
    }

    // 进度回调 → SSE 事件
    const onProgress = (progress) => {
      sendSSE('progress', progress);
    };

    try {
      const result = await skillMgr.installFromGitHub({
        repoUrl,
        skillPath,
        level,
        proxyId,
        tokenId,
        proxyConfig,
      }, onProgress);
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

  // ─── 社区搜索 ──────────────────────────────────────────────

  router.get('/search', async (req, res) => {
    res.json(await guardAsync(async () => {
      const force = req.query.force === '1' || req.query.force === 'true';
      const r = await skillMgr.searchCommunity(force);
      if (r.success && req.query.q) {
        const q = req.query.q.toLowerCase();
        r.data = r.data.filter((s) => s.id.toLowerCase().includes(q));
      }
      return r;
    }));
  });

  return router;
}
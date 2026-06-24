/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 */

import { Router } from 'express';
import { guard, guardAsync } from '@codewhale/core';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

export function createSkillRouter(skillMgr, skillhubCli) {
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

  // ─── 新版安装端点 ──────────────────────────────────────────

  // GitHub 仓库安装
  router.post('/install-github', async (req, res) => {
    res.json(await guardAsync(() =>
      skillMgr.installFromGitHub(req.body.repoUrl, req.body.skillPath, req.body.level, req.body.proxyUrl)
    ));
  });

  // ZIP 安装（URL 或本地路径）
  router.post('/install-zip', async (req, res) => {
    res.json(await guardAsync(() =>
      skillMgr.installFromZip(req.body.zipSource, req.body.level, req.body.proxyUrl)
    ));
  });

  // ZIP Base64 上传安装
  router.post('/upload-zip', async (req, res) => {
    res.json(await guardAsync(async () => {
      const { base64, fileName, level } = req.body;
      if (!base64) return { success: false, message: '缺少 ZIP 数据' };
      const buffer = Buffer.from(base64, 'base64');
      const tmpPath = join(tmpdir(), `upload-${randomUUID()}.zip`);
      writeFileSync(tmpPath, buffer);
      const result = await skillMgr.installFromZip(tmpPath, level);
      try { rmSync(tmpPath); } catch {}
      return result;
    }));
  });

  // 注册表安装

  // GitHub 仓库安装（SSE 实时进度流）
  router.get('/install-github-stream', async (req, res) => {
    const { repoUrl, skillPath, level, proxyUrl } = req.query;

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // SSE 发送辅助函数
    let clientConnected = true;
    req.on('close', () => { clientConnected = false; });

    function sendSSE(event, data) {
      if (!clientConnected) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }

    // 进度回调 → SSE 事件
    const onProgress = (progress) => {
      sendSSE('progress', progress);
    };

    try {
      const result = await skillMgr.installFromGitHub(repoUrl, skillPath, level, proxyUrl, onProgress);
      if (result.success) {
        sendSSE('complete', { success: true, data: result.data });
      } else {
        sendSSE('error', { success: false, message: result.message, errorCode: result.errorCode });
      }
    } catch (err) {
      sendSSE('error', { success: false, message: err.message });
    } finally {
      if (clientConnected) {
        res.end();
      }
    }
  });

  router.post('/install-registry', async (req, res) => {
    res.json(await guardAsync(() =>
      skillMgr.installFromRegistry(req.body.identifier, req.body.level)
    ));
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

  // ─── Skillhub ──────────────────────────────────────────────

  // 检查 Skillhub CLI 是否已安装
  router.get('/skillhub/status', async (_req, res) => {
    if (!skillhubCli) {
      res.json({ success: false, data: null, message: 'SkillhubCLI not initialized' });
      return;
    }
    const result = await skillhubCli.getStatus();
    res.json(result);
  });

  // 安装 Skillhub CLI
  router.post('/skillhub/install', async (_req, res) => {
    if (!skillhubCli) {
      res.json({ success: false, data: null, message: 'SkillhubCLI not initialized' });
      return;
    }
    res.json(await guardAsync(() => skillhubCli.install()));
  });

  // 通过 Skillhub 搜索技能
  router.post('/skillhub/search', async (req, res) => {
    if (!skillhubCli) {
      res.json({ success: false, data: null, message: 'SkillhubCLI not initialized' });
      return;
    }
    res.json(await guardAsync(() => skillhubCli.search(req.body.keyword)));
  });

  // 通过 Skillhub 安装技能
  router.post('/skillhub/install-skill', async (req, res) => {
    if (!skillhubCli) {
      res.json({ success: false, data: null, message: 'SkillhubCLI not initialized' });
      return;
    }
    res.json(await guardAsync(() => skillhubCli.installSkill(req.body.name)));
  });

  return router;
}
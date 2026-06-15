/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 */

import { Router } from 'express';
import { guard, guardAsync } from '@codewhale/core';

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
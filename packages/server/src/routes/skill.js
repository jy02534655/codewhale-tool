/**
 * @codewhale/server — Skill 路由
 *
 * 挂载路径: /api/skill
 * 管理社区技能的安装、展示、启用/禁用与搜索。
 */

import { Router } from 'express';
import { guard, guardAsync } from '@codewhale/core';

export function createSkillRouter(skillMgr) {
  const router = Router();

  /** 获取已安装技能列表 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => skillMgr.listInstalled()));
  });

  /** 查看技能详情 */
  router.get('/show/:id', (req, res) => {
    res.json(guard(() => skillMgr.show(req.params.id)));
  });

  /** 安装技能 */
  router.post('/install', async (req, res) => {
    res.json(await guardAsync(() => skillMgr.install(req.body.id)));
  });

  /** 启用技能 */
  router.post('/enable/:id', (req, res) => {
    res.json(guard(() => skillMgr.enable(req.params.id)));
  });

  /** 禁用技能 */
  router.post('/disable/:id', (req, res) => {
    res.json(guard(() => skillMgr.disable(req.params.id)));
  });

  /** 删除技能 */
  router.delete('/remove/:id', (req, res) => {
    res.json(guard(() => skillMgr.remove(req.params.id)));
  });

  /** 搜索社区技能 */
  router.get('/search', async (_req, res) => {
    res.json(await guardAsync(async () => {
      const r = await skillMgr.searchCommunity();
      if (r.success) {
        const q = (_req.query.q || '').toLowerCase();
        if (q) r.data = r.data.filter((s) => s.id.toLowerCase().includes(q));
      }
      return r;
    }));
  });

  return router;
}
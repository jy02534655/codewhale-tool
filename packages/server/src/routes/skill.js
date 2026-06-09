/**
 * @codewhale/server — Skill 路由
 *
 * 挂载路径: /api/skill
 * 管理社区技能的安装、展示、启用/禁用与搜索。
 */

import { Router } from 'express';
import { guard, guardAsync, getServerMessage } from '@codewhale/core';
import { ok, fail, langOf } from '../helpers.js';

/**
 * 创建 Skill 路由
 * @param {import('@codewhale/core').SkillManager} skillMgr
 * @returns {import('express').Router}
 */
export function createSkillRouter(skillMgr) {
  const router = Router();

  /** 获取已安装技能列表 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => ok(skillMgr.listInstalled())));
  });

  /** 查看指定技能的 entry 和 readme 内容 */
  router.get('/show/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const { entry, readme } = skillMgr.show(req.params.id);
      return entry ? ok({ entry, readme }) : fail(getServerMessage(l, 'notFound'));
    }));
  });

  /** 从社区安装技能 */
  router.post('/install', async (req, res) => {
    res.json(await guardAsync(async () => ok(await skillMgr.install(req.body.id))));
  });

  /** 启用已安装技能 */
  router.post('/enable/:id', (req, res) => {
    res.json(guard(() => ok(skillMgr.enable(req.params.id))));
  });

  /** 禁用已安装技能 */
  router.post('/disable/:id', (req, res) => {
    res.json(guard(() => ok(skillMgr.disable(req.params.id))));
  });

  /** 移除已安装技能 */
  router.delete('/remove/:id', (req, res) => {
    res.json(guard(() => ok(skillMgr.remove(req.params.id))));
  });

  /** 搜索社区技能（支持 ?q= 过滤） */
  router.get('/search', async (req, res) => {
    res.json(await guardAsync(async () => {
      const result = await skillMgr.searchCommunity();
      if (result.success) {
        const q = (req.query.q || '').toLowerCase();
        result.skills = q
          ? result.skills.filter((s) => s.id.toLowerCase().includes(q))
          : result.skills;
      }
      return ok(result.skills || []);
    }));
  });

  return router;
}
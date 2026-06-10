/**
 * @codewhale/server — Skill 路由
 *
 * 挂载路径: /api/skill
 * 管理社区技能的安装、展示、启用/禁用与搜索。
 * 语言由中间件自动提取并全局设置，路由层不再透传 lang。
 */

import { Router } from 'express';
import { guard, guardAsync } from '@codewhale/core';

/**
 * 创建 Skill 路由
 * @param {import('@codewhale/core').SkillManager} skillMgr
 * @returns {import('express').Router}
 */
export function createSkillRouter(skillMgr) {
  const router = Router();

  /** 获取已安装技能列表 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => ({
      success: true,
      data: skillMgr.listInstalled(),
      message: '',
    })));
  });

  /** 查看指定技能的 entry 和 readme 内容 */
  router.get('/show/:id', (req, res) => {
    res.json(guard(() => skillMgr.show(req.params.id)));
  });

  /** 从社区安装技能 */
  router.post('/install', async (req, res) => {
    res.json(await guardAsync(async () => {
      const r = await skillMgr.install(req.body.id);
      return r;
    }));
  });

  /** 启用已安装技能 */
  router.post('/enable/:id', (req, res) => {
    res.json(guard(() => {
      const r = skillMgr.enable(req.params.id);
      return r;
    }));
  });

  /** 禁用已安装技能 */
  router.post('/disable/:id', (req, res) => {
    res.json(guard(() => {
      const r = skillMgr.disable(req.params.id);
      return r;
    }));
  });

  /** 移除已安装技能 */
  router.delete('/remove/:id', (req, res) => {
    res.json(guard(() => {
      const r = skillMgr.remove(req.params.id);
      return r;
    }));
  });

  /** 搜索社区技能（支持 ?q= 过滤） */
  router.get('/search', async (_req, res) => {
    res.json(await guardAsync(async () => {
      const result = await skillMgr.searchCommunity();
      if (result.success) {
        const q = (_req.query.q || '').toLowerCase();
        if (q) {
          result.data = result.data.filter((s) => s.id.toLowerCase().includes(q));
        }
      }
      return result;
    }));
  });

  return router;
}
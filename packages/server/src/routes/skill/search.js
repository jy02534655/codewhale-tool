/**
 * @codewhale/server — Skill 领域搜索路由
 *
 * 挂载路径: /api/skill
 */

import { guardAsync } from '../../utils/guard.js';

export function registerSearchRoutes(router, skillMgr) {
  /** 搜索领域 skill */
  router.get('/search', async (req, res) => {
    res.json(await guardAsync(async () => {
      const force = req.query.force === '1' || req.query.force === 'true';
      return await skillMgr.searchCommunity(force, req.query.q);
    }));
  });
}

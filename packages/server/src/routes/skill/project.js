/**
 * @codewhale/server — Skill 当前项目路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerProjectRoutes(router, skillMgr) {
  /** GET /api/skill/current-project — 返回当前项目工作目录 */
  router.get('/current-project', (_req, res) => {
    res.json(guard(() => skillMgr.getCurrentProject()));
  });
}

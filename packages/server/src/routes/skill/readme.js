/**
 * @codewhale/server — Skill README 编辑路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerReadmeRoutes(router, skillMgr) {
  /** 读取 skill 的 SKILL.md */
  router.get('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.getReadme(req.params.id)));
  });

  /** 保存 skill 的 SKILL.md */
  router.put('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveReadme(req.params.id, req.body.content)));
  });
}

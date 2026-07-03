/**
 * @codewhale/server — Skill 列表查询路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerQueryRoutes(router, skillMgr) {
  /** 获取所有 skill */
  router.get('/list', (_req, res) => {
    res.json(guard(() => skillMgr.listAll()));
  });

  /** 获取全局 skill 列表 */
  router.get('/list/global', (_req, res) => {
    res.json(guard(() => skillMgr.listGlobal()));
  });

  /** 获取项目 skill 列表 */
  router.get('/list/project', (_req, res) => {
    res.json(guard(() => skillMgr.listProject()));
  });

  /** 获取 skill 详情 */
  router.get('/show/:id', (req, res) => {
    res.json(guard(() => skillMgr.show(req.params.id)));
  });
}

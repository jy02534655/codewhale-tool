/**
 * @codewhale/server — Skill 操作命令路由
 *
 * 挂载路径: /api/skill
 */

import { guard, guardAsync } from '../../utils/guard.js';

export function registerCmdRoutes(router, skillMgr) {
  /** 启用 skill */
  router.post('/enable/:id', (req, res) => {
    res.json(guard(() => skillMgr.enable(req.params.id)));
  });

  /** 禁用 skill */
  router.post('/disable/:id', (req, res) => {
    res.json(guard(() => skillMgr.disable(req.params.id)));
  });

  /** 删除 skill */
  router.delete('/remove/:id', (req, res) => {
    res.json(guard(() => skillMgr.remove(req.params.id)));
  });

  /** 复制 skill 到项目 */
  router.post('/copy-to-project/:id', (req, res) => {
    res.json(guard(() => skillMgr.copyToProject(req.params.id)));
  });

  /** 更新 skill */
  router.post('/update/:id', async (req, res) => {
    res.json(await guardAsync(() => skillMgr.update(req.params.id)));
  });
}

/**
 * @codewhale/server — Skill 元数据编辑路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerMetaRoutes(router, skillMgr) {
  /** 更新 skill 备注 */
  router.put('/remark/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateRemark(req.params.id, req.body.remark)));
  });

  /** 更新 skill 标签 */
  router.put('/tags/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateTags(req.params.id, req.body.tags)));
  });

  /** 更新 skill 元数据 */
  router.put('/meta/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateMeta(req.params.id, req.body, req.body.level)));
  });
}

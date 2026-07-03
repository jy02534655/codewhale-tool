/**
 * @codewhale/server — Provider 模型管理路由
 *
 * 挂载路径: /api/provider/models/*
 * 模型管理子路由必须在 /:id 通配路由之前注册。
 */

import { guard, withSync } from '../../utils/guard.js';

export function registerModelRoutes(router, providerMgr, syncMgr) {
  /** 添加模型 */
  router.post('/models/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.addModel(req.body))));
  });

  /** 删除模型 */
  router.post('/models/delete', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.removeModel(req.body))));
  });

  /** 激活模型 */
  router.post('/models/activate', (req, res) => {
    res.json(guard(() => syncMgr.setActiveModelAndSync(req.body)));
  });
}

/**
 * @codewhale/server — 官方 API Key 路由
 *
 * 挂载路径: /api/official-key
 * 管理 DeepSeek 官方 API key 的增删改查与激活切换。
 */

import { Router } from 'express';
import { guard, withSync } from '../utils/guard.js';

export function createOfficialKeyRouter(officialKeyMgr, syncMgr) {
  const router = Router();

  /** 获取所有官方 key */
  router.get('/list', (_req, res) => {
    res.json(guard(() => officialKeyMgr.list()));
  });

  /** 添加官方 key */
  router.post('/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => officialKeyMgr.add(req.body))));
  });

  /** 更新别名 */
  router.put('/edit', (req, res) => {
    res.json(guard(() => officialKeyMgr.updateAlias({ id: req.body.id, alias: req.body.alias })));
  });

  /** 激活官方 key */
  router.post('/activate', (req, res) => {
    res.json(guard(() => syncMgr.activateOfficialAndSync(req.body.id)));
  });

  /** 删除官方 key */
  router.delete('/remove', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => officialKeyMgr.remove(req.body.id))));
  });

  return router;
}

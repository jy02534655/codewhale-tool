/**
 * routes/proxy.js — 代理配置 CRUD REST API
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';

/** @param {ProxyManager} proxyMgr */
export function createProxyRouter(proxyMgr) {
  const router = Router();

  // 列出所有代理
  router.get('/list', (req, res) => {
    res.json(guard(() => proxyMgr.list()));
  });

  // 新增代理
  router.post('/add', (req, res) => {
    res.json(guard(() => proxyMgr.add(req.body)));
  });

  // 更新代理
  router.put('/:id', (req, res) => {
    res.json(guard(() => proxyMgr.update(req.params.id, req.body)));
  });

  // 删除代理
  router.delete('/:id', (req, res) => {
    res.json(guard(() => proxyMgr.remove(req.params.id)));
  });

  // 设为默认代理
  router.put('/:id/default', (req, res) => {
    res.json(guard(() => proxyMgr.setDefault(req.params.id)));
  });

  return router;
}

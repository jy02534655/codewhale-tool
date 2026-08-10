/**
 * routes/token.js — GitHub Token CRUD REST API
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';

/** @param {import('@codewhale/core').TokenManager} tokenMgr */
export function createTokenRouter(tokenMgr) {
  const router = Router();

  // 列出所有 token
  router.get('/list', (req, res) => {
    res.json(guard(() => tokenMgr.list()));
  });

  // 新增 token
  router.post('/add', (req, res) => {
    res.json(guard(() => tokenMgr.add(req.body)));
  });

  // 更新 token
  router.put('/edit', (req, res) => {
    res.json(guard(() => tokenMgr.update(req.body.id, req.body)));
  });

  // 删除 token
  router.delete('/remove', (req, res) => {
    res.json(guard(() => tokenMgr.remove(req.body.id)));
  });

  // 设为默认 Token
  router.put('/default', (req, res) => {
    res.json(guard(() => tokenMgr.setDefault(req.body.id)));
  });

  return router;
}

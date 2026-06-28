/**
 * routes/token.js — GitHub Token CRUD REST API
 */

import { Router } from 'express';

/**
 * @param {import('@codewhale/core').TokenManager} tokenMgr
 * @returns {import('express').Router}
 */
export function createTokenRouter(tokenMgr) {
  const router = Router();

  // 列出所有 token
  router.get('/list', (req, res) => {
    res.json(tokenMgr.list());
  });

  // 新增 token
  router.post('/add', (req, res) => {
    res.json(tokenMgr.add(req.body));
  });

  // 更新 token
  router.put('/:id', (req, res) => {
    res.json(tokenMgr.update(req.params.id, req.body));
  });

  // 删除 token
  router.delete('/:id', (req, res) => {
    res.json(tokenMgr.remove(req.params.id));
  });

  // 设为默认 Token
  router.put('/:id/default', (req, res) => {
    res.json(tokenMgr.setDefault(req.params.id));
  });

  return router;
}
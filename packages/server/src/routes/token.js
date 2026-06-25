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
    const result = tokenMgr.add(req.body);
    res.json(result);
  });

  // 更新 token
  router.put('/:id', (req, res) => {
    const result = tokenMgr.update(req.params.id, req.body);
    res.json(result);
  });

  // 删除 token
  router.delete('/:id', (req, res) => {
    const result = tokenMgr.remove(req.params.id);
    res.json(result);
  });

  return router;
}
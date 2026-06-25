/**
 * routes/proxy.js — 代理配置 CRUD REST API
 */

import { Router } from 'express';
import { ProxyManager } from '@codewhale/core';

/**
 * @param {ProxyManager} proxyMgr
 * @returns {import('express').Router}
 */
export function createProxyRouter(proxyMgr) {
  const router = Router();

  // 列出所有代理
  router.get('/list', (req, res) => {
    res.json(proxyMgr.list());
  });

  // 新增代理
  router.post('/add', (req, res) => {
    const result = proxyMgr.add(req.body);
    res.json(result);
  });

  // 更新代理
  router.put('/:id', (req, res) => {
    const result = proxyMgr.update(req.params.id, req.body);
    res.json(result);
  });

  // 删除代理
  router.delete('/:id', (req, res) => {
    const result = proxyMgr.remove(req.params.id);
    res.json(result);
  });

  return router;
}
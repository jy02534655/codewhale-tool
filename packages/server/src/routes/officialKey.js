/**
 * @codewhale/server — 官方 API Key 路由
 *
 * 挂载路径: /api/official-key
 * 管理 DeepSeek 官方 API key 的增删改查与激活切换。
 */

import { Router } from 'express';
import { guard, getServerMessage } from '@codewhale/core';
import { ok, fail, langOf } from '../helpers.js';

/**
 * 创建官方 API Key 路由
 * @param {import('@codewhale/core').OfficialKeyManager} officialKeyMgr
 * @param {import('@codewhale/core').SyncManager} syncMgr
 * @returns {import('express').Router}
 */
export function createOfficialKeyRouter(officialKeyMgr, syncMgr) {
  const router = Router();

  /** 获取所有官方 key */
  router.get('/list', (_req, res) => {
    res.json(guard(() => ok(officialKeyMgr.list())));
  });

  /** 添加官方 key */
  router.post('/add', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = officialKeyMgr.add(req.body);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, r.message || getServerMessage(l, 'keyAdded')) : fail(r.message);
    }));
  });

  /** 更新 key 别名（前端通过 PUT /:id 调用） */
  router.put('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
      return r.success ? ok(null, getServerMessage(l, 'aliasUpdated')) : fail(r.message);
    }));
  });

  /** 激活指定 key（同步到 CodeWhale 配置） */
  router.post('/:id/activate', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = syncMgr.activateOfficialAndSync(req.params.id);
      return r.success ? ok(null, getServerMessage(l, 'keyActivated')) : fail(r.message);
    }));
  });

  /** 删除指定 key */
  router.delete('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = officialKeyMgr.remove(req.params.id);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'deleted')) : fail(r.message);
    }));
  });

  return router;
}
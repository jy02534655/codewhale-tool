/**
 * @codewhale/server — 同步路由
 *
 * 挂载路径: /api
 * 提供手动触发同步和初始化同步的端点。
 */

import { Router } from 'express';
import { guard, getServerMessage } from '@codewhale/core';
import { ok, fail, langOf } from '../helpers.js';

/**
 * 创建同步路由
 * @param {import('@codewhale/core').SyncManager} syncMgr
 * @returns {import('express').Router}
 */
export function createSyncRouter(syncMgr) {
  const router = Router();

  /** 手动触发将 store.json 同步到 CodeWhale 配置文件 */
  router.post('/sync', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'synced')) : fail(r.message);
    }));
  });

  /** 初始化同步（从 CodeWhale 配置加载到 store.json） */
  router.post('/init-sync', (req, res) => {
    res.json(guard(() => {
      const r = syncMgr.initSync();
      return r.success ? ok(null, r.message) : fail(r.message);
    }));
  });

  return router;
}
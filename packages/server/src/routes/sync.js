/**
 * @codewhale/server — 同步路由
 *
 * 挂载路径: /api
 * 提供手动触发同步和初始化同步的端点。
 * 语言由中间件自动提取并全局设置，路由层不再透传 lang。
 */

import { Router } from 'express';
import { guard } from '@codewhale/core';

/**
 * 创建同步路由
 * @param {import('@codewhale/core').SyncManager} syncMgr
 * @returns {import('express').Router}
 */
export function createSyncRouter(syncMgr) {
  const router = Router();

  /** 手动触发将 store.json 同步到 CodeWhale 配置文件 */
  router.post('/sync', (_req, res) => {
    res.json(guard(() => syncMgr.syncToCodeWhale()));
  });

  /** 初始化同步（从 CodeWhale 配置加载到 store.json） */
  router.post('/init-sync', (_req, res) => {
    res.json(guard(() => syncMgr.initSync()));
  });

  return router;
}
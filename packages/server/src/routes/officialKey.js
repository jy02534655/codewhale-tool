/**
 * @codewhale/server — 官方 API Key 路由
 *
 * 挂载路径: /api/official-key
 * 管理 DeepSeek 官方 API key 的增删改查与激活切换。
 * 语言由中间件自动提取并全局设置，路由层不再透传 lang。
 */

import { Router } from 'express';
import { guard } from '@codewhale/core';

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
    res.json(guard(() => ({
      success: true,
      data: officialKeyMgr.list(),
      message: '',
    })));
  });

  /** 添加官方 key */
  router.post('/add', (req, res) => {
    res.json(guard(() => {
      const r = officialKeyMgr.add(req.body);
      if (r.success) syncMgr.syncToCodeWhale();
      return r;
    }));
  });

  /** 更新 key 别名 */
  router.put('/:id', (req, res) => {
    res.json(guard(() => {
      const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
      return r;
    }));
  });

  /** 激活指定 key（同步到 CodeWhale 配置） */
  router.post('/:id/activate', (req, res) => {
    res.json(guard(() => {
      const r = syncMgr.activateOfficialAndSync(req.params.id);
      return r;
    }));
  });

  /** 删除指定 key */
  router.delete('/:id', (req, res) => {
    res.json(guard(() => {
      const r = officialKeyMgr.remove(req.params.id);
      if (r.success) syncMgr.syncToCodeWhale();
      return r;
    }));
  });

  return router;
}
/**
 * routes/settings.js — 通用设置 REST API
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';

/** @param {import('@codewhale/core').SettingsManager} settingsMgr */
export function createSettingsRouter(settingsMgr) {
  const router = Router();

  // 获取当前通用设置
  router.get('/', (req, res) => {
    res.json(guard(() => settingsMgr.list()));
  });

  // 获取通用设置默认值
  router.get('/defaults', (req, res) => {
    res.json(guard(() => settingsMgr.getDefaults()));
  });

  // 恢复默认设置
  router.post('/defaults', (req, res) => {
    res.json(guard(() => settingsMgr.restoreDefaults()));
  });

  // 更新通用设置
  router.put('/', (req, res) => {
    res.json(guard(() => settingsMgr.update(req.body)));
  });

  return router;
}

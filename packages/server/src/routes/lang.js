/**
 * @codewhale/server — 语言切换路由
 *
 * 挂载路径: /api/lang
 * 接收语言偏好（locale），持久化到 store.json 并同时设置运行时语言。
 */

import { Router } from 'express';
import { guard, ok } from '../utils/guard.js';
import { setLocale } from '@codewhale/core';

/**
 * @param {import('@codewhale/core').ConfigEngine} engine
 * @returns {import('express').Router}
 */
export function createLangRouter(engine) {
  const router = Router();

  router.post('/lang', (req, res) => {
    res.json(guard(() => {
      const { locale } = req.body;
      if (!locale) throw new Error('locale is required');
      engine.setLocale(locale);
      setLocale(locale);
      return ok(null);
    }));
  });

  return router;
}
/**
 * @codewhale/server — Express 全局中间件
 *
 * 注册在所有 API 路由之前的通用中间件。
 */

import { langOf } from './helpers.js';
import { setLocale } from '@codewhale/core';

/**
 * 全局禁用 API 缓存中间件
 * 为所有 /api 响应添加 no-store 头，确保数据实时性。
 */
export function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}

/**
 * 语言提取中间件
 * 自动从 query / body 提取目标语言，全局设置到 core 层。
 * 优先级：req.query.lang > req.body.lang > 'zh-Hans'
 */
export function langMiddleware(req, _res, next) {
  req.lang = langOf(req);
  setLocale(req.lang);
  next();
}
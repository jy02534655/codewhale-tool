/**
 * @codewhale/server — Express 全局中间件
 *
 * 注册在所有 API 路由之前的通用中间件。
 */

/**
 * 全局禁用 API 缓存中间件
 * 为所有 /api 响应添加 no-store 头，确保数据实时性。
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}
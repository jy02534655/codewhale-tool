/**
 * @codewhale/server — 响应辅助函数
 *
 * ok/fail 已统一移到 @codewhale/core 的 result.js，
 * server 层不再需要重复定义，直接透传 core 层返回值即可。
 * 本文件仅保留中间件使用的通用工具函数。
 */

/**
 * 从请求中提取目标语言
 * 优先级：query.lang > body.lang > 'zh-Hans'
 * @param {import('express').Request} req
 * @returns {string}
 */
export function langOf(req) {
  return req.query.lang || req.body?.lang || 'zh-Hans';
}
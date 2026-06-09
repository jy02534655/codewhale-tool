/**
 * @codewhale/server — 响应辅助函数
 *
 * 提供统一的 JSON 响应格式 { success, data, message } 和语言提取函数。
 */

/**
 * 成功响应
 * @param {any} data - 返回数据（可选，null 时自动设为 null）
 * @param {string} [message] - 成功消息
 * @returns {{ success: true, data: any, message: string }}
 */
export function ok(data, message) {
  return { success: true, data: data !== undefined ? data : null, message: message || '' };
}

/**
 * 失败响应
 * @param {string} message - 错误描述
 * @returns {{ success: false, data: null, message: string }}
 */
export function fail(message) {
  return { success: false, data: null, message };
}

/**
 * 从请求中提取目标语言
 * 优先级：query.lang > body.lang > 'zh-Hans'
 * @param {import('express').Request} req
 * @returns {string}
 */
export function langOf(req) {
  return req.query.lang || req.body?.lang || 'zh-Hans';
}
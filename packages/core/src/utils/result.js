/**
 * 统一的 try-catch 包装器与标准响应格式
 *
 * ok / okMsg / fail / failMsg 构建标准 { success, data, message } 格式。
 * okMsg / failMsg 自动从 i18n 获取多语言消息文本。
 *
 * @module result
 */

import { getServerMessage } from './i18n.js';

// ════════════════════════════════════════════════════════════════
// 标准响应格式
// ════════════════════════════════════════════════════════════════

/**
 * 构建标准成功响应
 * @param {any} data
 * @param {string} [message]
 * @returns {{ success: true, data: any, message: string }}
 */
export function ok(data, message) {
  return { success: true, data: data ?? null, message: message || '' };
}

/**
 * 构建标准失败响应
 * @param {string} message
 * @param {string} [errorCode]
 * @returns {{ success: false, data: null, message: string, errorCode?: string }}
 */
export function fail(message, errorCode) {
  return { success: false, data: null, message, ...(errorCode ? { errorCode } : {}) };
}

/**
 * 按消息 key 构建成功响应（自动翻译）
 *
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {any} [data] - 成功数据
 * @param {Object} [params] - 可选插值参数，如 { count: 3 }
 * @returns {{ success: true, data: any, message: string }}
 */
export function okMsg(key, data, params = {}) {
  const msg = getServerMessage(key, params);
  return ok(data ?? null, msg);
}

/**
 * 按消息 key 构建失败响应（自动翻译，errorCode = key）
 *
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {Object} [params] - 可选插值参数
 * @returns {{ success: false, data: null, message: string, errorCode: string }}
 */
export function failMsg(key, params = {}) {
  const msg = getServerMessage(key, params);
  return fail(msg, key);
}
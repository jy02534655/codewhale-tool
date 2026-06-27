/**
 * 统一的 try-catch 包装器
 *
 * 替代在各层中重复书写的 try-catch，返回标准格式 { success, data, message }。
 *
 * @module result
 */

/**
 * 包装同步函数，捕获异常并返回标准格式。
 *
 * @template T
 * @param {() => T} fn - 要执行的同步函数
 * @returns {{ success: true, data: T, message?: string } | { success: false, data: null, message: string }}
 *
 * @example
 * const result = guard(() => {
 *   const data = manager.list();
 *   return { success: true, data };
 * });
 */
export function guard(fn) {
  try {
    return fn();
  } catch (err) {
    return { success: false, data: null, message: err.message };
  }
}

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
 * 包装异步函数，捕获异常并返回标准格式。
 *
 * @template T
 * @param {() => Promise<T>} fn - 要执行的异步函数
 * @returns {Promise<{ success: true, data: T, message?: string } | { success: false, data: null, message: string }>}
 *
 * @example
 * const result = await guardAsync(async () => {
 *   return await someAsyncFunction();
 * });
 */
export async function guardAsync(fn) {
  try {
    return await fn();
  } catch (err) {
    return { success: false, data: null, message: err.message };
  }
}

// ════════════════════════════════════════════════════════════════
// 多语言快捷方法（组合 getServerMessage + ok / fail）
// ════════════════════════════════════════════════════════════════

import { getServerMessage } from './i18n.js';

/**
 * 按消息 key 构建成功响应（自动翻译）
 *
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {any} [data] - 成功数据
 * @param {Object} [params] - 可选插值参数，如 { count: 3 }
 * @returns {{ success: true, data: any, message: string }}
 *
 * @example
 * return okMsg('added');                          // { success: true, data: null, message: '已添加' }
 * return okMsg('SYNC_MERGED', { count: 3 }, { count: 3 });  // { success: true, data: { count: 3 }, message: '已同步 3 个...' }
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
 *
 * @example
 * return failMsg('KEY_NOT_FOUND');                // { success: false, data: null, message: 'API key 不存在', errorCode: 'KEY_NOT_FOUND' }
 */
export function failMsg(key, params = {}) {
  const msg = getServerMessage(key, params);
  return fail(msg, key);
}
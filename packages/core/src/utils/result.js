/**
 * 统一的 try-catch 包装器与标准响应格式
 *
 * ok / okMsg / fail / failMsg 构建标准 { success, data, message } 格式。
 * okMsg / failMsg 自动从 i18n 获取多语言消息文本。
 *
 * 这个模块的用途：
 * - 确保后端 API 返回的 JSON 格式完全一致
 * - 前端可以根据 success 字段判断请求是否成功
 * - 成功时 data 字段放返回数据，message 放成功提示
 * - 失败时 message 字段放错误信息，errorCode 放错误码
 *
 * @module result
 */

import { getServerMessage } from './i18n.js';

// ════════════════════════════════════════════════════════════════
// 标准响应格式
// ════════════════════════════════════════════════════════════════

/**
 * 构建标准成功响应
 *
 * 用于 API 成功时返回给前端的数据包。
 *
 * 返回结构示例：
 *   { success: true, data: {...}, message: "已添加" }
 *
 * @param {any} data 成功时返回的数据，通常是新增/修改后的条目
 * @param {string} [message] 成功提示文本，不传则为空字符串
 * @returns {{ success: true, data: any, message: string }}
 */
export function ok(data, message) {
  return { success: true, data: data ?? null, message: message || '' };
}

/**
 * 构建标准失败响应
 *
 * 用于 API 失败时返回给前端的数据包。
 *
 * 返回结构示例：
 *   { success: false, data: null, message: "供应商不存在", errorCode: "PROVIDER_NOT_FOUND" }
 *
 * @param {string} message 错误提示文本，会显示给用户
 * @param {string} [errorCode] 错误码，用于前端精确判断错误类型
 * @returns {{ success: false, data: null, message: string, errorCode?: string }}
 */
export function fail(message, errorCode) {
  return { success: false, data: null, message, ...(errorCode ? { errorCode } : {}) };
}

/**
 * 按消息 key 构建成功响应（自动翻译）
 *
 * 比 ok() 更方便：你只需要传一个消息 key，它会自动从 i18n 模块
 * 查找对应语言的文本，不用你手动拼接字符串。
 *
 * 返回结构示例：
 *   { success: true, data: {...}, message: "已添加" }
 *
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {any} [data] - 成功数据
 * @param {Object} [params={}] - 可选插值参数，如 { count: 3 }
 * @returns {{ success: true, data: any, message: string }}
 */
export function okMsg(key, data, params = {}) {
  const msg = getServerMessage(key, params);
  return ok(data ?? null, msg);
}

/**
 * 按消息 key 构建失败响应（自动翻译，errorCode = key）
 *
 * 比 fail() 更方便：你只需要传一个消息 key，它会自动从 i18n 模块
 * 查找对应语言的文本，并把 key 同时作为 errorCode 返回。
 *
 * 返回结构示例：
 *   { success: false, data: null, message: "供应商不存在", errorCode: "providerNotFound" }
 *
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {Object} [params] - 可选插值参数
 * @returns {{ success: false, data: null, message: string, errorCode: string }}
 */
export function failMsg(key, params = {}) {
  const msg = getServerMessage(key, params);
  return fail(msg, key);
}

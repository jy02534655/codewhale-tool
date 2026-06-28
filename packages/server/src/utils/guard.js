/**
 * Server 层工具 — try-catch 包装器与自动同步辅助
 *
 * server 路由层专用。core 层业务方法直接返回 { success, data, message } 格式，
 * 路由层通过 guard/guardAsync 统一捕获异常。
 *
 * @module guard
 */

import { ok as _ok } from '@codewhale/core';

/**
 * 包装同步函数，捕获异常并返回标准格式。
 *
 * @template T
 * @param {() => T} fn - 要执行的同步函数
 * @returns {{ success: true, data: T, message?: string } | { success: false, data: null, message: string }}
 */
export function guard(fn) {
  try {
    return fn();
  } catch (err) {
    return { success: false, data: null, message: err.message };
  }
}

/**
 * 包装异步函数，捕获异常并返回标准格式。
 *
 * @template T
 * @param {() => Promise<T>} fn - 要执行的异步函数
 * @returns {Promise<{ success: true, data: T, message?: string } | { success: false, data: null, message: string }>}
 */
export async function guardAsync(fn) {
  try {
    return await fn();
  } catch (err) {
    return { success: false, data: null, message: err.message };
  }
}

/**
 * 构建标准成功响应（从 core 透传，避免路由文件同时从两处导入）
 *
 * @param {any} data
 * @param {string} [message]
 * @returns {{ success: true, data: any, message: string }}
 */
export function ok(data, message) {
  return _ok(data, message);
}

/**
 * 执行函数并在成功时自动同步到 CodeWhale 配置
 *
 * 返回原始业务操作结果（而非同步结果），同步作为副作用执行。
 *
 * @param {import('@codewhale/core').SyncManager} syncMgr - 同步管理器实例
 * @param {() => any} fn - 要执行的业务函数
 * @returns {any} fn() 的原始返回值
 */
export function withSync(syncMgr, fn) {
  const r = fn();
  if (r.success) syncMgr.syncToCodeWhale();
  return r;
}
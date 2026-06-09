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
 * 包装异步函数，捕获异常并返回标准格式。
 *
 * @template T
 * @param {() => Promise<T>} fn - 要执行的异步函数
 * @returns {Promise<{ success: true, data: T, message?: string } | { success: false, data: null, message: string }>}
 *
 * @example
 * const result = await guardAsync(async () => {
 *   return await probeProvider(provider, key, url);
 * });
 */
export async function guardAsync(fn) {
  try {
    return await fn();
  } catch (err) {
    return { success: false, data: null, message: err.message };
  }
}
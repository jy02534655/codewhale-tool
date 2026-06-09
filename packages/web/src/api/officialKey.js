/**
 * 官方 API Key 相关 API
 *
 * 新增和编辑接口参数结构统一，API 层不做数据转换，直接透传 formData。
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/**
 * 获取所有官方 API Key 列表
 * @returns {Promise<{success: boolean, data: Array}>} 包含官方 key 列表的 Promise
 */
export function getOfficialKeyList() { return ajaxBack('/official-key/list'); }

/**
 * 新增官方 API Key
 * @param {Object} data - API Key 数据
 * @param {string} data.alias - 用户自定义别名
 * @param {string} data.api_key - 官方 API Key
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function addOfficialKey(data) {
  return ajaxPostBack('/official-key/add', data, { successMessage: 'added' });
}

/**
 * 编辑官方 API Key 的别名
 * @param {Object} data - API Key 数据
 * @param {string} data.id - API Key ID
 * @param {string} data.alias - 用户自定义别名
 * @param {string} data.api_key - 官方 API Key（保持不变）
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 * @description 与 addOfficialKey 参数结构一致，服务端仅使用 alias 字段
 */
export function editOfficialKey(data) {
  return ajaxPutBack('/official-key/' + data.id, data, { successMessage: 'aliasUpdated' });
}

/**
 * 激活指定的官方 API Key（设为当前使用的 key）
 * @param {string} id - API Key ID
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function activateOfficialKey(id) {
  return ajaxPostBack('/official-key/' + id + '/activate', {}, { successMessage: 'keyActivated' });
}

/**
 * 删除指定的官方 API Key
 * @param {string} id - API Key ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function removeOfficialKey(id) {
  return ajaxDeleteBack('/official-key/' + id, {}, { successMessage: 'deleted' });
}

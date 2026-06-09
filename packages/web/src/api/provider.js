/**
 * 供应商相关 API
 *
 * 新增和编辑接口参数结构统一，API 层不做数据转换，直接透传 formData。
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/**
 * 获取所有供应商列表
 * @returns {Promise<{success: boolean, data: Array}>} 包含供应商列表的 Promise
 */
export function getProviderList() { return ajaxBack('/provider/list'); }
export function getProviderActive() { return ajaxBack('/provider/active'); }
/**
 * 根据 ID 获取单个供应商信息
 * @param {string} id - 供应商 ID
 * @returns {Promise<{success: boolean, data: Object}>} 包含供应商信息的 Promise
 */
export function getProvider(id) { return ajaxBack('/provider/' + id); }

/**
 * 新增供应商
 * @param {Object} data - 供应商数据
 * @param {string} data.provider - 供应商类型（如 "siliconflow"）
 * @param {string} data.api_key - API 密钥
 * @param {string} data.label - 用户自定义标签
 * @param {string} [data.base_url] - 可选的 base URL
 * @param {Array} [data.models] - 模型列表
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function addProvider(data) {
  return ajaxPostBack('/provider/add', data, { successMessage: 'added' });
}

/**
 * 编辑供应商信息
 * @param {Object} data - 供应商数据
 * @param {string} data.id - 供应商 ID
 * @param {string} data.provider - 供应商类型（与原始一致，用于验证）
 * @param {string} data.api_key - API 密钥（可更新）
 * @param {string} data.label - 用户自定义标签
 * @param {string} [data.base_url] - 可选的 base URL
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 * @description 与 addProvider 参数结构一致，服务端仅使用 label / base_url 字段
 */
export function editProvider(data) {
  return ajaxPutBack('/provider/' + data.id, data, { successMessage: 'updated' });
}

/**
 * 删除供应商
 * @param {string} id - 供应商 ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function removeProvider(id) {
  return ajaxDeleteBack('/provider/' + id, {}, { successMessage: 'deleted' });
}
/**
 * 激活指定供应商（设置该供应商为当前激活状态）
 * @param {string} id - 供应商 ID
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function activateProvider(id) {
  return ajaxPostBack('/provider/' + id + '/activate', {}, { successMessage: 'activated' });
}
/**
 * 取消激活所有供应商（全局取消激活状态）
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function deactivateProvider() {
  return ajaxPostBack('/provider/deactivate', {}, { successMessage: 'deactivated' });
}
/**
 * 测试供应商 API 连通性
 * @param {Object} data - 测试参数
 * @param {string} data.provider - 供应商类型
 * @param {string} data.api_key - API 密钥
 * @param {string} [data.base_url] - 可选的 base URL
 * @returns {Promise<{success: boolean, message?: string, data?: {latency?: number}}>} 测试结果 Promise
 */
export function probeProvider(data) { return ajaxPostBack('/provider/probe', data); }

// ─── 模型 ──

/**
 * 为供应商添加模型
 * @param {string} id - 供应商 ID
 * @param {string} name - 模型名称
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function addModel(id, name) {
  return ajaxPostBack('/provider/models/add', { id, name }, { successMessage: 'modelAdded' });
}
/**
 * 删除供应商下的指定模型
 * @param {string} id - 供应商 ID
 * @param {string} name - 模型名称
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function removeModel(id, name) {
  return ajaxPostBack('/provider/models/delete', { id, name }, { successMessage: 'modelDeleted' });
}
/**
 * 设置供应商下某个模型为激活状态
 * @param {string} id - 供应商 ID
 * @param {string} name - 模型名称
 * @returns {Promise<{success: boolean, message?: string, data?: Object}>} 操作结果 Promise
 */
export function setActiveModel(id, name) {
  return ajaxPostBack('/provider/models/activate', { id, name }, { successMessage: 'modelSet' });
}

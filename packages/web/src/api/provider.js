/**
 * 供应商相关 API
 *
 * 新增和编辑接口参数结构统一，API 层不做数据转换，直接透传 formData。
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

export function getProviderList() { return ajaxBack('/provider/list'); }
export function getProviderActive() { return ajaxBack('/provider/active'); }
export function getProvider(id) { return ajaxBack('/provider/' + id); }

// 新增 — data: { provider, api_key, label, base_url, models }
export function addProvider(data) {
  return ajaxPostBack('/provider/add', data, { successMessage: 'added' });
}

// 编辑 — data: { id, provider, api_key, label, base_url }
// 与 addProvider 参数结构一致，服务端仅使用 label / base_url 字段
export function editProvider(data) {
  return ajaxPutBack('/provider/' + data.id, data, { successMessage: 'updated' });
}

export function removeProvider(id) {
  return ajaxDeleteBack('/provider/' + id, {}, { successMessage: 'deleted' });
}
export function activateProvider(id) {
  return ajaxPostBack('/provider/' + id + '/activate', {}, { successMessage: 'activated' });
}
export function deactivateProvider() {
  return ajaxPostBack('/provider/deactivate', {}, { successMessage: 'deactivated' });
}
export function probeProvider(data) { return ajaxPostBack('/provider/probe', data); }

// ─── 模型 ──

export function addModel(id, name) {
  return ajaxPostBack('/provider/models/add', { id, name }, { successMessage: 'modelAdded' });
}
export function removeModel(id, name) {
  return ajaxPostBack('/provider/models/delete', { id, name }, { successMessage: 'modelDeleted' });
}
export function setActiveModel(id, name) {
  return ajaxPostBack('/provider/models/activate', { id, name }, { successMessage: 'modelSet' });
}

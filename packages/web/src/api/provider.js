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

export function addProvider(data) {
  return ajaxPostBack('/provider/add', data, { successMessage: 'added' });
}

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

// ─── 模型 ──

export function addModel(data) {
  return ajaxPostBack('/provider/models/add', data, { successMessage: 'modelAdded' });
}
export function removeModel(data) {
  return ajaxPostBack('/provider/models/delete', data, { successMessage: 'modelDeleted' });
}
export function setActiveModel(data) {
  return ajaxPostBack('/provider/models/activate', data, { successMessage: 'modelSet' });
}
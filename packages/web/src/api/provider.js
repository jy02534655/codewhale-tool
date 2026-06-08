/**
 * 供应商相关 API
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

export function getProviderList() { return ajaxBack('/provider/list'); }
export function getProviderActive() { return ajaxBack('/provider/active'); }
export function getProvider(id) { return ajaxBack('/provider/' + id); }

export function addProvider(data) {
  return ajaxPostBack('/provider/add', data, { successMessage: 'added' });
}
export function updateProvider(id, data) {
  return ajaxPutBack('/provider/' + id, data, { successMessage: 'updated' });
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
// 供应商相关 API 接口
import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

// 获取供应商列表
export function getProviderList() { return ajaxBack('/provider/list'); }

// 获取当前激活的供应商和模型
export function getProviderActive() { return ajaxBack('/provider/active'); }

// 获取供应商详情
export function getProvider(id) { return ajaxBack('/provider/' + id); }

// 添加供应商
export function addProvider(data) {
  return ajaxPostBack('/provider/add', data, { successMessage: true });
}

// 更新供应商
export function editProvider(data) {
  return ajaxPutBack('/provider/' + data.id, data, { successMessage: true });
}

// 删除供应商
export function removeProvider(id) {
  return ajaxDeleteBack('/provider/' + id, {}, { successMessage: true });
}

// 激活供应商
export function activateProvider(id) {
  return ajaxPostBack('/provider/' + id + '/activate', {}, { successMessage: true });
}

// 停用第三方供应商
export function deactivateProvider() {
  return ajaxPostBack('/provider/deactivate', {}, { successMessage: true });
}

/**
 * 代理配置相关 API
 *
 * 每个代理有 id / alias / type / host / port / auth。
 * 列表返回时密码已掩码，内部查找时获取明文。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/** 获取所有代理列表 */
export function getProxyList() { return ajaxBack('/proxy/list'); }

/** 新增代理 */
export function addProxy(data) {
  return ajaxPostBack('/proxy/add', data, { successMessage: true });
}

/** 更新代理 */
export function editProxy(data) {
  return ajaxPutBack('/proxy/edit', data, { successMessage: true });
}

/** 删除代理 */
export function removeProxy(data) {
  return ajaxDeleteBack('/proxy/remove', data, { successMessage: true });
}

/** 设为默认代理 */
export function setDefaultProxy(data) {
  return ajaxPutBack('/proxy/default', data, { successMessage: true });
}

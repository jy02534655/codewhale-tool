/**
 * GitHub Token 配置相关 API
 *
 * 每个 Token 有 id / alias / token。
 * 列表返回时 Token 已掩码，内部查找时获取明文。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/** 获取所有 Token 列表 */
export function getTokenList() { return ajaxBack('/token/list'); }

/** 新增 Token */
export function addToken(data) {
  return ajaxPostBack('/token/add', data, { successMessage: true });
}

/** 更新 Token */
export function editToken(data) {
  return ajaxPutBack('/token/edit', data, { successMessage: true });
}

/** 删除 Token */
export function removeToken(data) {
  return ajaxDeleteBack('/token/remove', data, { successMessage: true });
}

/** 设为默认 Token */
export function setDefaultToken(data) {
  return ajaxPutBack('/token/default', data, { successMessage: true });
}

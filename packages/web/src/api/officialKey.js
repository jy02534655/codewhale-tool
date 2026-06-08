/**
 * 官方 API Key 相关 API
 *
 * 新增和编辑接口参数结构统一，API 层不做数据转换，直接透传 formData。
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

export function getOfficialKeyList() { return ajaxBack('/official-key/list'); }

// 新增 — data: { alias, api_key }
export function addOfficialKey(data) {
  return ajaxPostBack('/official-key/add', data, { successMessage: 'added' });
}

// 编辑 — data: { id, alias, api_key }
// 与 addOfficialKey 参数结构一致，服务端仅使用 alias 字段
export function editOfficialKey(data) {
  return ajaxPutBack('/official-key/' + data.id, data, { successMessage: 'aliasUpdated' });
}

export function activateOfficialKey(id) {
  return ajaxPostBack('/official-key/' + id + '/activate', {}, { successMessage: 'keyActivated' });
}

export function removeOfficialKey(id) {
  return ajaxDeleteBack('/official-key/' + id, {}, { successMessage: 'deleted' });
}

/**
 * 官方 API Key 相关 API
 * successMessage/errorMessage 传入消息 key，由 request 层按当前语言翻译
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

export function getOfficialKeyList() { return ajaxBack('/official-key/list'); }

export function addOfficialKey(data) {
  return ajaxPostBack('/official-key/add', data, { successMessage: 'added' });
}
export function activateOfficialKey(id) {
  return ajaxPostBack('/official-key/' + id + '/activate', {}, { successMessage: 'keyActivated' });
}
export function updateOfficialKeyAlias(id, alias) {
  return ajaxPutBack('/official-key/' + id + '/alias', { alias }, { successMessage: 'aliasUpdated' });
}
export function removeOfficialKey(id) {
  return ajaxDeleteBack('/official-key/' + id, {}, { successMessage: 'deleted' });
}
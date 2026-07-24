/**
 * 通用设置相关 API
 *
 */

import { ajaxBack, ajaxPutBack, ajaxPostBack } from '@/utils/request';

/** 获取通用设置 */
export function getSettings() {
  return ajaxBack('/settings');
}

/** 获取默认配置 */
export function getSettingsDefaults() {
  return ajaxBack('/settings/defaults');
}

/** 恢复默认配置 */
export function postSettingsDefaults() {
  return ajaxPostBack('/settings/defaults');
}

/** 更新通用设置 */
export function updateSettings(data) {
  return ajaxPutBack('/settings', data, { successMessage: true });
}

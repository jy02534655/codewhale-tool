/**
 * 通用设置相关 API
 *
 * 提供语言、默认模型、instructions 等通用设置的读写能力。
 */

import { ajaxBack, ajaxPutBack } from '@/utils/request';

/** 获取通用设置 */
export function getSettings() {
  return ajaxBack('/settings');
}

/** 更新通用设置 */
export function updateSettings(data) {
  return ajaxPutBack('/settings', data, { successMessage: true });
}

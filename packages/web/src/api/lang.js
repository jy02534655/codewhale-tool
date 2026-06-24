/**
 * 语言偏好 API
 *
 * 前端切换语言时通知服务端持久化并生效。
 */

import { ajaxPost } from '@/utils/request';

export function setLang(locale) {
  return ajaxPost('/lang', { locale });
}
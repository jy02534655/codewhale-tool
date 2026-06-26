/**
 * vue-i18n 实例
 *
 * 独立导出，供 main.js 和 request.js 共用。
 */

import { createI18n } from 'vue-i18n';
import zhMessages from './locales/zh-Hans.json';
import enMessages from './locales/en.json';
import jaMessages from './locales/ja.json';
import ptBrMessages from './locales/pt-BR.json';

const savedLocale = localStorage.getItem('codewhale-locale') || 'zh-Hans';

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-Hans',
  messages: {
    'zh-Hans': zhMessages,
    'en': enMessages,
    'ja': jaMessages,
    'pt-BR': ptBrMessages,
  },
});

/** 全局翻译函数，供非组件代码使用 */
export function t(key) {
  return i18n.global.t(key);
}
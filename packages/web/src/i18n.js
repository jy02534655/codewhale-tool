import { createI18n } from 'vue-i18n';

// vue-i18n 实例，供 main.js 和 request.js 共用
// 动态合并公共 locales 与 views/*/i18n 模块化翻译
const commonLocales = import.meta.glob('./locales/*.json', { eager: true });
const moduleLocales = import.meta.glob('./views/*/i18n/*.json', { eager: true });

const savedLocale = localStorage.getItem('codewhale-locale') || 'zh-Hans';

function buildMessages() {
  const messages = {};

  for (const [path, mod] of Object.entries(commonLocales)) {
    const locale = path.match(/\/([^/]+)\.json$/)?.[1];
    if (locale && mod.default) {
      messages[locale] = { ...(messages[locale] || {}), ...mod.default };
    }
  }

  for (const [path, mod] of Object.entries(moduleLocales)) {
    const locale = path.match(/\/([^/]+)\.json$/)?.[1];
    if (locale && mod.default) {
      messages[locale] = { ...(messages[locale] || {}), ...mod.default };
    }
  }

  return messages;
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-Hans',
  messages: buildMessages(),
});

export function t(key) {
  return i18n.global.t(key);
}

export function setLocale(locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem('codewhale-locale', locale);
}

import { createI18n } from 'vue-i18n';

// vue-i18n 实例，供 main.js 和 request.js 共用
// 动态合并公共 locales 与 views/*/i18n 模块化翻译
const commonLocales = import.meta.glob('./locales/*.json', { eager: true });
const moduleLocales = import.meta.glob('./views/*/i18n/**/*.json', { eager: true });

const savedLocale = localStorage.getItem('codewhale-locale') || 'zh-Hans';

// 深层合并对象，用于合并拆分后的 i18n 文件
const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') target = {};

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      target[key] = sourceValue;
    } else if (sourceValue && typeof sourceValue === 'object' && sourceValue !== null) {
      target[key] = deepMerge(targetValue, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
};

const buildMessages = () => {
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
      messages[locale] = deepMerge(messages[locale] || {}, mod.default);
    }
  }

  return messages;
};

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

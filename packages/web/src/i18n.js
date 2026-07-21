import { createI18n } from 'vue-i18n';

// vue-i18n 实例，供 main.js 和 request.js 共用
// 动态合并公共 locales 与 views/*/i18n 模块化翻译
const commonLocales = import.meta.glob('./locales/*.json', { eager: true });
const moduleLocales = import.meta.glob('./views/*/i18n/**/*.json', { eager: true });

const savedLocale = localStorage.getItem('codewhale-locale') || 'zh-Hans';

// 深层合并对象，用于合并拆分后的 i18n 文件
function deepMerge(target, source) {
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
}

// 将平铺的点分隔 key 展开为嵌套对象，兼容拆分后的 i18n JSON
// 例: { "settings": { "capacity.enabled": { "label": "..." }, "capacity": "容量控制" } }
//   => { "settings": { "capacity": { "_title": "容量控制", "enabled": { "label": "..." } } } }
function expandFlatKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = {};
  const flatEntries = [];

  // 先处理非平铺 key，确保标题等字符串值先进入 result
  for (const [key, value] of Object.entries(obj)) {
    if (!key.includes('.')) {
      result[key] = expandFlatKeys(value);
    } else {
      flatEntries.push([key, value]);
    }
  }

  // 再处理平铺 key，若前缀已被字符串占用，则将其作为 _title 移入嵌套对象
  for (const [key, value] of flatEntries) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      } else if (typeof current[parts[i]] === 'string') {
        current[parts[i]] = { _title: current[parts[i]] };
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = expandFlatKeys(value);
  }

  return result;
}

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
      messages[locale] = deepMerge(messages[locale] || {}, expandFlatKeys(mod.default));
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

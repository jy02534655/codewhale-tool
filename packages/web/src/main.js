/**
 * Vue 3 应用入口
 *
 * 全局引入 Element Plus + 图标 + vue-i18n
 */

import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import enLoc from 'element-plus/dist/locale/en.mjs';
import jaLoc from 'element-plus/dist/locale/ja.mjs';
import ptBrLoc from 'element-plus/dist/locale/pt-br.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';

import zhMessages from './locales/zh-Hans.json';
import enMessages from './locales/en.json';
import jaMessages from './locales/ja.json';
import ptBrMessages from './locales/pt-BR.json';

// Element Plus 语言包映射
const elLocales = {
  'zh-Hans': zhCn,
  'en':      enLoc,
  'ja':      jaLoc,
  'pt-BR':   ptBrLoc,
};

// 从 localStorage 恢复语言偏好
const savedLocale = localStorage.getItem('codewhale-locale') || 'zh-Hans';

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-Hans',
  messages: {
    'zh-Hans': zhMessages,
    'en':      enMessages,
    'ja':      jaMessages,
    'pt-BR':   ptBrMessages,
  },
});

const app = createApp(App);
app.use(i18n);
app.use(ElementPlus, { locale: elLocales[savedLocale] || zhCn });

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
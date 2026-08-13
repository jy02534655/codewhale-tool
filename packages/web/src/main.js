/**
 * Vue 3 应用入口
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/common.scss';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import enLoc from 'element-plus/dist/locale/en.mjs';
import jaLoc from 'element-plus/dist/locale/ja.mjs';
import ptBrLoc from 'element-plus/dist/locale/pt-br.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { i18n } from './i18n';

const elLocales = {
  'zh-Hans': zhCn,
  'en': enLoc,
  'ja': jaLoc,
  'pt-BR': ptBrLoc,
};

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(ElementPlus, { locale: elLocales[i18n.global.locale.value] || zhCn });

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');

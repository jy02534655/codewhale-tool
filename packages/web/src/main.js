/**
 * Vue 3 应用入口
 * 
 * 全局引入 Element Plus + 图标 + 中文语言包
 */

import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';

const app = createApp(App);

// Element Plus 全局注册（中文语言包）
app.use(ElementPlus, { locale: zhCn });

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
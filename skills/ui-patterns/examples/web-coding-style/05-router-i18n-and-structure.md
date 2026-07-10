# Web 编码风格示例 — 路由、国际化与项目结构

本文件汇总 `packages/web` 的路由、国际化初始化、入口文件和项目结构约定。

---

## 1. 路由配置

```javascript
/**
 * Vue Router 配置
 *
 * 路由表支持后续扩展，当前包含 provider、skill、proxy 和 token 四个模块。
 */

import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/provider',
  },
  {
    path: '/provider',
    name: 'provider',
    component: () => import('@/views/provider/index.vue'),
    meta: { title: '模型管理' },
  },
  {
    path: '/skill',
    name: 'skill',
    component: () => import('@/views/skill/index.vue'),
    meta: { title: 'Skill 管理' },
  },
  {
    path: '/proxy',
    name: 'proxy',
    component: () => import('@/views/proxy/index.vue'),
    meta: { title: '代理管理' },
  },
  {
    path: '/token',
    name: 'token',
    component: () => import('@/views/token/index.vue'),
    meta: { title: 'Token 管理' },
  },
  {
    path: '/project',
    name: 'project',
    component: () => import('@/views/project/index.vue'),
    meta: { title: '项目管理' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
```

### 要点
- 路由文件统一放在 `router/index.js`。
- 使用 `createWebHashHistory`，无需服务器配置。
- 页面组件用懒加载 `() => import(...)`。
- `meta.title` 用于页面标题，可后续扩展。

---

## 2. 国际化初始化

```javascript
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
```

### 要点
- `i18n.js` 独立导出 `i18n` 实例和 `t()` 函数。
- `request.js` 中通过 `t('message.networkError')` 获取错误提示。
- `main.js` 中挂载 i18n，并同步 Element Plus locale。

---

## 3. 入口文件

```javascript
/**
 * Vue 3 应用入口
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/common.css';
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
```

### 要点
- 按插件注册顺序组织 import：Vue → Pinia → Router → i18n → Element Plus。
- Element Plus 图标全局注册，模板中直接 `<el-icon><Edit /></el-icon>` 使用。
- CSS 入口统一在 `main.js` 引入，不散落在组件中。

---

## 4. 项目结构约定

```
packages/web/src/
├── api/                    # 接口请求层，按路由前缀分组
│   ├── provider.js         # /api/provider/*
│   ├── proxy.js            # /api/proxy/*
│   ├── token.js            # /api/token/*
│   ├── skill/              # /api/skill/*
│   └── lang.js             # /api/lang
├── composition/            # 组合函数层
│   ├── dialog/             # 弹窗三层组合函数
│   │   ├── Base.js
│   │   ├── Form.js
│   │   └── Container.js
│   ├── view/               # 视图组合函数
│   └── layout/             # 布局组合函数
├── components/             # 通用组件
│   ├── file/
│   └── form/
├── locales/                # 语言包
│   ├── zh-Hans.json
│   ├── en.json
│   ├── ja.json
│   └── pt-BR.json
├── router/                 # 路由配置
│   └── index.js
├── stores/                 # Pinia 状态管理
│   ├── masking.js
│   └── share.js
├── styles/                 # 全局样式
│   └── common.css
├── utils/                  # 工具函数
│   ├── index.js
│   ├── Masking.js
│   ├── request.js
│   └── store/
├── views/                  # 页面级组件
│   ├── provider/
│   ├── proxy/
│   ├── skill/
│   ├── token/
│   └── project/
├── App.vue                 # 根组件（布局 + 导航）
├── i18n.js                 # vue-i18n 实例
└── main.js                 # 应用入口
```

### 要点
- `api/` 和 `views/` 按功能模块分组，模块名与路由 `name` 保持一致。
- `composition/` 是可复用逻辑层，与页面解耦。
- `utils/` 放纯函数工具，`utils/store/` 放 store 工具。
- `components/` 放跨页面通用组件，页面级组件放 `views/`。

---

## 5. CSS 约定

- 全局样式放 `styles/common.css`，组件级样式用 `<style scoped>`。
- CSS 变量定义在 `:root`，组件中通过 `var(--bg-secondary)` 引用。
- 布局类名语义化：`.app-shell`、`.top-bar`、`.sidebar`、`.content`。
- 避免行内 `style` 绑定，尽量用 CSS 类控制。

---

## 6. 在组件中使用国际化

```vue
<template>
  <el-button>{{ $t('common.save') }}</el-button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
ElMessage.success(t('provider.providerAdded'))
</script>
```

### 要点
- 模板中直接用 `$t('key')`。
- 脚本中用 `useI18n()` 获取 `t()`。
- `ElMessage` 等非模板场景也走 `t()`。

## 7. 语言切换

```javascript
const switchLang = async (locale) => {
  await ajaxPost('/api/lang', { locale })
  // 前端 i18n 同步切换 + Element Plus locale 联动
}
```

### 要点
- 语言切换通过 `/api/lang` POST 持久化。
- `App.vue` 中同步更新 `localStorage` 和 Element Plus locale。

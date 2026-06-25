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
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
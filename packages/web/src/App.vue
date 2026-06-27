<!--
  App.vue — 根组件（重构）
  布局：精简顶栏 + 左侧垂直导航 + 右侧内容区
  各页面内部使用 SplitLayout 实现左列表 + 右详情分栏
-->
<template>
  <el-config-provider :locale="elLocale">
    <div class="app-shell">

      <!-- ═══ 顶栏 ═══ -->
      <header class="top-bar">
        <div class="top-bar-left">
          <h1 class="logo">{{ $t('app.title') }}</h1>
        </div>
        <div class="top-bar-right">
          <el-select v-model="locale" size="small" style="width:120px" @change="onLocaleChange">
            <el-option v-for="l in locales" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
          <el-button :icon="isDark ? Sunny : Moon" circle size="small" @click="toggleTheme" />
        </div>
      </header>

      <!-- ═══ 主体 ═══ -->
      <div class="app-body">
        <!-- 侧边栏导航 -->
        <aside class="sidebar">
          <nav class="sidebar-nav">
            <router-link
              v-for="item in navItems"
              :key="item.route"
              :to="{ name: item.route }"
              class="nav-item"
              :class="{ active: route.name === item.route }"
            >
              <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
              <span class="nav-label">{{ $t(item.i18nKey) }}</span>
            </router-link>
          </nav>
        </aside>

        <!-- 内容区 -->
        <main class="content">
          <router-view />
        </main>
      </div>

    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Sunny, Moon,
  Monitor, Collection, Link, Key,
} from '@element-plus/icons-vue';

import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import enLoc from 'element-plus/dist/locale/en.mjs';
import jaLoc from 'element-plus/dist/locale/ja.mjs';
import ptBrLoc from 'element-plus/dist/locale/pt-br.mjs';

import { setLang } from '@/api/lang';

const elLocaleMap = { 'zh-Hans': zhCn, 'en': enLoc, 'ja': jaLoc, 'pt-BR': ptBrLoc };

const router = useRouter();
const route = useRoute();
const { locale } = useI18n({ useScope: 'global' });

const locales = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
];

const elLocale = computed(() => elLocaleMap[locale.value] || zhCn);

/** 导航项定义 */
const navItems = [
  { route: 'provider', icon: Monitor, i18nKey: 'app.model_management' },
  { route: 'skill',    icon: Collection, i18nKey: 'skill.title' },
  { route: 'proxy',    icon: Link, i18nKey: 'proxy.title' },
  { route: 'token',    icon: Key, i18nKey: 'token.title' },
];

function onLocaleChange(val) {
  localStorage.setItem('codewhale-locale', val);
  setLang(val);
}

const isDark = ref(false);

function toggleTheme() {
  const html = document.documentElement;
  const cur = html.getAttribute('data-theme') || 'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  html.classList.toggle('dark', next === 'dark');
  isDark.value = next === 'dark';
  localStorage.setItem('codewhale-theme', next);
}

onMounted(() => {
  const saved = localStorage.getItem('codewhale-theme') || 'light';
  const html = document.documentElement;
  html.setAttribute('data-theme', saved);
  html.classList.toggle('dark', saved === 'dark');
  isDark.value = saved === 'dark';
});
</script>

<style scoped>
/* ─── 外壳 ─── */
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ─── 顶栏 ─── */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.top-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* ─── 主体 ─── */
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─── 侧边栏 ─── */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  overflow-y: auto;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-primary);
  font-size: 14px;
  border-radius: 0;
  transition: background 0.15s;
  cursor: pointer;
  position: relative;
}
.nav-item:hover {
  background: var(--bg-tertiary);
}
.nav-item.active {
  background: var(--bg-primary);
  color: var(--accent);
  font-weight: 500;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.nav-label {
  white-space: nowrap;
}

/* ─── 内容区 ─── */
.content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}
</style>
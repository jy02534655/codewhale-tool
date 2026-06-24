<!--
  App.vue — 根组件
  header（语言/皮肤）+ 下方 tabs 导航 + router-view
-->
<template>
  <el-config-provider :locale="elLocale">
    <div class="app">
      <!-- 顶栏：logo + 语言 + 皮肤 -->
      <header class="app-header">
        <div class="header-left">
          <h1 class="logo">{{ $t('app.title') }}</h1>
          <span class="subtitle">{{ $t('app.subtitle') }}</span>
        </div>
        <div class="header-right">
          <el-select v-model="locale" size="small" style="width:120px" @change="onLocaleChange">
            <el-option v-for="l in locales" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
          <el-button :icon="isDark ? Sunny : Moon" circle size="small" @click="toggleTheme" />
        </div>
      </header>

      <!-- 导航 tabs -->
      <nav class="nav-bar">
        <el-tabs
          :model-value="activeTab"
          @update:model-value="onTabChange"
        >
          <el-tab-pane label="模型管理" name="provider" />
          <el-tab-pane label="Skill 管理" name="skill" />
        </el-tabs>
      </nav>

      <!-- 主内容区 -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Sunny, Moon } from '@element-plus/icons-vue';

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
  { value: 'en',      label: 'English' },
  { value: 'ja',      label: '日本語' },
  { value: 'pt-BR',   label: 'Português (BR)' },
];

const elLocale = computed(() => elLocaleMap[locale.value] || zhCn);

const activeTab = ref(route.name || 'provider');

watch(
  () => route.name,
  (val) => { activeTab.value = val || 'provider'; }
);

function onTabChange(val) {
  router.push({ name: val });
}

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
.app { min-height:100vh;display:flex;flex-direction:column; }

/* ── 顶栏 ── */
.app-header {
  display:flex;justify-content:space-between;align-items:center;
  padding:10px 24px;
  background:var(--bg-secondary);
  border-bottom:1px solid var(--border);
}
.header-left { display:flex;align-items:baseline;gap:12px; }
.logo { font-size:18px;font-weight:600;flex-shrink:0; }
.subtitle { color:var(--text-secondary);font-size:13px;flex-shrink:0; }
.header-right { display:flex;align-items:center;gap:12px;flex-shrink:0;margin-left:auto; }

/* ── 导航栏 ── */
.nav-bar {
  padding:0 24px;
  background:var(--bg-primary);
  border-bottom:1px solid var(--border);
}
.nav-bar :deep(.el-tabs__header) { margin-bottom:0; }
.nav-bar :deep(.el-tabs__nav-wrap::after) { display:none; }

/* ── 内容区 ── */
.content { flex:1;padding:20px 24px;max-width:1200px;width:100%;margin:0 auto; }
</style>

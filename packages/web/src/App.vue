<!--
  App.vue — 根组件
  语言切换 + 皮肤切换
-->
<template>
  <el-config-provider :locale="elLocale">
    <div class="app">
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

      <main class="content">
        <ProviderView />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Sunny, Moon } from '@element-plus/icons-vue';
import ProviderView from './views/ProviderView.vue';

import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import enLoc from 'element-plus/dist/locale/en.mjs';
import jaLoc from 'element-plus/dist/locale/ja.mjs';
import ptBrLoc from 'element-plus/dist/locale/pt-br.mjs';

const elLocaleMap = { 'zh-Hans': zhCn, 'en': enLoc, 'ja': jaLoc, 'pt-BR': ptBrLoc };

const { locale } = useI18n({ useScope: 'global' });

const locales = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en',      label: 'English' },
  { value: 'ja',      label: '日本語' },
  { value: 'pt-BR',   label: 'Português (BR)' },
];

const elLocale = computed(() => elLocaleMap[locale.value] || zhCn);

function onLocaleChange(val) {
  localStorage.setItem('codewhale-locale', val);
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
.app-header { display:flex;justify-content:space-between;align-items:center;padding:12px 24px;background:var(--bg-secondary);border-bottom:1px solid var(--border); }
.header-left { display:flex;align-items:baseline;gap:12px; }
.logo { font-size:18px;font-weight:600; }
.subtitle { color:var(--text-secondary);font-size:13px; }
.header-right { display:flex;align-items:center;gap:12px; }
.content { flex:1;padding:20px 24px;max-width:1200px;width:100%;margin:0 auto; }
</style>
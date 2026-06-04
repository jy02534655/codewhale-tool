<!--
  App.vue — 根组件
  顶部导航 + 标签页（Provider / Skill）+ 皮肤切换
-->
<template>
  <el-config-provider :locale="zhCn">
    <div class="app">
      <header class="app-header">
        <div class="header-left">
          <h1 class="logo">🐋 CodeWhale Tool</h1>
          <span class="subtitle">配置管理</span>
        </div>
        <div class="header-right">
          <span class="config-path" :title="configPath">{{ configPath || '（自动探测）' }}</span>
          <el-button
            :icon="isDark ? Sunny : Moon"
            circle
            size="small"
            @click="toggleTheme"
            :title="isDark ? '切换到普通模式' : '切换到暗黑模式'"
          />
        </div>
      </header>

      <!-- Skill 标签暂时屏蔽 -->
      <nav class="tabs" v-if="false">
        <button :class="['tab', { active: activeTab === 'provider' }]" @click="activeTab = 'provider'">模型管理</button>
        <button :class="['tab', { active: activeTab === 'skill' }]" @click="activeTab = 'skill'">Skill 管理</button>
      </nav>

      <main class="content">
        <ProviderView v-if="activeTab === 'provider'" />
        <SkillView v-if="activeTab === 'skill'" />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Sunny, Moon } from '@element-plus/icons-vue';
import ProviderView from './views/ProviderView.vue';
import SkillView from './views/SkillView.vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const activeTab = ref('provider');
const configPath = ref('');
const isDark = ref(false);

/** 皮肤切换 */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  if (next === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  isDark.value = next === 'dark';
  localStorage.setItem('codewhale-theme', next);
}

/** 初始化主题 */
onMounted(() => {
  const saved = localStorage.getItem('codewhale-theme') || 'light';
  const html = document.documentElement;
  html.setAttribute('data-theme', saved);
  if (saved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  isDark.value = saved === 'dark';
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.header-left { display: flex; align-items: baseline; gap: 12px; }
.logo { font-size: 18px; font-weight: 600; }
.subtitle { color: var(--text-secondary); font-size: 13px; }

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-path { color: var(--text-secondary); font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tabs {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
}

.tab {
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.tab:hover { color: var(--text-primary); }
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.content {
  flex: 1;
  padding: 20px 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
</style>
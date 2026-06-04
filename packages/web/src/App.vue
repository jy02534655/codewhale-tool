<!--
  App.vue — 根组件
  顶部导航 + 标签页（Provider / Skill）
-->
<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <h1 class="logo">🐋 CodeWhale Tool</h1>
        <span class="subtitle">配置管理</span>
      </div>
      <div class="header-right">
        <span class="config-path" :title="configPath">{{ configPath || '（自动探测）' }}</span>
      </div>
    </header>

    <nav class="tabs">
      <button
        :class="['tab', { active: activeTab === 'provider' }]"
        @click="activeTab = 'provider'"
      >
        Provider 管理
      </button>
      <button
        :class="['tab', { active: activeTab === 'skill' }]"
        @click="activeTab = 'skill'"
      >
        Skill 管理
      </button>
    </nav>

    <main class="content">
      <ProviderView v-if="activeTab === 'provider'" />
      <SkillView v-if="activeTab === 'skill'" />
    </main>

    <!-- 全局提示栏 -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProviderView from './views/ProviderView.vue';
import SkillView from './views/SkillView.vue';

const activeTab = ref('provider');
const configPath = ref('');
const toast = ref({ show: false, message: '', type: 'success' });

/** 全局 toast 提示（供子组件通过 provide/inject 调用） */
function showToast(message, type = 'success') {
  toast.value = { show: true, message, type };
  setTimeout(() => { toast.value.show = false; }, 3000);
}
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

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  z-index: 100;
  animation: slideIn 0.3s ease;
}

.toast.success { background: var(--success); color: #fff; }
.toast.error { background: var(--danger); color: #fff; }
.toast.warning { background: var(--warning); color: #000; }

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
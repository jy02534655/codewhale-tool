<!--
  SkillView.vue — Skill 管理页面
  显示已安装 skill 列表，支持安装、启用/禁用、删除、搜索社区
-->
<template>
  <div class="skill-view">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <h2>Skill 管理</h2>
      <div class="actions">
        <button class="btn btn-primary" @click="showInstall = true">+ 安装 Skill</button>
        <button class="btn" @click="refresh">刷新</button>
      </div>
    </div>

    <!-- 搜索社区 Skill -->
    <div class="search-bar">
      <input v-model="searchQuery" @keyup.enter="searchCommunity" placeholder="搜索社区 skill..." />
      <button class="btn" @click="searchCommunity">搜索</button>
    </div>

    <!-- 社区搜索结果 -->
    <div v-if="communityResults.length > 0" class="community-results">
      <h4>社区可用 Skill（{{ communityResults.length }} 个）</h4>
      <div class="community-grid">
        <div v-for="s in communityResults" :key="s.id" class="community-card">
          <span class="skill-id">{{ s.id }}</span>
          <span v-if="s.description" class="skill-desc">{{ s.description }}</span>
          <button
            :class="['btn btn-small', installedIds.includes(s.id) ? 'btn-disabled' : 'btn-primary']"
            :disabled="installedIds.includes(s.id)"
            @click="installSkill(s.id)"
          >
            {{ installedIds.includes(s.id) ? '已安装' : '安装' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 已安装列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="skills.length === 0" class="empty">
      <p>没有安装任何 Skill</p>
      <p class="hint">点击 "+ 安装 Skill" 或搜索社区 skill 来安装</p>
    </div>
    <div v-else class="skill-list">
      <div
        v-for="s in skills"
        :key="s.id"
        :class="['skill-card', { disabled: !s.enabled }]"
      >
        <div class="skill-header">
          <div class="skill-info">
            <span :class="['skill-status', s.enabled ? 'enabled' : '']">
              {{ s.enabled ? '✓' : '✗' }}
            </span>
            <span class="skill-id">{{ s.id }}</span>
            <span class="skill-source">{{ s.source }}</span>
            <span v-if="s.version" class="skill-version">v{{ s.version }}</span>
          </div>
          <div class="skill-actions">
            <button
              class="btn btn-small"
              @click="s.showDetail = !s.showDetail"
            >
              {{ s.showDetail ? '收起' : '详情' }}
            </button>
            <button
              v-if="s.enabled"
              class="btn btn-small"
              @click="disableSkill(s.id)"
            >
              禁用
            </button>
            <button
              v-else
              class="btn btn-small btn-primary"
              @click="enableSkill(s.id)"
            >
              启用
            </button>
            <button class="btn btn-small btn-danger" @click="removeSkill(s.id)">删除</button>
          </div>
        </div>

        <!-- 展开的详情（SKILL.md 内容） -->
        <div v-if="s.showDetail" class="skill-detail">
          <div v-if="s.readmeLoading" class="loading">加载详情中...</div>
          <pre v-else-if="s.readme">{{ s.readme }}</pre>
          <p v-else class="no-detail">（无详情）</p>
        </div>
      </div>
    </div>

    <!-- 安装 Skill 弹窗 -->
    <div v-if="showInstall" class="modal-overlay" @click.self="showInstall = false">
      <div class="modal">
        <h3>安装 Skill</h3>
        <label>Skill ID <input v-model="installForm.id" placeholder="如 pdf" /></label>
        <div class="modal-actions">
          <button class="btn" @click="showInstall = false">取消</button>
          <button class="btn btn-primary" @click="installSkill(installForm.id)">确认安装</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

// ─── 状态 ──────────────────────────────────────────────────────
const loading = ref(true);
const skills = ref([]);
const searchQuery = ref('');
const communityResults = ref([]);
const showInstall = ref(false);
const installForm = reactive({ id: '' });

/** 已安装的 skill ID 列表，用于社区搜索结果中标记"已安装" */
const installedIds = computed(() => skills.value.map((s) => s.id));

// ─── API 调用 ──────────────────────────────────────────────────

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

async function refresh() {
  loading.value = true;
  try {
    const res = await api('/skill/list');
    if (res.success) {
      skills.value = (res.skills || []).map((s) => ({
        ...s,
        showDetail: false,
        readme: null,
        readmeLoading: false,
      }));
    }
  } finally {
    loading.value = false;
  }
}

async function loadReadme(skill) {
  if (skill.readme || skill.readmeLoading) return;
  skill.readmeLoading = true;
  try {
    const res = await api(`/skill/show/${skill.id}`);
    if (res.success) {
      skill.readme = res.readme || '（无 SKILL.md）';
    }
  } finally {
    skill.readmeLoading = false;
  }
}

// 展开详情时加载
skills.value.forEach((s) => {
  // 通过 watch 方式在模板中触发
});

// 为提供 loadReadme 能力，包装 showDetail 切换
function toggleDetail(skill) {
  skill.showDetail = !skill.showDetail;
  if (skill.showDetail) loadReadme(skill);
}

async function installSkill(id) {
  const res = await api('/skill/install', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
  alert(res.message || (res.success ? '安装成功' : '安装失败'));
  if (res.success) {
    showInstall.value = false;
    installForm.id = '';
    refresh();
  }
}

async function enableSkill(id) {
  const res = await api(`/skill/enable/${id}`, { method: 'POST' });
  alert(res.message);
  refresh();
}

async function disableSkill(id) {
  const res = await api(`/skill/disable/${id}`, { method: 'POST' });
  alert(res.message);
  refresh();
}

async function removeSkill(id) {
  if (!confirm(`确认删除 skill "${id}"？（将同时删除磁盘文件）`)) return;
  const res = await api(`/skill/remove/${id}`, { method: 'DELETE' });
  alert(res.message);
  refresh();
}

async function searchCommunity() {
  communityResults.value = [];
  const res = await api(`/skill/search?q=${encodeURIComponent(searchQuery.value || '')}`);
  if (res.success) {
    communityResults.value = res.skills || [];
  } else {
    alert(res.message || '搜索失败');
  }
}

onMounted(refresh);
</script>

<style scoped>
.skill-view { display: flex; flex-direction: column; gap: 16px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 20px; }
.actions { display: flex; gap: 8px; }

.search-bar { display: flex; gap: 8px; }
.search-bar input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: 13px;
}
.search-bar input:focus { outline: none; border-color: var(--accent); }

.community-results { 
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.community-results h4 { font-size: 14px; margin-bottom: 10px; }
.community-grid { display: flex; flex-direction: column; gap: 8px; }
.community-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border-radius: var(--radius);
}
.skill-id { font-weight: 500; min-width: 140px; }
.skill-desc { flex: 1; color: var(--text-secondary); font-size: 12px; }

.loading, .empty { padding: 40px; text-align: center; color: var(--text-secondary); }
.empty .hint { font-size: 13px; margin-top: 8px; }

.skill-list { display: flex; flex-direction: column; gap: 8px; }

.skill-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.skill-card.disabled { opacity: 0.6; }

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}
.skill-info { display: flex; align-items: center; gap: 10px; }
.skill-status { color: var(--danger); font-weight: bold; }
.skill-status.enabled { color: var(--success); }
.skill-source { color: var(--text-secondary); font-size: 12px; padding: 1px 6px; background: var(--bg-tertiary); border-radius: 4px; }
.skill-version { color: var(--text-secondary); font-size: 12px; }
.skill-actions { display: flex; gap: 4px; }

.skill-detail {
  padding: 0 14px 14px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
  padding-top: 10px;
}
.skill-detail pre {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}
.no-detail { color: var(--text-secondary); font-size: 12px; padding: 8px 0; }

/* 按钮 */
.btn {
  padding: 6px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.btn:hover { background: var(--border); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.4; cursor: default; }
.btn-disabled { opacity: 0.4; cursor: default; }
.btn-danger { color: var(--danger); border-color: transparent; }
.btn-danger:hover { background: rgba(248, 81, 73, 0.15); }
.btn-small { padding: 3px 10px; font-size: 12px; }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  min-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal h3 { font-size: 16px; }
.modal label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-secondary); }
.modal input {
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: 13px;
}
.modal input:focus { outline: none; border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
</style>
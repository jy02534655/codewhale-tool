<!--
  ProviderView.vue — Provider 管理页面（卡片式多行多列布局）

  功能：
    - 预设 provider 下拉选择（基于 CodeWhale 官方列表）
    - 每张卡片展示一个 provider，内含 key 和模型标签
    - 添加 key 时支持 base_url、模型列表
    - 切换、删除、测试连通性
    - 无 API key 的 provider 不显示
-->
<template>
  <div class="provider-view">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <h2>Provider 管理</h2>
      <div class="actions">
        <button class="btn btn-primary" @click="showAddProvider = true">添加 Provider</button>
        <button class="btn" @click="refresh">刷新</button>
      </div>
    </div>

    <!-- 当前活动配置 -->
    <div v-if="active.provider || active.key || active.model" class="active-bar">
      <span class="label">当前活动：</span>
      <span class="value">{{ active.provider || '?' }}</span>
      <span class="sep">/</span>
      <span class="value">{{ active.key || '?' }}</span>
      <span class="sep">/</span>
      <span class="value">{{ active.model || '?' }}</span>
    </div>

    <!-- 加载 / 空态 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="providers.length === 0" class="empty">
      <p>没有配置任何 Provider，或所有 Provider 下均无 API Key</p>
      <p class="hint">点击「添加 Provider」开始配置</p>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="card-grid">
      <div
        v-for="p in providers"
        :key="p.name"
        :class="['provider-card', { 'card-active': active.provider === p.name }]"
      >
        <!-- 卡片头部：provider 名称 -->
        <div class="card-header">
          <div class="card-title">
            <span v-if="active.provider === p.name" class="star">★</span>
            <span class="provider-name">{{ p.name }}</span>
            <span class="provider-label">{{ p.label }}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-small" @click="openAddKey(p.name)">+ Key</button>
            <button class="btn btn-small btn-danger" @click="removeProvider(p.name)">删除</button>
          </div>
        </div>

        <!-- 卡片内容：每个 key 一行 -->
        <div class="card-body">
          <div
            v-for="(keyCfg, alias) in p.api_keys"
            :key="alias"
            :class="['key-row', { 'key-active': active.provider === p.name && active.key === alias }]"
          >
            <div class="key-info">
              <span v-if="active.provider === p.name && active.key === alias" class="star">★</span>
              <span class="key-alias">{{ alias }}</span>
              <span class="key-label">{{ keyCfg.label }}</span>
              <span v-if="keyCfg.base_url" class="key-base">{{ keyCfg.base_url }}</span>
              <span class="key-preview">{{ keyCfg.key_preview }}</span>
            </div>

            <!-- 模型标签 -->
            <div class="model-tags">
              <span
                v-for="model in keyCfg.models"
                :key="model"
                :class="['model-tag', { 'model-active': active.provider === p.name && active.key === alias && active.model === model }]"
                @click="switchModel(p.name, alias, model)"
              >
                {{ active.provider === p.name && active.key === alias && active.model === model ? '★ ' : '' }}{{ model }}
              </span>
              <span v-if="!keyCfg.models || keyCfg.models.length === 0" class="no-models">
                无模型（点击测试获取）
              </span>
            </div>

            <!-- key 操作按钮 -->
            <div class="key-actions">
              <button
                class="btn btn-small btn-primary"
                :disabled="active.provider === p.name && active.key === alias"
                @click="switchKey(p.name, alias)"
              >切换</button>
              <button class="btn btn-small" @click="probeKey(p.name, alias)">测试</button>
              <button class="btn btn-small btn-danger" @click="removeKey(p.name, alias)">删 Key</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============= 弹窗：添加 Provider ============= -->
    <div v-if="showAddProvider" class="modal-overlay" @click.self="showAddProvider = false">
      <div class="modal">
        <h3>添加 Provider</h3>
        <label>
          Provider 名称
          <select v-model="addProviderForm.name">
            <option value="" disabled>— 请选择 —</option>
            <option v-for="kp in knownProviders" :key="kp.id" :value="kp.id">
              {{ kp.id }} — {{ kp.label }}
            </option>
          </select>
        </label>
        <label>显示名称 <input v-model="addProviderForm.label" :placeholder="addProviderForm.name || '如 DeepSeek'" /></label>
        <div class="modal-actions">
          <button class="btn" @click="showAddProvider = false">取消</button>
          <button class="btn btn-primary" @click="addProvider" :disabled="!addProviderForm.name">确认添加</button>
        </div>
      </div>
    </div>

    <!-- ============= 弹窗：添加 API Key ============= -->
    <div v-if="showAddKey" class="modal-overlay" @click.self="showAddKey = false">
      <div class="modal">
        <h3>为 {{ addKeyForm.provider }} 添加 API Key</h3>
        <label>Key 别名 <input v-model="addKeyForm.alias" placeholder="如 personal / work" /></label>
        <label>API Key <input v-model="addKeyForm.key" type="password" placeholder="sk-..." /></label>
        <label>显示名称 <input v-model="addKeyForm.label" placeholder="如 个人账号" /></label>
        <label>Base URL（可选） <input v-model="addKeyForm.baseUrl" placeholder="如 https://api.example.com/v4" /></label>
        <label>模型列表 <input v-model="addKeyForm.models" placeholder="逗号分隔，如 V4-Pro,V4-Flash" /></label>
        <div class="modal-actions">
          <button class="btn" @click="showAddKey = false">取消</button>
          <button class="btn btn-primary" @click="addKey" :disabled="!addKeyForm.alias || !addKeyForm.key">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// ─── 预设 provider 列表 ──────────────────────────────────────
const knownProviders = [
  { id: 'deepseek',    label: 'DeepSeek' },
  { id: 'nvidia-nim',  label: 'NVIDIA NIM' },
  { id: 'atlascloud',  label: 'AtlasCloud' },
  { id: 'wanjie-ark',  label: 'Wanjie Ark' },
  { id: 'openrouter',  label: 'OpenRouter' },
  { id: 'xiaomi-mimo', label: 'Xiaomi MiMo' },
  { id: 'novita',      label: 'Novita' },
  { id: 'fireworks',   label: 'Fireworks' },
  { id: 'siliconflow', label: 'SiliconFlow' },
  { id: 'openai',      label: 'OpenAI 兼容端点' },
  { id: 'sglang',      label: 'SGLang (自托管)' },
  { id: 'vllm',        label: 'vLLM (自托管)' },
  { id: 'ollama',      label: 'Ollama (本地)' },
];

// ─── 状态 ────────────────────────────────────────────────────
const loading = ref(true);
const providers = ref([]);
const active = reactive({ provider: '', key: '', model: '' });

const showAddProvider = ref(false);
const addProviderForm = reactive({ name: '', label: '' });

const showAddKey = ref(false);
const addKeyForm = reactive({ provider: '', alias: '', key: '', label: '', baseUrl: '', models: '' });

// ─── API 封装 ────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// ─── 数据刷新 ────────────────────────────────────────────────
async function refresh() {
  loading.value = true;
  try {
    const [treeRes, activeRes] = await Promise.all([
      api('/provider/tree'),
      api('/provider/active'),
    ]);
    if (treeRes.success) {
      providers.value = Object.entries(treeRes.tree).map(([name, cfg]) => ({
        name,
        label: cfg.label || name,
        api_keys: cfg.api_keys || {},
      }));
    }
    if (activeRes.success) {
      Object.assign(active, activeRes.active);
    }
  } finally {
    loading.value = false;
  }
}

// ─── Provider 操作 ───────────────────────────────────────────
async function addProvider() {
  const res = await api('/provider/add', {
    method: 'POST',
    body: JSON.stringify({ name: addProviderForm.name, label: addProviderForm.label || addProviderForm.name }),
  });
  alert(res.message || (res.success ? '添加成功' : '添加失败'));
  if (res.success) {
    showAddProvider.value = false;
    addProviderForm.name = '';
    addProviderForm.label = '';
    refresh();
  }
}

async function removeProvider(name) {
  if (!confirm('确认删除 provider "' + name + '" 及其所有 API Key？')) return;
  const res = await api('/provider/remove/' + name, { method: 'DELETE' });
  alert(res.message);
  refresh();
}

// ─── Key 操作 ────────────────────────────────────────────────
function openAddKey(providerName) {
  addKeyForm.provider = providerName;
  addKeyForm.alias = '';
  addKeyForm.key = '';
  addKeyForm.label = '';
  addKeyForm.baseUrl = '';
  addKeyForm.models = '';
  showAddKey.value = true;
}

async function addKey() {
  const models = addKeyForm.models
    ? addKeyForm.models.split(',').map(function(s) { return s.trim(); }).filter(Boolean)
    : [];
  const res = await api('/provider/add-key', {
    method: 'POST',
    body: JSON.stringify({
      provider: addKeyForm.provider,
      alias: addKeyForm.alias,
      key: addKeyForm.key,
      label: addKeyForm.label,
      models: models,
      baseUrl: addKeyForm.baseUrl,
    }),
  });
  alert(res.message || (res.success ? '添加成功' : '添加失败'));
  if (res.success) {
    showAddKey.value = false;
    refresh();
  }
}

async function removeKey(providerName, alias) {
  if (!confirm('确认删除 "' + providerName + '" 下的 API Key "' + alias + '"？')) return;
  const res = await api('/provider/remove-key/' + providerName + '/' + alias, { method: 'DELETE' });
  alert(res.message);
  refresh();
}

async function switchKey(provider, key) {
  const res = await api('/provider/switch', {
    method: 'POST',
    body: JSON.stringify({ provider: provider, apiKey: key }),
  });
  if (res.success) {
    Object.assign(active, res.active);
    refresh();
  } else {
    alert(res.message);
  }
}

async function switchModel(provider, key, model) {
  const res = await api('/provider/switch', {
    method: 'POST',
    body: JSON.stringify({ provider: provider, apiKey: key, model: model }),
  });
  if (res.success) {
    Object.assign(active, res.active);
    refresh();
  } else {
    alert(res.message);
  }
}

async function probeKey(providerName, alias) {
  const res = await api('/provider/probe/' + providerName + '/' + alias);
  if (res.success) {
    alert('连通成功！延迟 ' + res.latency_ms + 'ms，可用模型 ' + res.models.length + ' 个');
    refresh();
  } else {
    alert('连通失败：' + res.error);
  }
}

onMounted(refresh);
</script>

<style scoped>
/* ─── 布局 ──────────────────────────────────────────────────── */
.provider-view { display: flex; flex-direction: column; gap: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 20px; }
.actions { display: flex; gap: 8px; }

.active-bar {
  padding: 8px 14px;
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: 6px;
  font-size: 13px;
}
.active-bar .label { color: var(--text-secondary, #8b949e); }
.active-bar .value { color: var(--accent, #58a6ff); font-weight: 500; }
.active-bar .sep { color: var(--text-secondary, #8b949e); margin: 0 4px; }

.loading, .empty { padding: 40px; text-align: center; color: var(--text-secondary, #8b949e); }
.empty .hint { font-size: 13px; margin-top: 8px; }

/* ─── 卡片网格 ──────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 14px;
}

.provider-card {
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.provider-card.card-active { border-color: var(--accent, #58a6ff); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: var(--bg-tertiary, #21262d);
  border-bottom: 1px solid var(--border, #30363d);
}
.card-title { display: flex; align-items: center; gap: 8px; }
.star { color: var(--accent, #58a6ff); font-weight: bold; }
.provider-name { font-weight: 600; font-size: 15px; }
.provider-label { color: var(--text-secondary, #8b949e); font-size: 12px; }
.card-actions { display: flex; gap: 4px; }

.card-body { padding: 8px 14px; display: flex; flex-direction: column; gap: 8px; }

/* ─── Key 行 ────────────────────────────────────────────────── */
.key-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: 6px;
}
.key-row.key-active { border-color: var(--accent, #58a6ff); }

.key-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 200px;
}
.key-alias { font-weight: 500; }
.key-label { color: var(--text-secondary, #8b949e); font-size: 11px; }
.key-base { color: var(--text-secondary, #8b949e); font-size: 10px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key-preview { color: var(--text-secondary, #8b949e); font-size: 11px; font-family: monospace; }

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
.model-tag {
  padding: 2px 8px;
  background: var(--bg-tertiary, #21262d);
  border: 1px solid var(--border, #30363d);
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.model-tag:hover { border-color: var(--accent-hover, #79c0ff); }
.model-tag.model-active {
  background: rgba(88, 166, 255, 0.15);
  border-color: var(--accent, #58a6ff);
  color: var(--accent, #58a6ff);
  font-weight: 500;
}
.no-models { color: var(--text-secondary, #8b949e); font-size: 11px; padding: 2px 0; }

.key-actions { display: flex; gap: 3px; margin-left: auto; }

/* ─── 按钮 ──────────────────────────────────────────────────── */
.btn {
  padding: 6px 14px;
  background: var(--bg-tertiary, #21262d);
  border: 1px solid var(--border, #30363d);
  border-radius: 6px;
  color: var(--text-primary, #e6edf3);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.btn:hover { background: var(--border, #30363d); }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn-primary { background: var(--accent, #58a6ff); border-color: var(--accent, #58a6ff); color: #fff; }
.btn-primary:hover { background: var(--accent-hover, #79c0ff); }
.btn-danger { color: var(--danger, #f85149); border-color: transparent; }
.btn-danger:hover { background: rgba(248, 81, 73, 0.15); }
.btn-small { padding: 3px 10px; font-size: 12px; }

/* ─── 弹窗 ──────────────────────────────────────────────────── */
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
  background: var(--bg-secondary, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: 8px;
  padding: 24px;
  min-width: 420px;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal h3 { font-size: 16px; }
.modal label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--text-secondary, #8b949e); }
.modal input, .modal select {
  padding: 8px 10px;
  background: var(--bg-primary, #0d1117);
  border: 1px solid var(--border, #30363d);
  border-radius: 6px;
  color: var(--text-primary, #e6edf3);
  font-size: 13px;
}
.modal input:focus, .modal select:focus { outline: none; border-color: var(--accent, #58a6ff); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
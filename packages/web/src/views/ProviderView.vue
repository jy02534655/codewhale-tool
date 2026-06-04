<!--
  ProviderView.vue — Provider 管理页面（Element Plus 卡片式布局）

  功能：
    - 预设 provider 下拉选择（基于 CodeWhale 官方列表）
    - 每张 el-card 展示一个 provider，内含 key 和模型标签
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
        <el-button type="primary" @click="showAddProvider = true">添加 Provider</el-button>
        <el-button @click="refresh">刷新</el-button>
      </div>
    </div>

    <!-- 当前活动配置 -->
    <div v-if="active.provider || active.key || active.model" class="active-bar">
      <span class="label">当前活动：</span>
      <el-tag size="small" type="primary">{{ active.provider }}</el-tag>
      <span class="sep">/</span>
      <el-tag size="small" type="success">{{ active.key }}</el-tag>
      <span class="sep">/</span>
      <el-tag size="small">{{ active.model }}</el-tag>
    </div>

    <!-- 加载 / 空态 -->
    <div v-if="loading" class="loading" v-loading="loading" element-loading-text="加载中..."></div>
    <el-empty v-else-if="providers.length === 0" description="没有配置任何 Provider，或所有 Provider 下均无 API Key">
      <template #extra>
        <el-button type="primary" @click="showAddProvider = true">添加 Provider</el-button>
      </template>
    </el-empty>

    <!-- 卡片网格 -->
    <div v-else class="card-grid">
      <el-card
        v-for="p in providers"
        :key="p.name"
        :class="['provider-card', { 'card-active': active.provider === p.name }]"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-tag v-if="active.provider === p.name" size="small" type="primary" effect="dark">当前</el-tag>
              <span class="provider-name">{{ p.name }}</span>
              <span class="provider-label">{{ p.label }}</span>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="openAddKey(p.name)">+ Key</el-button>
              <el-button size="small" type="danger" @click="removeProvider(p.name)">删除</el-button>
            </div>
          </div>
        </template>

        <!-- 卡片内容：每个 key 一行 -->
        <div class="card-body">
          <div
            v-for="(keyCfg, alias) in p.api_keys"
            :key="alias"
            :class="['key-row', { 'key-active': active.provider === p.name && active.key === alias }]"
          >
            <div class="key-info">
              <el-tag v-if="active.provider === p.name && active.key === alias" size="small" type="success" effect="dark">当前</el-tag>
              <span class="key-alias">{{ alias }}</span>
              <span class="key-label">{{ keyCfg.label }}</span>
              <span v-if="keyCfg.base_url" class="key-base">{{ keyCfg.base_url }}</span>
              <span class="key-preview">{{ keyCfg.key_preview }}</span>
            </div>

            <!-- 模型标签 -->
            <div class="model-tags">
              <el-tag
                v-for="model in keyCfg.models"
                :key="model"
                size="small"
                :type="active.provider === p.name && active.key === alias && active.model === model ? 'primary' : 'info'"
                :effect="active.provider === p.name && active.key === alias && active.model === model ? 'dark' : 'plain'"
                class="model-tag"
                @click="switchModel(p.name, alias, model)"
              >
                {{ model }}
              </el-tag>
              <span v-if="!keyCfg.models || keyCfg.models.length === 0" class="no-models">
                无模型（点击测试获取）
              </span>
            </div>

            <!-- key 操作按钮 -->
            <div class="key-actions">
              <el-button
                size="small"
                type="primary"
                :disabled="active.provider === p.name && active.key === alias"
                @click="switchKey(p.name, alias)"
              >切换</el-button>
              <el-button size="small" @click="probeKey(p.name, alias)">测试</el-button>
              <el-button size="small" type="danger" @click="removeKey(p.name, alias)">删 Key</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- ============= 弹窗：添加 Provider ============= -->
    <el-dialog v-model="showAddProvider" title="添加 Provider" width="420px">
      <el-form label-position="top">
        <el-form-item label="Provider 名称">
          <el-select v-model="addProviderForm.name" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="kp in knownProviders"
              :key="kp.id"
              :label="kp.id + ' — ' + kp.label"
              :value="kp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="addProviderForm.label" :placeholder="addProviderForm.name || '如 DeepSeek'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddProvider = false">取消</el-button>
        <el-button type="primary" @click="addProvider" :disabled="!addProviderForm.name">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- ============= 弹窗：添加 API Key ============= -->
    <el-dialog v-model="showAddKey" :title="'为 ' + addKeyForm.provider + ' 添加 API Key'" width="460px">
      <el-form label-position="top">
        <el-form-item label="Key 别名">
          <el-input v-model="addKeyForm.alias" placeholder="如 personal / work" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="addKeyForm.key" type="password" placeholder="sk-..." show-password />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="addKeyForm.label" placeholder="如 个人账号" />
        </el-form-item>
        <el-form-item label="Base URL（可选）">
          <el-input v-model="addKeyForm.baseUrl" placeholder="如 https://api.example.com/v4" />
        </el-form-item>
        <el-form-item label="模型列表">
          <el-input v-model="addKeyForm.models" placeholder="逗号分隔，如 V4-Pro,V4-Flash" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddKey = false">取消</el-button>
        <el-button type="primary" @click="addKey" :disabled="!addKeyForm.alias || !addKeyForm.key">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

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
  } catch (e) {
    ElMessage.error('加载失败：' + e.message);
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
  if (res.success) {
    ElMessage.success('添加成功');
    showAddProvider.value = false;
    addProviderForm.name = '';
    addProviderForm.label = '';
    refresh();
  } else {
    ElMessage.error(res.message || '添加失败');
  }
}

async function removeProvider(name) {
  try {
    await ElMessageBox.confirm(
      '确认删除 provider "' + name + '" 及其所有 API Key？',
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return; // 取消
  }
  const res = await api('/provider/remove/' + name, { method: 'DELETE' });
  if (res.success) {
    ElMessage.success('已删除 ' + name);
  } else {
    ElMessage.error(res.message);
  }
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
  if (res.success) {
    ElMessage.success('Key 添加成功');
    showAddKey.value = false;
    refresh();
  } else {
    ElMessage.error(res.message || '添加失败');
  }
}

async function removeKey(providerName, alias) {
  try {
    await ElMessageBox.confirm(
      '确认删除 "' + providerName + '" 下的 API Key "' + alias + '"？',
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }
  const res = await api('/provider/remove-key/' + providerName + '/' + alias, { method: 'DELETE' });
  if (res.success) {
    ElMessage.success('Key 已删除');
  } else {
    ElMessage.error(res.message);
  }
  refresh();
}

async function switchKey(provider, key) {
  const res = await api('/provider/switch', {
    method: 'POST',
    body: JSON.stringify({ provider: provider, apiKey: key }),
  });
  if (res.success) {
    Object.assign(active, res.active);
    ElMessage.success('已切换到 ' + provider + ' / ' + key);
    refresh();
  } else {
    ElMessage.error(res.message);
  }
}

async function switchModel(provider, key, model) {
  const res = await api('/provider/switch', {
    method: 'POST',
    body: JSON.stringify({ provider: provider, apiKey: key, model: model }),
  });
  if (res.success) {
    Object.assign(active, res.active);
    ElMessage.success('已切换到模型 ' + model);
    refresh();
  } else {
    ElMessage.error(res.message);
  }
}

async function probeKey(providerName, alias) {
  const res = await api('/provider/probe/' + providerName + '/' + alias);
  if (res.success) {
    ElMessage.success('连通成功！延迟 ' + res.latency_ms + 'ms，可用模型 ' + res.models.length + ' 个');
    refresh();
  } else {
    ElMessage.error('连通失败：' + res.error);
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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
}
.active-bar .label { color: var(--text-secondary); }
.active-bar .sep { color: var(--text-secondary); }

.loading {
  padding: 80px 0;
  min-height: 200px;
}

/* ─── 卡片网格 ──────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 14px;
}

.provider-card.card-active {
  border-color: var(--accent);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title { display: flex; align-items: center; gap: 8px; }
.provider-name { font-weight: 600; font-size: 15px; }
.provider-label { color: var(--text-secondary); font-size: 12px; }
.card-actions { display: flex; gap: 4px; }

.card-body { display: flex; flex-direction: column; gap: 8px; }

/* ─── Key 行 ────────────────────────────────────────────────── */
.key-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.key-row.key-active { border-color: var(--accent); }

.key-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 200px;
  flex-wrap: wrap;
}
.key-alias { font-weight: 500; }
.key-label { color: var(--text-secondary); font-size: 11px; }
.key-base { color: var(--text-secondary); font-size: 10px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key-preview { color: var(--text-secondary); font-size: 11px; font-family: monospace; }

.model-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
  align-items: center;
}
.model-tag { cursor: pointer; }
.no-models { color: var(--text-secondary); font-size: 11px; padding: 2px 0; }

.key-actions { display: flex; gap: 4px; margin-left: auto; }
</style>
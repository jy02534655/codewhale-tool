<!--
  ProviderView.vue — 模型管理页面

  两部分：
    1. DeepSeek 官方 API key（始终生效，可编辑）
    2. 第三方 provider 列表（开关控制），每个 provider 有 api_key / base_url / model

  数据流：
    - 加载时从 /api/model/config 获取配置
    - 同步到 CodeWhale 时调用 /api/model/sync
    - 从 CodeWhale 导入时调用 /api/model/import
-->
<template>
  <div class="model-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h2>模型管理</h2>
      <div class="actions">
        <el-button @click="importFromCW" :loading="syncing">从 CodeWhale 导入</el-button>
        <el-button type="primary" @click="syncToCW" :loading="syncing">同步到 CodeWhale</el-button>
      </div>
    </div>

    <!-- ========== 官方 DeepSeek 配置 ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">🔑 DeepSeek 官方 API</span>
          <el-tag size="small" type="success" effect="plain">始终生效</el-tag>
        </div>
      </template>
      <div class="official-row">
        <el-input
          v-model="officialApiKey"
          type="password"
          show-password
          placeholder="sk-..."
          style="max-width: 480px"
          clearable
        />
        <el-button type="primary" @click="saveOfficial" :loading="saving">保存</el-button>
      </div>
    </el-card>

    <!-- ========== 第三方模型 ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">🔌 第三方模型</span>
          <el-switch
            v-model="useThirdParty"
            active-text="启用"
            inactive-text="关闭"
            @change="onToggleThirdParty"
          />
        </div>
      </template>

      <!-- 关闭状态 -->
      <div v-if="!useThirdParty" class="hint-block">
        <el-icon style="margin-right: 6px"><InfoFilled /></el-icon>
        当前使用 DeepSeek 官方 API。开启后可接入第三方 provider。
      </div>

      <!-- 开启状态 -->
      <template v-else>
        <div class="toolbar-row">
          <el-button type="primary" @click="openAddDialog">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>添加 Provider
          </el-button>
        </div>

        <el-empty v-if="providers.length === 0" description="暂无第三方 provider" />

        <!-- Provider 卡片 -->
        <div v-else class="card-grid">
          <el-card
            v-for="p in providers"
            :key="p.name"
            :class="['provider-card', { 'card-active': activeProvider === p.name }]"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <el-tag v-if="activeProvider === p.name" size="small" type="primary" effect="dark">当前</el-tag>
                  <span class="provider-name">{{ p.label || p.name }}</span>
                  <span class="provider-id">{{ p.name }}</span>
                </div>
                <div class="card-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :disabled="activeProvider === p.name"
                    @click="switchProvider(p.name)"
                  >设为当前</el-button>
                  <el-button size="small" @click="openEditDialog(p.name)">编辑</el-button>
                  <el-button size="small" type="danger" @click="removeProvider(p.name)">删除</el-button>
                </div>
              </div>
            </template>

            <div class="provider-info">
              <div class="info-row">
                <span class="info-label">API Key</span>
                <el-tag size="small" type="info" effect="plain">{{ p.api_key_preview || '（未设置）' }}</el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">Base URL</span>
                <span class="info-value mono">{{ p.base_url || '（使用默认）' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">模型名称</span>
                <el-tag size="small">{{ p.model || '（未设置）' }}</el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </template>
    </el-card>

    <!-- ========== 添加 / 编辑 Provider 弹窗 ========== -->
    <el-dialog
      v-model="showDialog"
      :title="editingProvider ? '编辑 Provider' : '添加 Provider'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Provider 类型">
          <el-select
            v-model="dialogForm.name"
            placeholder="请选择"
            style="width: 100%"
            :disabled="!!editingProvider"
            filterable
          >
            <el-option
              v-for="kp in knownProviders"
              :key="kp.id"
              :label="kp.id + ' — ' + kp.label"
              :value="kp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="dialogForm.label" :placeholder="dialogForm.name || '如 SiliconFlow'" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="dialogForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="Base URL（可选）">
          <el-input v-model="dialogForm.base_url" placeholder="如 https://api.siliconflow.cn/v1" />
        </el-form-item>
        <el-form-item label="模型名称">
          <el-input v-model="dialogForm.model" placeholder="如 deepseek-ai/DeepSeek-V4-Pro" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="editingProvider ? saveEdit() : addProvider()"
          :disabled="!dialogForm.name"
          :loading="dialogSaving"
        >确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled, Plus } from '@element-plus/icons-vue';

// ─── 预设 Provider 列表 ──────────────────────────────────────
const knownProviders = [
  { id: 'deepseek',    label: 'DeepSeek' },
  { id: 'siliconflow', label: 'SiliconFlow（硅基流动）' },
  { id: 'nvidia-nim',  label: 'NVIDIA NIM' },
  { id: 'atlascloud',  label: 'AtlasCloud' },
  { id: 'wanjie-ark',  label: 'Wanjie Ark（万界方舟）' },
  { id: 'openrouter',  label: 'OpenRouter' },
  { id: 'xiaomi-mimo', label: 'Xiaomi MiMo' },
  { id: 'novita',      label: 'Novita' },
  { id: 'fireworks',   label: 'Fireworks' },
  { id: 'openai',      label: 'OpenAI / 兼容端点' },
  { id: 'sglang',      label: 'SGLang（自托管）' },
  { id: 'vllm',        label: 'vLLM（自托管）' },
  { id: 'ollama',      label: 'Ollama（本地）' },
  { id: 'moonshot',    label: 'Moonshot（月之暗面）' },
  { id: 'volcengine',  label: 'Volcengine（火山引擎）' },
  { id: 'arcee',       label: 'Arcee' },
];

// ─── 状态 ────────────────────────────────────────────────────
const loading = ref(true);
const saving = ref(false);
const syncing = ref(false);
const dialogSaving = ref(false);

const officialApiKey = ref('');
const useThirdParty = ref(false);
const activeProvider = ref('');
const providers = ref([]);

const showDialog = ref(false);
const editingProvider = ref(null);
const dialogForm = reactive({ name: '', label: '', api_key: '', base_url: '', model: '' });

// ─── API 封装 ────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// ─── 数据加载 ────────────────────────────────────────────────
async function loadConfig() {
  loading.value = true;
  try {
    const res = await api('/model/config');
    if (res.success) {
      officialApiKey.value = res.config.official_api_key || '';
      useThirdParty.value = res.config.use_third_party;
      activeProvider.value = res.config.active_provider || '';
      providers.value = res.providers || [];
    }
  } catch (e) {
    ElMessage.error('加载配置失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

// ─── 官方 API key ────────────────────────────────────────────
async function saveOfficial() {
  saving.value = true;
  try {
    const res = await api('/model/official', {
      method: 'POST',
      body: JSON.stringify({ api_key: officialApiKey.value }),
    });
    if (res.success) {
      ElMessage.success('官方 API key 已保存');
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    saving.value = false;
  }
}

// ─── 第三方开关 ──────────────────────────────────────────────
async function onToggleThirdParty(val) {
  if (val) {
    await api('/model/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: true, provider: activeProvider.value || '' }),
    });
  } else {
    await api('/model/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled: false }),
    });
    activeProvider.value = '';
  }
}

// ─── 切换激活 provider ───────────────────────────────────────
async function switchProvider(name) {
  const res = await api('/model/switch', {
    method: 'POST',
    body: JSON.stringify({ provider: name }),
  });
  if (res.success) {
    activeProvider.value = name;
    ElMessage.success('已切换到 ' + name);
  } else {
    ElMessage.error(res.message);
  }
}

// ─── 添加 Provider ───────────────────────────────────────────
function openAddDialog() {
  editingProvider.value = null;
  dialogForm.name = '';
  dialogForm.label = '';
  dialogForm.api_key = '';
  dialogForm.base_url = '';
  dialogForm.model = '';
  showDialog.value = true;
}

async function addProvider() {
  dialogSaving.value = true;
  try {
    const res = await api('/model/provider', {
      method: 'POST',
      body: JSON.stringify({
        name: dialogForm.name,
        label: dialogForm.label || dialogForm.name,
        api_key: dialogForm.api_key,
        base_url: dialogForm.base_url,
        model: dialogForm.model,
      }),
    });
    if (res.success) {
      ElMessage.success('Provider 已添加');
      showDialog.value = false;
      loadConfig();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    dialogSaving.value = false;
  }
}

// ─── 编辑 Provider ───────────────────────────────────────────
async function openEditDialog(name) {
  editingProvider.value = name;
  const res = await api('/model/provider/' + name);
  if (res.success && res.provider) {
    dialogForm.name = res.provider.name;
    dialogForm.label = res.provider.label || '';
    dialogForm.api_key = res.provider.api_key || '';
    dialogForm.base_url = res.provider.base_url || '';
    dialogForm.model = res.provider.model || '';
    showDialog.value = true;
  } else {
    ElMessage.error('获取 provider 信息失败');
  }
}

async function saveEdit() {
  dialogSaving.value = true;
  try {
    const res = await api('/model/provider/' + editingProvider.value, {
      method: 'PUT',
      body: JSON.stringify({
        label: dialogForm.label,
        api_key: dialogForm.api_key,
        base_url: dialogForm.base_url,
        model: dialogForm.model,
      }),
    });
    if (res.success) {
      ElMessage.success('已更新');
      showDialog.value = false;
      loadConfig();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    dialogSaving.value = false;
  }
}

// ─── 删除 Provider ───────────────────────────────────────────
async function removeProvider(name) {
  try {
    await ElMessageBox.confirm(
      '确认删除 provider "' + name + '"？',
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch { return; }

  const res = await api('/model/provider/' + name, { method: 'DELETE' });
  if (res.success) {
    ElMessage.success('已删除 ' + name);
    loadConfig();
  } else {
    ElMessage.error(res.message);
  }
}

// ─── 同步 / 导入 ─────────────────────────────────────────────
async function syncToCW() {
  syncing.value = true;
  try {
    const res = await api('/model/sync', { method: 'POST' });
    if (res.success) {
      ElMessage.success(res.message);
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    syncing.value = false;
  }
}

async function importFromCW() {
  syncing.value = true;
  try {
    const res = await api('/model/import', { method: 'POST' });
    if (res.success) {
      ElMessage.success(res.message);
      loadConfig();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    syncing.value = false;
  }
}

onMounted(loadConfig);
</script>

<style scoped>
.model-view { display: flex; flex-direction: column; gap: 16px; }

/* ─── 工具栏 ────────────────────────────────────────────────── */
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 20px; margin: 0; }
.actions { display: flex; gap: 8px; }

/* ─── 分区卡片 ──────────────────────────────────────────────── */
.section-card { margin-bottom: 4px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-title { font-weight: 600; font-size: 15px; }

/* ─── 官方配置 ──────────────────────────────────────────────── */
.official-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ─── 提示 ──────────────────────────────────────────────────── */
.hint-block {
  display: flex;
  align-items: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.toolbar-row { margin-bottom: 12px; }

/* ─── 卡片网格 ──────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 12px;
}

.provider-card.card-active { border-color: var(--accent); }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title { display: flex; align-items: center; gap: 8px; }
.provider-name { font-weight: 600; font-size: 15px; }
.provider-id { color: var(--text-secondary); font-size: 12px; font-family: monospace; }
.card-actions { display: flex; gap: 4px; }

/* ─── Provider 信息 ─────────────────────────────────────────── */
.provider-info { display: flex; flex-direction: column; gap: 8px; }

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.info-label {
  min-width: 72px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}
.info-value {
  font-size: 13px;
  word-break: break-all;
}
.info-value.mono {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
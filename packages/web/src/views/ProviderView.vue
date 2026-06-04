<!--
  ProviderView.vue — 模型管理页面

  数据流：
    - 启动时自动从 CodeWhale 同步（/api/init-sync 在服务端启动时完成）
    - 页面加载时通过 /api/provider/list 获取 provider 列表
    - 所有变更实时写回 CodeWhale 配置（无需手动同步按钮）
    - 关闭第三方模式时不隐藏数据，仅清除激活标记
-->
<template>
  <div class="model-view">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <h2>模型管理</h2>
      <div class="actions">
        <el-button @click="loadConfig" :loading="loading">刷新</el-button>
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
        <el-tag v-if="hasOfficialKey" size="small" type="success" effect="plain" style="margin-right:8px">
          已设置 ({{ officialKeyPreview }})
        </el-tag>
        <el-input
          v-model="officialApiKey"
          type="password"
          show-password
          :placeholder="hasOfficialKey ? '输入新 key 以覆盖...' : 'sk-...'"
          style="max-width: 420px"
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
          <div style="display:flex;align-items:center;gap:10px">
            <el-tag v-if="hasActiveProvider" size="small" type="warning" effect="plain">
              当前：{{ activeProviderId }}
            </el-tag>
            <el-button
              v-if="hasActiveProvider"
              size="small"
              type="info"
              @click="deactivateAll"
            >关闭第三方</el-button>
          </div>
        </div>
      </template>

      <!-- 提示信息 -->
      <div v-if="!hasActiveProvider" class="hint-block">
        <el-icon style="margin-right:6px"><InfoFilled /></el-icon>
        当前使用 DeepSeek 官方 API。点击下方 provider 的「激活」按钮可切换到第三方模型。
      </div>

      <div class="toolbar-row">
        <el-button type="primary" @click="openAddDialog">
          <el-icon style="margin-right:4px"><Plus /></el-icon>添加 Provider
        </el-button>
      </div>

      <el-empty v-if="providers.length === 0" description="暂无配置的 provider" />

      <!-- Provider 卡片 -->
      <div v-else class="card-grid">
        <el-card
          v-for="p in providers"
          :key="p.id"
          :class="['provider-card', { 'card-active': p.active }]"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-tag v-if="p.active" size="small" type="primary" effect="dark">当前</el-tag>
                <span class="provider-name">{{ p.label }}</span>
                <span class="provider-id">{{ p.provider }}</span>
              </div>
              <div class="card-actions">
                <el-button
                  size="small"
                  :type="p.active ? 'default' : 'primary'"
                  :disabled="p.active"
                  @click="activateProvider(p.id)"
                >激活</el-button>
                <el-button size="small" @click="openEditDialog(p.id)">编辑</el-button>
                <el-button size="small" type="danger" @click="removeProvider(p.id)">删除</el-button>
              </div>
            </div>
          </template>

          <!-- Provider 基础信息 -->
          <div class="provider-info">
            <div class="info-row">
              <span class="info-label">API Key</span>
              <el-tag size="small" type="info" effect="plain">{{ p.api_key_preview }}</el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">Base URL</span>
              <span class="info-value mono">{{ p.base_url || '（默认）' }}</span>
            </div>
          </div>

          <!-- 模型列表 -->
          <div class="model-section">
            <div class="model-header">
              <span class="model-title">模型列表</span>
              <el-button size="small" @click="openAddModelDialog(p)">+ 添加模型</el-button>
            </div>
            <div class="model-list">
              <div
                v-for="m in p.models"
                :key="m.name"
                :class="['model-item', { 'model-active': m.active }]"
              >
                <span class="model-name">{{ m.name }}</span>
                <div class="model-actions">
                  <el-button
                    v-if="!m.active"
                    size="small"
                    type="primary"
                    plain
                    @click="setActiveModel(p.id, m.name)"
                  >设为当前</el-button>
                  <el-tag v-else size="small" type="success" effect="dark">当前模型</el-tag>
                  <el-button
                    size="small"
                    type="danger"
                    :disabled="p.models.length <= 1"
                    @click="removeModel(p.id, m.name)"
                  >删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- ========== 添加 / 编辑 Provider 弹窗 ========== -->
    <el-dialog
      v-model="showDialog"
      :title="editingId ? '编辑 Provider' : '添加 Provider'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="Provider 类型">
          <el-select
            v-model="dialogForm.provider"
            placeholder="请选择"
            style="width:100%"
            :disabled="!!editingId"
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
          <el-input v-model="dialogForm.label" :placeholder="dialogForm.provider || '如 SiliconFlow'" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="dialogForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="Base URL（可选）">
          <el-input v-model="dialogForm.base_url" placeholder="如 https://api.siliconflow.cn/v1" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="初始模型（可选，逗号分隔多个）">
          <el-input v-model="dialogForm.modelsInput" placeholder="如 V4-Pro,V4-Flash（留空默认 V4-Pro）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="editingId ? saveEdit() : addProvider()"
          :disabled="!dialogForm.provider || !dialogForm.api_key"
          :loading="dialogSaving"
        >确认</el-button>
      </template>
    </el-dialog>

    <!-- ========== 添加模型弹窗 ========== -->
    <el-dialog
      v-model="showModelDialog"
      title="添加模型"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="模型名称">
          <el-input v-model="newModelName" placeholder="如 deepseek-ai/DeepSeek-V4-Flash" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showModelDialog = false">取消</el-button>
        <el-button type="primary" @click="addModel"
          :disabled="!newModelName.trim()"
          :loading="modelDialogSaving"
        >确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled, Plus } from '@element-plus/icons-vue';

// ─── 预设 Provider 列表 ──────────────────────────────────────
const knownProviders = [
  { id: 'siliconflow', label: 'SiliconFlow（硅基流动）' },
  { id: 'deepseek',    label: 'DeepSeek' },
  { id: 'openrouter',  label: 'OpenRouter' },
  { id: 'nvidia-nim',  label: 'NVIDIA NIM' },
  { id: 'atlascloud',  label: 'AtlasCloud' },
  { id: 'wanjie-ark',  label: 'Wanjie Ark（万界方舟）' },
  { id: 'xiaomi-mimo', label: 'Xiaomi MiMo' },
  { id: 'novita',      label: 'Novita' },
  { id: 'fireworks',   label: 'Fireworks' },
  { id: 'openai',      label: 'OpenAI / 兼容端点' },
  { id: 'sglang',      label: 'SGLang（自托管）' },
  { id: 'vllm',        label: 'vLLM（自托管）' },
  { id: 'ollama',      label: 'Ollama（本地）' },
];

// ─── 状态 ────────────────────────────────────────────────────
const loading = ref(false);
const saving = ref(false);
const dialogSaving = ref(false);
const modelDialogSaving = ref(false);

const officialApiKey = ref('');
const hasOfficialKey = ref(false);
const officialKeyPreview = ref('');
const providers = ref([]);

const showDialog = ref(false);
const editingId = ref(null);
const dialogForm = reactive({ provider: '', label: '', api_key: '', base_url: '', modelsInput: '' });

const showModelDialog = ref(false);
const addModelTargetId = ref('');
const newModelName = ref('');

// ─── 计算属性 ────────────────────────────────────────────────
const hasActiveProvider = computed(() => providers.value.some((p) => p.active));
const activeProviderId = computed(() => {
  const active = providers.value.find((p) => p.active);
  return active ? active.id : '';
});

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
    // 加载 provider 列表
    const provRes = await api('/provider/list');
    if (provRes.success) {
      providers.value = provRes.providers || [];
    }

    // 加载官方 API key
    const keyRes = await api('/official-key');
    if (keyRes.success) {
      hasOfficialKey.value = keyRes.has_key;
      officialKeyPreview.value = keyRes.api_key_preview || '';
      officialApiKey.value = ''; // 不回填完整 key，用户需要覆盖时重新输入
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
    const res = await api('/official-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: officialApiKey.value }),
    });
    if (res.success) {
      await loadConfig();
      ElMessage.success('官方 API key 已保存');
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    saving.value = false;
  }
}

// ─── Provider 激活 / 关闭 ────────────────────────────────────
async function activateProvider(id) {
  const res = await api('/provider/' + encodeURIComponent(id) + '/activate', { method: 'POST' });
  if (res.success) {
    await loadConfig();
    ElMessage.success('已激活 ' + id);
  } else {
    ElMessage.error(res.message);
  }
}

async function deactivateAll() {
  const res = await api('/provider/deactivate', { method: 'POST' });
  if (res.success) {
    await loadConfig();
    ElMessage.success('已切换回官方 API');
  } else {
    ElMessage.error(res.message);
  }
}

// ─── 模型管理 ────────────────────────────────────────────────
function openAddModelDialog(p) {
  addModelTargetId.value = p.id;
  newModelName.value = '';
  showModelDialog.value = true;
}

async function addModel() {
  modelDialogSaving.value = true;
  try {
    const res = await api('/provider/' + encodeURIComponent(addModelTargetId.value) + '/models', {
      method: 'POST',
      body: JSON.stringify({ name: newModelName.value.trim() }),
    });
    if (res.success) {
      showModelDialog.value = false;
      await loadConfig();
      ElMessage.success('模型已添加');
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    modelDialogSaving.value = false;
  }
}

async function removeModel(providerId, modelName) {
  try {
    await ElMessageBox.confirm(
      `确认删除模型 "${modelName}"？`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch { return; }

  const res = await api(
    '/provider/' + encodeURIComponent(providerId) + '/models/' + encodeURIComponent(modelName),
    { method: 'DELETE' }
  );
  if (res.success) {
    await loadConfig();
    ElMessage.success('模型已删除');
  } else {
    ElMessage.error(res.message);
  }
}

async function setActiveModel(providerId, modelName) {
  const res = await api(
    '/provider/' + encodeURIComponent(providerId) + '/models/' + encodeURIComponent(modelName) + '/activate',
    { method: 'PUT' }
  );
  if (res.success) {
    await loadConfig();
    ElMessage.success(`当前模型 → ${modelName}`);
  } else {
    ElMessage.error(res.message);
  }
}

// ─── Provider 增删改 ─────────────────────────────────────────
function openAddDialog() {
  editingId.value = null;
  dialogForm.provider = '';
  dialogForm.label = '';
  dialogForm.api_key = '';
  dialogForm.base_url = '';
  dialogForm.modelsInput = '';
  showDialog.value = true;
}

async function addProvider() {
  dialogSaving.value = true;
  try {
    const models = dialogForm.modelsInput
      ? dialogForm.modelsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const res = await api('/provider/add', {
      method: 'POST',
      body: JSON.stringify({
        provider: dialogForm.provider,
        api_key: dialogForm.api_key,
        label: dialogForm.label || dialogForm.provider,
        base_url: dialogForm.base_url || undefined,
        models,
      }),
    });
    if (res.success) {
      ElMessage.success(res.message);
      showDialog.value = false;
      await loadConfig();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    dialogSaving.value = false;
  }
}

async function openEditDialog(id) {
  editingId.value = id;
  const res = await api('/provider/' + encodeURIComponent(id));
  if (res.success && res.provider) {
    dialogForm.provider = res.provider.provider;
    dialogForm.label = res.provider.label || '';
    dialogForm.api_key = res.provider.api_key || '';
    dialogForm.base_url = res.provider.base_url || '';
    dialogForm.modelsInput = '';
    showDialog.value = true;
  } else {
    ElMessage.error('获取 provider 信息失败');
  }
}

async function saveEdit() {
  dialogSaving.value = true;
  try {
    const res = await api('/provider/' + encodeURIComponent(editingId.value), {
      method: 'PUT',
      body: JSON.stringify({
        label: dialogForm.label,
        base_url: dialogForm.base_url,
      }),
    });
    if (res.success) {
      ElMessage.success('已更新');
      showDialog.value = false;
      await loadConfig();
    } else {
      ElMessage.error(res.message);
    }
  } finally {
    dialogSaving.value = false;
  }
}

async function removeProvider(id) {
  try {
    await ElMessageBox.confirm(
      `确认删除 provider "${id}"？该操作不可恢复。`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch { return; }

  const res = await api('/provider/' + encodeURIComponent(id), { method: 'DELETE' });
  if (res.success) {
    ElMessage.success('已删除');
    await loadConfig();
  } else {
    ElMessage.error(res.message);
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
.official-row { display: flex; align-items: center; gap: 12px; }

/* ─── 提示 ──────────────────────────────────────────────────── */
.hint-block {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}
.toolbar-row { margin-bottom: 12px; }

/* ─── 卡片网格 ──────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
  gap: 12px;
}
.provider-card.card-active { border-color: var(--el-color-primary); border-width: 2px; }

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
.provider-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.info-row { display: flex; align-items: center; gap: 10px; }
.info-label {
  min-width: 72px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}
.info-value { font-size: 13px; word-break: break-all; }
.info-value.mono { font-family: monospace; font-size: 12px; color: var(--text-secondary); }

/* ─── 模型区域 ──────────────────────────────────────────────── */
.model-section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}
.model-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.model-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.model-list { display: flex; flex-direction: column; gap: 6px; }
.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
}
.model-item.model-active {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
}
.model-name { font-size: 13px; font-family: monospace; word-break: break-all; }
.model-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
</style>

<!--
  ProviderView.vue — 模型管理页面

  数据流：
    - 所有变更实时写回 CodeWhale 配置（无需手动同步）
    - 关闭第三方模式时不隐藏数据
-->
<template>
  <div class="model-view">
    <div class="toolbar">
      <h2>模型管理</h2>
      <el-button @click="loadConfig" :loading="loading">刷新</el-button>
    </div>

    <!-- ========== 官方 DeepSeek API key ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">🔑 DeepSeek 官方 API Key</span>
          <el-button size="small" @click="openAddOfficialDialog">+ 添加 Key</el-button>
        </div>
      </template>
      <el-empty v-if="officialKeys.length === 0" description="暂无官方 API key，点击添加" />
      <div v-else class="official-list">
        <div
          v-for="k in officialKeys"
          :key="k.id"
          :class="['official-item', { 'official-active': k.active }]"
        >
          <div class="official-info">
            <el-tag v-if="k.active" size="small" type="success" effect="dark">当前</el-tag>
            <span class="official-alias">{{ k.alias }}</span>
            <el-tag size="small" type="info" effect="plain">{{ k.api_key_preview }}</el-tag>
          </div>
          <div class="official-actions">
            <el-button
              v-if="!k.active"
              size="small"
              type="primary"
              @click="activateOfficial(k.id)"
            >激活</el-button>
            <el-button size="small" @click="openEditOfficialAlias(k)">别名</el-button>
            <el-button size="small" type="danger" @click="removeOfficial(k.id)">删除</el-button>
          </div>
        </div>
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
            <el-button v-if="hasActiveProvider" size="small" type="info" @click="deactivateAll">关闭第三方</el-button>
          </div>
        </div>
      </template>

      <div v-if="!hasActiveProvider" class="hint-block">
        <el-icon style="margin-right:6px"><InfoFilled /></el-icon>
        当前使用 DeepSeek 官方 API。点击下方 provider 的「激活」按钮可切换到第三方模型。
      </div>

      <div class="toolbar-row">
        <el-button type="primary" @click="openAddDialog">+ 添加 Provider</el-button>
      </div>

      <el-empty v-if="providers.length === 0" description="暂无配置的第三方 provider" />

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
                <el-button size="small" :type="p.active ? 'default' : 'primary'" :disabled="p.active" @click="activateProvider(p.id)">激活</el-button>
                <el-button size="small" @click="openEditDialog(p.id)">编辑</el-button>
                <el-button size="small" type="danger" @click="removeProvider(p.id)">删除</el-button>
              </div>
            </div>
          </template>
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
          <div class="model-section">
            <div class="model-header">
              <span class="model-title">模型列表</span>
              <el-button size="small" @click="openAddModelDialog(p)">+ 添加模型</el-button>
            </div>
            <div class="model-list">
              <div v-for="m in p.models" :key="m.name" :class="['model-item', { 'model-active': m.active }]">
                <span class="model-name">{{ m.name }}</span>
                <div class="model-actions">
                  <el-button v-if="!m.active" size="small" type="primary" plain @click="setActiveModel(p.id, m.name)">设为当前</el-button>
                  <el-tag v-else size="small" type="success" effect="dark">当前模型</el-tag>
                  <el-button size="small" type="danger" :disabled="p.models.length <= 1" @click="removeModel(p.id, m.name)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 添加/编辑 Provider 弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑 Provider' : '添加 Provider'" width="520px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="Provider 类型">
          <el-select v-model="dialogForm.provider" placeholder="请选择" style="width:100%" :disabled="!!editingId" filterable>
            <el-option v-for="kp in knownProviders" :key="kp.id" :label="kp.id + ' — ' + kp.label" :value="kp.id" />
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
        <el-form-item v-if="!editingId" label="初始模型（逗号分隔，留空默认 V4-Pro）">
          <el-input v-model="dialogForm.modelsInput" placeholder="V4-Pro,V4-Flash" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="editingId ? saveEdit() : addProvider()" :disabled="!dialogForm.provider || !dialogForm.api_key" :loading="dialogSaving">确认</el-button>
      </template>
    </el-dialog>

    <!-- 添加模型弹窗 -->
    <el-dialog v-model="showModelDialog" title="添加模型" width="400px" :close-on-click-modal="false">
      <el-input v-model="newModelName" placeholder="如 deepseek-ai/DeepSeek-V4-Flash" />
      <template #footer>
        <el-button @click="showModelDialog = false">取消</el-button>
        <el-button type="primary" @click="addModel" :disabled="!newModelName.trim()" :loading="modelDialogSaving">确认</el-button>
      </template>
    </el-dialog>

    <!-- 添加官方 key 弹窗 -->
    <el-dialog v-model="showOfficialDialog" title="添加官方 API Key" width="450px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="别名">
          <el-input v-model="officialForm.alias" placeholder="如 主账号、备用账号" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="officialForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOfficialDialog = false">取消</el-button>
        <el-button type="primary" @click="addOfficialKey" :disabled="!officialForm.api_key" :loading="officialSaving">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑别名弹窗 -->
    <el-dialog v-model="showAliasDialog" title="修改别名" width="350px" :close-on-click-modal="false">
      <el-input v-model="aliasForm.alias" placeholder="别名" />
      <template #footer>
        <el-button @click="showAliasDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAlias" :loading="aliasSaving">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';

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

const loading = ref(false);
const dialogSaving = ref(false);
const modelDialogSaving = ref(false);
const officialSaving = ref(false);
const aliasSaving = ref(false);

const officialKeys = ref([]);
const providers = ref([]);

const showDialog = ref(false);
const editingId = ref(null);
const dialogForm = reactive({ provider: '', label: '', api_key: '', base_url: '', modelsInput: '' });

const showModelDialog = ref(false);
const addModelTargetId = ref('');
const newModelName = ref('');

const showOfficialDialog = ref(false);
const officialForm = reactive({ alias: '', api_key: '' });

const showAliasDialog = ref(false);
const aliasForm = reactive({ id: '', alias: '' });

const hasActiveProvider = computed(() => providers.value.some((p) => p.active));
const activeProviderId = computed(() => {
  const a = providers.value.find((p) => p.active);
  return a ? a.id : '';
});

async function api(path, options = {}) {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  return r.json();
}

async function loadConfig() {
  loading.value = true;
  try {
    const [provRes, keyRes] = await Promise.all([
      api('/provider/list'),
      api('/official-key/list'),
    ]);
    if (provRes.success) providers.value = provRes.providers || [];
    if (keyRes.success) officialKeys.value = keyRes.keys || [];
  } catch (e) {
    ElMessage.error('加载失败：' + e.message);
  } finally {
    loading.value = false;
  }
}

// ─── 官方 key ────────────────────────────────────────────────
function openAddOfficialDialog() {
  officialForm.alias = '';
  officialForm.api_key = '';
  showOfficialDialog.value = true;
}
async function addOfficialKey() {
  officialSaving.value = true;
  try {
    const r = await api('/official-key/add', { method: 'POST', body: JSON.stringify({ alias: officialForm.alias || '默认', api_key: officialForm.api_key }) });
    if (r.success) { showOfficialDialog.value = false; await loadConfig(); ElMessage.success('已添加'); }
    else ElMessage.error(r.message);
  } finally { officialSaving.value = false; }
}
async function activateOfficial(id) {
  const r = await api('/official-key/' + encodeURIComponent(id) + '/activate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success('已激活'); }
  else ElMessage.error(r.message);
}
function openEditOfficialAlias(k) {
  aliasForm.id = k.id;
  aliasForm.alias = k.alias || '';
  showAliasDialog.value = true;
}
async function saveAlias() {
  aliasSaving.value = true;
  try {
    const r = await api('/official-key/' + encodeURIComponent(aliasForm.id) + '/alias', { method: 'PUT', body: JSON.stringify({ alias: aliasForm.alias }) });
    if (r.success) { showAliasDialog.value = false; await loadConfig(); ElMessage.success('别名已更新'); }
    else ElMessage.error(r.message);
  } finally { aliasSaving.value = false; }
}
async function removeOfficial(id) {
  try { await ElMessageBox.confirm('确认删除该 key？', '确认', { type: 'warning' }); } catch { return; }
  const r = await api('/official-key/' + encodeURIComponent(id), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success('已删除'); }
  else ElMessage.error(r.message);
}

// ─── 第三方 provider ──────────────────────────────────────────
function openAddDialog() { editingId.value = null; dialogForm.provider = ''; dialogForm.label = ''; dialogForm.api_key = ''; dialogForm.base_url = ''; dialogForm.modelsInput = ''; showDialog.value = true; }
async function addProvider() {
  dialogSaving.value = true;
  try {
    const models = dialogForm.modelsInput ? dialogForm.modelsInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const r = await api('/provider/add', { method: 'POST', body: JSON.stringify({ provider: dialogForm.provider, api_key: dialogForm.api_key, label: dialogForm.label || dialogForm.provider, base_url: dialogForm.base_url || undefined, models }) });
    if (r.success) { showDialog.value = false; await loadConfig(); ElMessage.success(r.message); }
    else ElMessage.error(r.message);
  } finally { dialogSaving.value = false; }
}
async function openEditDialog(id) {
  editingId.value = id;
  const r = await api('/provider/' + encodeURIComponent(id));
  if (r.success && r.provider) { dialogForm.provider = r.provider.provider; dialogForm.label = r.provider.label || ''; dialogForm.api_key = r.provider.api_key || ''; dialogForm.base_url = r.provider.base_url || ''; dialogForm.modelsInput = ''; showDialog.value = true; }
  else ElMessage.error('获取失败');
}
async function saveEdit() {
  dialogSaving.value = true;
  try {
    const r = await api('/provider/' + encodeURIComponent(editingId.value), { method: 'PUT', body: JSON.stringify({ label: dialogForm.label, base_url: dialogForm.base_url }) });
    if (r.success) { showDialog.value = false; await loadConfig(); ElMessage.success('已更新'); }
    else ElMessage.error(r.message);
  } finally { dialogSaving.value = false; }
}
async function removeProvider(id) {
  try { await ElMessageBox.confirm(`确认删除 provider "${id}"？`, '确认', { type: 'warning' }); } catch { return; }
  const r = await api('/provider/' + encodeURIComponent(id), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success('已删除'); }
  else ElMessage.error(r.message);
}
async function activateProvider(id) {
  const r = await api('/provider/' + encodeURIComponent(id) + '/activate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success('已激活'); }
  else ElMessage.error(r.message);
}
async function deactivateAll() {
  const r = await api('/provider/deactivate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success('已切换回官方 API'); }
  else ElMessage.error(r.message);
}

// ─── 模型管理 ────────────────────────────────────────────────
function openAddModelDialog(p) { addModelTargetId.value = p.id; newModelName.value = ''; showModelDialog.value = true; }
async function addModel() {
  modelDialogSaving.value = true;
  try {
    const r = await api('/provider/' + encodeURIComponent(addModelTargetId.value) + '/models', { method: 'POST', body: JSON.stringify({ name: newModelName.value.trim() }) });
    if (r.success) { showModelDialog.value = false; await loadConfig(); ElMessage.success('已添加'); }
    else ElMessage.error(r.message);
  } finally { modelDialogSaving.value = false; }
}
async function removeModel(pid, name) {
  try { await ElMessageBox.confirm(`确认删除 "${name}"？`, '确认', { type: 'warning' }); } catch { return; }
  const r = await api('/provider/' + encodeURIComponent(pid) + '/models/' + encodeURIComponent(name), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success('已删除'); }
  else ElMessage.error(r.message);
}
async function setActiveModel(pid, name) {
  const r = await api('/provider/' + encodeURIComponent(pid) + '/models/' + encodeURIComponent(name) + '/activate', { method: 'PUT' });
  if (r.success) { await loadConfig(); ElMessage.success(`当前模型 → ${name}`); }
  else ElMessage.error(r.message);
}

onMounted(loadConfig);
</script>

<style scoped>
.model-view { display:flex;flex-direction:column;gap:16px; }
.toolbar { display:flex;justify-content:space-between;align-items:center; }
.toolbar h2 { font-size:20px;margin:0; }

.section-card { margin-bottom:4px; }
.section-header { display:flex;justify-content:space-between;align-items:center; }
.section-title { font-weight:600;font-size:15px; }

.hint-block { display:flex;align-items:center;padding:16px;margin-bottom:12px;color:var(--text-secondary);font-size:13px;background:var(--bg-secondary);border-radius:var(--radius); }
.toolbar-row { margin-bottom:12px; }

/* 官方 key */
.official-list { display:flex;flex-direction:column;gap:8px; }
.official-item { display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-secondary);border-radius:8px; }
.official-item.official-active { border:1px solid var(--el-color-primary);background:var(--el-color-primary-light-9); }
.official-info { display:flex;align-items:center;gap:10px; }
.official-alias { font-weight:600;font-size:14px; }
.official-actions { display:flex;gap:6px; }

/* Provider 卡片 */
.card-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:12px; }
.provider-card.card-active { border-color:var(--el-color-primary);border-width:2px; }
.card-header { display:flex;justify-content:space-between;align-items:center; }
.card-title { display:flex;align-items:center;gap:8px; }
.provider-name { font-weight:600;font-size:15px; }
.provider-id { color:var(--text-secondary);font-size:12px;font-family:monospace; }
.card-actions { display:flex;gap:4px; }
.provider-info { display:flex;flex-direction:column;gap:8px;margin-bottom:14px; }
.info-row { display:flex;align-items:center;gap:10px; }
.info-label { min-width:72px;font-size:12px;color:var(--text-secondary);text-align:right; }
.info-value { font-size:13px;word-break:break-all; }
.info-value.mono { font-family:monospace;font-size:12px;color:var(--text-secondary); }

/* 模型 */
.model-section { border-top:1px solid var(--el-border-color-lighter);padding-top:12px; }
.model-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px; }
.model-title { font-size:13px;font-weight:600;color:var(--text-secondary); }
.model-list { display:flex;flex-direction:column;gap:6px; }
.model-item { display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg-secondary);border-radius:6px; }
.model-item.model-active { background:var(--el-color-primary-light-9);border:1px solid var(--el-color-primary-light-5); }
.model-name { font-size:13px;font-family:monospace;word-break:break-all;flex:1; }
.model-actions { display:flex;align-items:center;gap:6px;flex-shrink:0; }
</style>

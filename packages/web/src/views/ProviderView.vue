<!--
  ProviderView.vue — 模型管理页面
  
  特性：
    - 所有变更实时写回 CodeWhale 配置
    - 多语言支持 (zh-Hans / en / ja / pt-BR)
    - 供应商下拉仅显示多语言 label
    - 选择供应商后别名自动填充为 label
    - 激活状态显示：供应商 label + 别名
-->
<template>
  <div class="model-view">
    <div class="toolbar">
      <h2>{{ $t('app.model_management') }}</h2>
      <el-button @click="loadConfig" :loading="loading">{{ $t('common.refresh') }}</el-button>
    </div>

    <!-- ========== 官方 API Key ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">{{ $t('official.title') }}</span>
          <el-button size="small" @click="openAddOfficialDialog">{{ $t('official.add_key') }}</el-button>
        </div>
      </template>
      <el-empty v-if="officialKeys.length === 0" :description="$t('official.no_keys')" />
      <div v-else class="official-list">
        <div v-for="k in officialKeys" :key="k.id" :class="['official-item', { 'official-active': k.active }]">
          <div class="official-info">
            <el-tag v-if="k.active" size="small" type="success" effect="dark">{{ $t('official.current') }}</el-tag>
            <span class="official-alias">{{ k.alias }}</span>
            <el-tag size="small" type="info" effect="plain">{{ k.api_key_preview }}</el-tag>
          </div>
          <div class="official-actions">
            <el-button v-if="!k.active" size="small" type="primary" @click="activateOfficial(k.id)">{{ $t('official.activate') }}</el-button>
            <el-button size="small" @click="openEditOfficialAlias(k)">{{ $t('official.alias') }}</el-button>
            <el-button size="small" type="danger" @click="removeOfficial(k.id)">{{ $t('official.delete') }}</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ========== 第三方供应商 ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">{{ $t('third_party.title') }}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <el-tag v-if="hasActiveProvider" size="small" type="warning" effect="plain">
              {{ $t('third_party.current') }}：{{ activeProviderDisplay }}
            </el-tag>
            <el-button v-if="hasActiveProvider" size="small" type="info" @click="deactivateAll">{{ $t('third_party.deactivate') }}</el-button>
          </div>
        </div>
      </template>

      <div v-if="!hasActiveProvider" class="hint-block">
        <el-icon style="margin-right:6px"><InfoFilled /></el-icon>
        {{ $t('third_party.hint') }}
      </div>

      <div class="toolbar-row">
        <el-button type="primary" @click="openAddDialog">{{ $t('third_party.add_provider') }}</el-button>
      </div>

      <el-empty v-if="providers.length === 0" :description="$t('third_party.no_providers')" />

      <div v-else class="card-grid">
        <el-card v-for="p in providers" :key="p.id" :class="['provider-card', { 'card-active': p.active }]" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-tag v-if="p.active" size="small" type="primary" effect="dark">{{ $t('third_party.current') }}</el-tag>
                <span class="provider-name">{{ vendorLabel(p.provider) }}</span>
                <span class="provider-alias">{{ p.label }}</span>
              </div>
              <div class="card-actions">
                <el-button size="small" :type="p.active ? 'default' : 'primary'" :disabled="p.active" @click="activateProvider(p.id)">{{ $t('third_party.activate') }}</el-button>
                <el-button size="small" @click="openEditDialog(p.id)">{{ $t('third_party.edit') }}</el-button>
                <el-button size="small" type="danger" @click="removeProvider(p.id)">{{ $t('third_party.delete') }}</el-button>
              </div>
            </div>
          </template>
          <div class="provider-info">
            <div class="info-row">
              <span class="info-label">{{ $t('third_party.api_key') }}</span>
              <el-tag size="small" type="info" effect="plain">{{ p.api_key_preview }}</el-tag>
            </div>
            <div class="info-row">
              <span class="info-label">{{ $t('third_party.base_url') }}</span>
              <span class="info-value mono">{{ p.base_url || $t('third_party.default_placeholder') }}</span>
            </div>
          </div>
          <div class="model-section">
            <div class="model-header">
              <span class="model-title">{{ $t('third_party.models') }}</span>
              <el-button size="small" @click="openAddModelDialog(p)">{{ $t('third_party.add_model') }}</el-button>
            </div>
            <div class="model-list">
              <div v-for="m in p.models" :key="m.name" :class="['model-item', { 'model-active': m.active }]">
                <span class="model-name">{{ m.name }}</span>
                <div class="model-actions">
                  <el-button v-if="!m.active" size="small" type="primary" plain @click="setActiveModel(p.id, m.name)">{{ $t('third_party.set_current') }}</el-button>
                  <el-tag v-else size="small" type="success" effect="dark">{{ $t('third_party.current_model') }}</el-tag>
                  <el-button size="small" type="danger" :disabled="p.models.length <= 1" @click="removeModel(p.id, m.name)">{{ $t('third_party.delete_model') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 添加/编辑供应商弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? $t('third_party.edit_dialog_title') : $t('third_party.add_dialog_title')" width="520px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item :label="$t('third_party.provider_type')">
          <el-select v-model="dialogForm.provider" :placeholder="$t('third_party.select_placeholder')" style="width:100%" :disabled="!!editingId" filterable @change="onProviderSelect">
            <el-option v-for="v in vendorOptions" :key="v.id" :label="v.label" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('third_party.alias_label')">
          <el-input v-model="dialogForm.label" :placeholder="dialogForm.provider ? vendorLabel(dialogForm.provider) : ''" />
        </el-form-item>
        <el-form-item :label="$t('third_party.api_key_label')">
          <el-input v-model="dialogForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item :label="$t('third_party.base_url_label')">
          <el-input v-model="dialogForm.base_url" :placeholder="$t('third_party.base_url_placeholder')" />
        </el-form-item>
        <el-form-item v-if="!editingId" :label="$t('third_party.initial_models')">
          <el-input v-model="dialogForm.modelsInput" :placeholder="$t('third_party.models_placeholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">{{ $t('third_party.cancel') }}</el-button>
        <el-button type="primary" @click="editingId ? saveEdit() : addProvider()" :disabled="!dialogForm.provider || !dialogForm.api_key" :loading="dialogSaving">{{ $t('third_party.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加模型弹窗 -->
    <el-dialog v-model="showModelDialog" :title="$t('third_party.add_model_dialog_title')" width="400px" :close-on-click-modal="false">
      <el-input v-model="newModelName" :placeholder="$t('third_party.model_name_placeholder')" />
      <template #footer>
        <el-button @click="showModelDialog = false">{{ $t('third_party.cancel') }}</el-button>
        <el-button type="primary" @click="addModel" :disabled="!newModelName.trim()" :loading="modelDialogSaving">{{ $t('third_party.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加官方 key 弹窗 -->
    <el-dialog v-model="showOfficialDialog" :title="$t('official.add_dialog_title')" width="450px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item :label="$t('official.alias_label')">
          <el-input v-model="officialForm.alias" :placeholder="$t('official.alias_placeholder')" />
        </el-form-item>
        <el-form-item :label="$t('official.api_key_label')">
          <el-input v-model="officialForm.api_key" type="password" show-password placeholder="sk-..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOfficialDialog = false">{{ $t('official.cancel') }}</el-button>
        <el-button type="primary" @click="addOfficialKey" :disabled="!officialForm.api_key" :loading="officialSaving">{{ $t('official.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑别名弹窗 -->
    <el-dialog v-model="showAliasDialog" :title="$t('official.edit_alias_title')" width="350px" :close-on-click-modal="false">
      <el-input v-model="aliasForm.alias" :placeholder="$t('official.alias')" />
      <template #footer>
        <el-button @click="showAliasDialog = false">{{ $t('official.cancel') }}</el-button>
        <el-button type="primary" @click="saveAlias" :loading="aliasSaving">{{ $t('official.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import { getKnownProviders, getProviderI18nLabel } from '@codewhale/core/i18n';

const { locale } = useI18n({ useScope: 'global' });

// ─── 供应商选项（按当前语言动态计算）──
const vendorOptions = computed(() => getKnownProviders(locale.value));
const vendorLabel = (id) => getProviderI18nLabel(id, locale.value);

// ─── 状态 ──
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
const activeProviderDisplay = computed(() => {
  const a = providers.value.find((p) => p.active);
  return a ? vendorLabel(a.provider) + ' ' + a.label : '';
});

// ─── API 封装 ──
async function api(path, options = {}) {
  const r = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  return r.json();
}

// ─── 数据加载 ──
async function loadConfig() {
  loading.value = true;
  try {
    const [provRes, keyRes] = await Promise.all([api('/provider/list'), api('/official-key/list')]);
    if (provRes.success) providers.value = provRes.providers || [];
    if (keyRes.success) officialKeys.value = keyRes.keys || [];
  } catch (e) {
    ElMessage.error($t('third_party.loading_failed') + ': ' + e.message);
  } finally { loading.value = false; }
}

// ─── 供应商选择时自动填充别名 ──
function onProviderSelect(val) {
  if (val && !dialogForm.label) {
    dialogForm.label = vendorLabel(val);
  }
}

// ─── 官方 key ──
function openAddOfficialDialog() { officialForm.alias = ''; officialForm.api_key = ''; showOfficialDialog.value = true; }
async function addOfficialKey() {
  officialSaving.value = true;
  try {
    const r = await api('/official-key/add', { method: 'POST', body: JSON.stringify({ alias: officialForm.alias || '默认', api_key: officialForm.api_key }) });
    if (r.success) { showOfficialDialog.value = false; await loadConfig(); ElMessage.success($t('official.added')); }
    else ElMessage.error(r.message);
  } finally { officialSaving.value = false; }
}
async function activateOfficial(id) {
  const r = await api('/official-key/' + encodeURIComponent(id) + '/activate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success($t('official.activated')); }
  else ElMessage.error(r.message);
}
function openEditOfficialAlias(k) { aliasForm.id = k.id; aliasForm.alias = k.alias || ''; showAliasDialog.value = true; }
async function saveAlias() {
  aliasSaving.value = true;
  try {
    const r = await api('/official-key/' + encodeURIComponent(aliasForm.id) + '/alias', { method: 'PUT', body: JSON.stringify({ alias: aliasForm.alias }) });
    if (r.success) { showAliasDialog.value = false; await loadConfig(); ElMessage.success($t('official.alias_updated')); }
    else ElMessage.error(r.message);
  } finally { aliasSaving.value = false; }
}
async function removeOfficial(id) {
  try { await ElMessageBox.confirm($t('official.confirm_delete'), $t('official.confirm'), { type: 'warning' }); } catch { return; }
  const r = await api('/official-key/' + encodeURIComponent(id), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success($t('official.deleted')); }
  else ElMessage.error(r.message);
}

// ─── 第三方供应商 ──
function openAddDialog() { editingId.value = null; dialogForm.provider = ''; dialogForm.label = ''; dialogForm.api_key = ''; dialogForm.base_url = ''; dialogForm.modelsInput = ''; showDialog.value = true; }
async function addProvider() {
  dialogSaving.value = true;
  try {
    const models = dialogForm.modelsInput ? dialogForm.modelsInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const r = await api('/provider/add', { method: 'POST', body: JSON.stringify({ provider: dialogForm.provider, api_key: dialogForm.api_key, label: dialogForm.label || vendorLabel(dialogForm.provider), base_url: dialogForm.base_url || undefined, models }) });
    if (r.success) { showDialog.value = false; await loadConfig(); ElMessage.success($t('third_party.added')); }
    else ElMessage.error(r.message);
  } finally { dialogSaving.value = false; }
}
async function openEditDialog(id) {
  editingId.value = id;
  const r = await api('/provider/' + encodeURIComponent(id));
  if (r.success && r.provider) { dialogForm.provider = r.provider.provider; dialogForm.label = r.provider.label || ''; dialogForm.api_key = r.provider.api_key || ''; dialogForm.base_url = r.provider.base_url || ''; dialogForm.modelsInput = ''; showDialog.value = true; }
  else ElMessage.error($t('third_party.fetch_failed'));
}
async function saveEdit() {
  dialogSaving.value = true;
  try {
    const r = await api('/provider/' + encodeURIComponent(editingId.value), { method: 'PUT', body: JSON.stringify({ label: dialogForm.label, base_url: dialogForm.base_url }) });
    if (r.success) { showDialog.value = false; await loadConfig(); ElMessage.success($t('third_party.updated')); }
    else ElMessage.error(r.message);
  } finally { dialogSaving.value = false; }
}
async function removeProvider(id) {
  try { await ElMessageBox.confirm($t('third_party.confirm_delete_provider') + ' "' + id + '"?', $t('third_party.confirm_delete'), { type: 'warning' }); } catch { return; }
  const r = await api('/provider/' + encodeURIComponent(id), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success($t('third_party.deleted')); }
  else ElMessage.error(r.message);
}
async function activateProvider(id) {
  const r = await api('/provider/' + encodeURIComponent(id) + '/activate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success($t('third_party.activated')); }
  else ElMessage.error(r.message);
}
async function deactivateAll() {
  const r = await api('/provider/deactivate', { method: 'POST' });
  if (r.success) { await loadConfig(); ElMessage.success($t('third_party.deactivated')); }
  else ElMessage.error(r.message);
}

// ─── 模型管理 ──
function openAddModelDialog(p) { addModelTargetId.value = p.id; newModelName.value = ''; showModelDialog.value = true; }
async function addModel() {
  modelDialogSaving.value = true;
  try {
    const r = await api('/provider/' + encodeURIComponent(addModelTargetId.value) + '/models', { method: 'POST', body: JSON.stringify({ name: newModelName.value.trim() }) });
    if (r.success) { showModelDialog.value = false; await loadConfig(); ElMessage.success($t('third_party.model_added')); }
    else ElMessage.error(r.message);
  } finally { modelDialogSaving.value = false; }
}
async function removeModel(pid, name) {
  try { await ElMessageBox.confirm($t('third_party.confirm_delete_model') + ' "' + name + '"?', $t('third_party.confirm_delete'), { type: 'warning' }); } catch { return; }
  const r = await api('/provider/' + encodeURIComponent(pid) + '/models/' + encodeURIComponent(name), { method: 'DELETE' });
  if (r.success) { await loadConfig(); ElMessage.success($t('third_party.model_deleted')); }
  else ElMessage.error(r.message);
}
async function setActiveModel(pid, name) {
  const r = await api('/provider/' + encodeURIComponent(pid) + '/models/' + encodeURIComponent(name) + '/activate', { method: 'PUT' });
  if (r.success) { await loadConfig(); ElMessage.success($t('third_party.model_set') + ' ' + name); }
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

.official-list { display:flex;flex-direction:column;gap:8px; }
.official-item { display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-secondary);border-radius:8px; }
.official-item.official-active { border:1px solid var(--el-color-primary);background:var(--el-color-primary-light-9); }
.official-info { display:flex;align-items:center;gap:10px; }
.official-alias { font-weight:600;font-size:14px; }
.official-actions { display:flex;gap:6px; }

.card-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:12px; }
.provider-card.card-active { border-color:var(--el-color-primary);border-width:2px; }
.card-header { display:flex;justify-content:space-between;align-items:center; }
.card-title { display:flex;align-items:center;gap:8px; }
.provider-name { font-weight:600;font-size:15px; }
.provider-alias { color:var(--text-secondary);font-size:12px; }
.card-actions { display:flex;gap:4px; }
.provider-info { display:flex;flex-direction:column;gap:8px;margin-bottom:14px; }
.info-row { display:flex;align-items:center;gap:10px; }
.info-label { min-width:72px;font-size:12px;color:var(--text-secondary);text-align:right; }
.info-value { font-size:13px;word-break:break-all; }
.info-value.mono { font-family:monospace;font-size:12px;color:var(--text-secondary); }

.model-section { border-top:1px solid var(--el-border-color-lighter);padding-top:12px; }
.model-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px; }
.model-title { font-size:13px;font-weight:600;color:var(--text-secondary); }
.model-list { display:flex;flex-direction:column;gap:6px; }
.model-item { display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg-secondary);border-radius:6px; }
.model-item.model-active { background:var(--el-color-primary-light-9);border:1px solid var(--el-color-primary-light-5); }
.model-name { font-size:13px;font-family:monospace;word-break:break-all;flex:1; }
.model-actions { display:flex;align-items:center;gap:6px;flex-shrink:0; }
</style>
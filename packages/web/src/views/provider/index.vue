<!--
  index.vue — 模型管理页面（provider 模块入口）
  统一使用 maskingStore.isLoading 控制全局加载状态
  弹窗组件位于 ./edit/ 子目录
-->
<template>
  <div class="model-view" v-loading="maskingStore.isLoading">
    <div class="toolbar">
      <h2>{{ $t('app.model_management') }}</h2>
      <el-button @click="loadConfig">{{ $t('common.refresh') }}</el-button>
    </div>

    <!-- ========== 官方 API Key ========== -->
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">{{ $t('official.title') }}</span>
          <el-button size="small" @click="dialogCtrl.showAddDialog(null, 'officialKey')">
            {{ $t('official.add_key') }}
          </el-button>
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
            <el-button size="small" @click="dialogCtrl.showEditDialog({ id: k.id, alias: k.alias }, 'alias')">{{ $t('official.alias') }}</el-button>
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
        <el-button type="primary" @click="dialogCtrl.showAddDialog(null, 'provider')">{{ $t('third_party.add_provider') }}</el-button>
      </div>

      <el-empty v-if="providers.length === 0" :description="$t('third_party.no_providers')" />

      <div v-else class="card-grid">
        <el-card v-for="p in providers" :key="p.id" :class="['provider-card', { 'card-active': p.active }]" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <el-tag v-if="p.active" size="small" type="primary" effect="dark">{{ $t('third_party.current') }}</el-tag>
                <span class="provider-name">{{ p.label }}</span>
                <span class="provider-type">{{ p.provider }}</span>
              </div>
              <div class="card-actions">
                <el-button size="small" :type="p.active ? 'default' : 'primary'" :disabled="p.active" @click="activateProviderAction(p.id)">{{ $t('third_party.activate') }}</el-button>
                <el-button size="small" @click="dialogCtrl.showEditDialog(p, 'provider')">{{ $t('third_party.edit') }}</el-button>
                <el-button size="small" type="danger" @click="removeProviderSubmit(p.id)">{{ $t('third_party.delete') }}</el-button>
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
              <el-button size="small" @click="dialogCtrl.showAddDialog({ id: p.id }, 'model')">{{ $t('third_party.add_model') }}</el-button>
            </div>
            <div class="model-list">
              <div v-for="m in p.models" :key="m.name" :class="['model-item', { 'model-active': m.active }]">
                <span class="model-name">{{ m.name }}</span>
                <div class="model-actions">
                  <el-button v-if="!m.active" size="small" type="primary" plain @click="setActiveModelAction(p.id, m.name)">{{ $t('third_party.set_current') }}</el-button>
                  <el-tag v-else size="small" type="success" effect="dark">{{ $t('third_party.current_model') }}</el-tag>
                  <el-button size="small" type="danger" :disabled="p.models.length <= 1" @click="removeModelSubmit(p.id, m.name)">{{ $t('third_party.delete_model') }}</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <Provider ref="provider" @submitSuccess="loadConfig" />
    <Model ref="model" @submitSuccess="loadConfig" />
    <OfficialKey ref="officialKey" @submitSuccess="loadConfig" />
    <Alias ref="alias" @submitSuccess="loadConfig" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import { getProviderI18nLabel } from '@codewhale/core/i18n';
import { getProviderList, activateProvider, removeProvider, deactivateProvider, removeModel, setActiveModel } from '@/api/provider';
import { getOfficialKeyList, activateOfficialKey, removeOfficialKey } from '@/api/officialKey';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import Provider from './edit/provider.vue';
import Model from './edit/model.vue';
import OfficialKey from './edit/officialKey.vue';
import Alias from './edit/alias.vue';

const { locale, t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const officialKeys = ref([]);
const providers = ref([]);
const hasActiveProvider = computed(() => providers.value.some(p => p.active));
const activeProviderDisplay = computed(() => {
  const a = providers.value.find(p => p.active);
  return a ? a.label + ' ' + a.provider : '';
});

function loadConfig() {
  Promise.all([getProviderList(), getOfficialKeyList()])
    .then(([prov, keys]) => { providers.value = prov || []; officialKeys.value = keys || []; });
}

function activateOfficial(id) { activateOfficialKey(id).then(() => loadConfig()); }

function removeOfficial(id) {
  ElMessageBox.confirm(t('official.confirm_delete'), t('official.confirm'), { type: 'warning' })
    .then(() => removeOfficialKey(id))
    .then(() => loadConfig());
}

function activateProviderAction(id) { activateProvider(id).then(() => loadConfig()); }
function deactivateAll() { deactivateProvider().then(() => loadConfig()); }

function removeProviderSubmit(id) {
  ElMessageBox.confirm(t('third_party.confirm_delete_provider') + ' "' + id + '"?', t('third_party.confirm_delete'), { type: 'warning' })
    .then(() => removeProvider(id))
    .then(() => loadConfig());
}

function removeModelSubmit(pid, name) {
  ElMessageBox.confirm(t('third_party.confirm_delete_model') + ' "' + name + '"?', t('third_party.confirm_delete'), { type: 'warning' })
    .then(() => removeModel(pid, name))
    .then(() => loadConfig());
}

function setActiveModelAction(pid, name) { setActiveModel(pid, name).then(() => loadConfig()); }

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
.provider-type { color:var(--text-secondary);font-size:12px;font-family:monospace; }
.card-actions { display:flex;gap:4px; }

.provider-info { display:flex;flex-direction:column;gap:6px;margin-bottom:10px; }
.info-row { display:flex;align-items:center;gap:8px; }
.info-label { font-size:12px;color:var(--text-secondary);min-width:60px; }
.info-value { font-size:12px; }
.mono { font-family:monospace; }

.model-section { border-top:1px solid var(--border);padding-top:10px; }
.model-header { display:flex; justify-content:space-between; align-items:center;margin-bottom:6px; }
.model-title { font-size:13px;color:var(--text-secondary); }
.model-list { display:flex;flex-direction:column;gap:4px; }
.model-item { display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg-primary);border-radius:6px; }
.model-item.model-active { background:var(--el-color-primary-light-9); }
.model-name { font-size:13px;font-family:monospace; }
.model-actions { display:flex;gap:4px;align-items:center; }
</style>

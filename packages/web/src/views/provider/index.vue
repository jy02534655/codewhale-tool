<!--
  index.vue — 模型管理页面（卡片布局版）
  侧边栏导航替换了页面标题，内容区用 Card 分区展示
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">

    <!-- ========== 官方 API Key ========== -->
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('official.title') }}</span>
      </div>
      <div class="section-actions">
        <el-button size="small" type="primary" @click="dialogCtrl.showAddDialog(null, 'officialKeyDialog')">
          <el-icon><Plus /></el-icon>
          {{ $t('official.add_key') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <el-empty v-if="officialKeys.length === 0" :description="$t('official.no_keys')" />
        <div v-else class="card-grid">
          <el-card v-for="k in officialKeys" :key="k.id" :class="['official-card', { 'card-active': k.active }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="official-alias">{{ k.alias }}</span>
                  <el-tag v-if="k.active" size="small" type="success" effect="dark">{{ $t('common.current') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-if="!k.active"  size="small" type="primary" @click="activateOfficial(k.id)">
                    <el-icon><CaretRight /></el-icon>
                    {{ $t('common.activate') }}
                  </el-button>
                  <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog({ id: k.id, alias: k.alias }, 'officialKeyDialog')">
                    <el-icon><Edit /></el-icon>
                    {{ $t('official.edit_alias_title') }}
                  </el-button>
                  <el-button size="small" type="danger" @click="removeOfficial(k.id)">
                    <el-icon><Delete /></el-icon>
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="official-info">
              <div class="field-row">
                <span class="field-label">API Key</span>
                <el-tag size="small" type="info" effect="plain">{{ k.api_key_preview }}</el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- ========== 第三方供应商 ========== -->
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('third_party.title') }}</span>
        <el-tag v-if="hasActiveProvider" size="small" type="warning" effect="plain">
          {{ $t('common.current') }}：{{ activeProviderDisplay }}
        </el-tag>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null, 'providerDialog')">
          <el-icon><Plus /></el-icon>
          {{ $t('third_party.add_provider') }}
        </el-button>
        <el-button v-if="hasActiveProvider" size="small" type="info" @click="deactivateAll">
          <el-icon><Close /></el-icon>
          {{ $t('third_party.deactivate') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <div v-if="!hasActiveProvider" class="hint-block">
          <el-icon style="margin-right:6px"><InfoFilled /></el-icon>
          {{ $t('third_party.hint') }}
        </div>
        <el-empty v-if="providers.length === 0" :description="$t('third_party.no_providers')" />
        <div v-else class="card-grid">
          <el-card v-for="p in providers" :key="p.id" :class="['provider-card', { 'card-active': p.active }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="provider-name">{{ p.label }}</span>
                  <span class="provider-type">{{ p.provider }}</span>
                  <el-tag v-if="p.active" size="small" type="primary" effect="dark">{{ $t('common.current') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-show="!p.active" size="small" type="primary" @click="activateProviderAction(p.id)">
                    <el-icon><CaretRight /></el-icon>
                    {{ $t('common.activate') }}
                  </el-button>
                  <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog(p, 'providerDialog')">
                    <el-icon><Edit /></el-icon>
                    {{ $t('common.edit') }}
                  </el-button>
                  <el-button size="small" type="danger" @click="removeProviderSubmit(p.id)">
                    <el-icon><Delete /></el-icon>
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="provider-info">
              <div class="field-row">
                <span class="field-label">{{ $t('third_party.api_key') }}</span>
                <el-tag size="small" type="info" effect="plain">{{ p.api_key_preview }}</el-tag>
              </div>
              <div class="field-row">
                <span class="field-label">{{ $t('third_party.base_url') }}</span>
                <span class="field-value mono">{{ p.base_url || $t('third_party.default_placeholder') }}</span>
              </div>
            </div>
            <div class="model-section">
              <div class="model-header">
                <span class="model-title">{{ $t('third_party.models') }}</span>
                <el-button size="small" type="primary" @click="dialogCtrl.showAddDialog({ id: p.id }, 'modelDialog')">
                  <el-icon><Plus /></el-icon>
                  {{ $t('third_party.add_model') }}
                </el-button>
              </div>
              <div class="model-list">
                <div v-for="m in p.models" :key="m.name" :class="['model-item', { 'model-active': m.active }]">
                  <div style="display:flex;align-items:center;gap:6px;overflow:hidden;">
                    <span class="model-name">{{ m.name }}</span>
                    <el-tag v-if="m.active" size="small" type="success" effect="dark">{{ $t('third_party.current_model') }}</el-tag>
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0;">
                    <el-button v-if="!m.active" size="small" type="primary" plain @click="setActiveModelAction(p.id, m.name)">
                      <el-icon><Check /></el-icon>
                      {{ $t('third_party.set_current') }}
                    </el-button>
                    <el-button size="small" type="danger" :disabled="p.models.length <= 1" @click="removeModelSubmit(p.id, m.name)">
                      <el-icon><Delete /></el-icon>
                      {{ $t('third_party.delete_model') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 弹窗 -->
    <provider ref="providerDialog" @submitSuccess="loadConfig" />
    <model ref="modelDialog" @submitSuccess="loadConfig" />
    <officialKey ref="officialKeyDialog" @submitSuccess="loadConfig" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { InfoFilled } from '@element-plus/icons-vue';
import {
  getProviderList, activateProvider, deactivateProvider, removeProvider,
  removeModel, setActiveModel,
} from '@/api/provider';
import {
  getOfficialKeyList, activateOfficialKey, removeOfficialKey,
} from '@/api/officialKey';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import provider from './edit/provider.vue';
import model from './edit/model.vue';
import officialKey from './edit/officialKey.vue';

const { t } = useI18n({ useScope: 'global' });
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
  ElMessageBox.confirm(t('common.confirm_delete'), t('common.confirm'), { type: 'warning' })
    .then(() => removeOfficialKey(id))
    .then(() => loadConfig());
}
function activateProviderAction(id) { activateProvider(id).then(() => loadConfig()); }
function deactivateAll() { deactivateProvider().then(() => loadConfig()); }
function removeProviderSubmit(id) {
  ElMessageBox.confirm(t('common.confirm_delete') + ' "' + id + '"?', t('common.confirm_delete'), { type: 'warning' })
    .then(() => removeProvider(id))
    .then(() => loadConfig());
}
function removeModelSubmit(id, name) {
  ElMessageBox.confirm(t('common.confirm_delete') + ' "' + name + '"?', t('common.confirm_delete'), { type: 'warning' })
    .then(() => removeModel({ id, name }))
    .then(() => loadConfig());
}
function setActiveModelAction(id, name) { setActiveModel({ id, name }).then(() => loadConfig()); }

onMounted(loadConfig);
</script>

<style scoped>
/* ─── 官方 Key 卡片 ─── */
.official-card.card-active { border-color:var(--el-color-success);border-width:2px; }
.official-alias { font-weight:600;font-size:15px; }
.official-info { display:flex;flex-direction:column;gap:6px; }

/* ─── 供应商卡片 ─── */
.provider-card.card-active { border-color:var(--el-color-primary);border-width:2px; }
.provider-name { font-weight:600;font-size:15px; }
.provider-type { color:var(--text-secondary);font-size:12px;font-family:monospace; }
.provider-info { display:flex;flex-direction:column;gap:6px;margin-bottom:10px; }
.provider-info .field-label { min-width:60px; }

/* ─── 模型列表 ─── */
.model-section { border-top:1px solid var(--border);padding-top:10px; }
.model-header { display:flex; justify-content:space-between; align-items:center;margin-bottom:6px; }
.model-title { font-size:13px;color:var(--text-secondary); }
.model-list { display:flex;flex-direction:column;gap:4px; }
.model-item { display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--bg-secondary);border-radius:6px; }
.model-item.model-active { background:var(--el-color-primary-light-9); }
.model-name { font-size:13px;font-family:monospace; }
</style>
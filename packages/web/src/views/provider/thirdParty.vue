<!--
  thirdParty.vue — 第三方供应商管理页面（从 provider/index.vue 拆分）
  负责第三方供应商的列表展示、激活/停用、模型管理
--><template>
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
                <span class="card-title-text">{{ p.label }}</span>
                <span class="provider-type">{{ p.provider }}</span>
                <el-tag v-if="p.active" size="small" type="primary" effect="dark">{{ $t('common.current') }}</el-tag>
              </div>
              <div class="card-actions">
                <el-button v-show="!p.active" size="small" type="primary" @click="activateProviderAction({ id: p.id })">
                  <el-icon><CaretRight /></el-icon>
                  {{ $t('common.activate') }}
                </el-button>
                <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog(p, 'providerDialog')">
                  <el-icon><Edit /></el-icon>
                  {{ $t('common.edit') }}
                </el-button>
                <el-button size="small" type="danger" @click="removeProviderSubmit({ id: p.id })">
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
                  <el-button v-if="!m.active" size="small" type="primary" plain @click="setActiveModelAction({ id: p.id, name: m.name })">
                    <el-icon><Check /></el-icon>
                    {{ $t('third_party.set_current') }}
                  </el-button>
                  <el-button size="small" type="danger" :disabled="p.models.length <= 1" @click="removeModelSubmit({ id: p.id, name: m.name })">
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
    <provider ref="providerDialog" @submitSuccess="loadConfig" />
    <model ref="modelDialog" @submitSuccess="loadConfig" />
  </div>
</template>

<script setup>
// 引入 Vue 响应式 API 和生命周期钩子
import { ref, computed, onMounted } from 'vue';
// 引入国际化函数
import { useI18n } from 'vue-i18n';
// 引入 Element Plus 消息确认框
import { ElMessageBox } from 'element-plus';
// 引入 Element Plus 图标
import { InfoFilled } from '@element-plus/icons-vue';
// 引入第三方供应商相关 API 方法
import {
  getProviderList, activateProvider, deactivateProvider, removeProvider,
} from '@/api/provider/provider';
// 引入模型相关 API 方法
import {
  removeModel, setActiveModel,
} from '@/api/provider/model';
// 引入弹窗容器组合式函数
import { compositionDialogContainer } from '@/composition/dialog/Container';
// 引入供应商编辑弹窗组件
import provider from './edit/provider.vue';
// 引入模型编辑弹窗组件
import model from './edit/model.vue';

// 获取国际化函数
const { t } = useI18n({ useScope: 'global' });
// 创建弹窗控制器实例
const dialogCtrl = compositionDialogContainer();

// 第三方供应商列表数据
const providers = ref([]);

// 是否有激活的供应商
const hasActiveProvider = computed(function () {
  return providers.value.some(function (p) { return p.active; });
});

// 当前激活供应商的展示文本
const activeProviderDisplay = computed(function () {
  const a = providers.value.find(function (p) { return p.active; });
  return a ? a.label + ' ' + a.provider : '';
});

// 加载第三方供应商列表
function loadConfig() {
  getProviderList()
    .then(function (prov) { providers.value = prov || []; });
}

// 激活供应商
function activateProviderAction(data) {
  activateProvider(data).then(function () { loadConfig(); });
}

// 停用所有供应商
function deactivateAll() {
  deactivateProvider().then(function () { loadConfig(); });
}

// 删除供应商（带确认）
function removeProviderSubmit(data) {
  ElMessageBox.confirm(t('common.confirm_delete') + ' "' + data.id + '"?', t('common.confirm_delete'), { type: 'warning' })
    .then(function () { return removeProvider(data); })
    .then(function () { loadConfig(); });
}

// 删除模型（带确认）
function removeModelSubmit(data) {
  ElMessageBox.confirm(t('common.confirm_delete') + ' "' + data.name + '"?', t('common.confirm_delete'), { type: 'warning' })
    .then(function () { return removeModel(data); })
    .then(function () { loadConfig(); });
}

// 设置当前激活模型
function setActiveModelAction(data) {
  setActiveModel(data).then(function () { loadConfig(); });
}

// 组件挂载时加载数据
onMounted(loadConfig);
</script>

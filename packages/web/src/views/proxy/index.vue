<!--
  index.vue — 代理管理页面（卡片布局）
  侧边栏导航替换了页面标题，内容区用卡片网格展示
-->
<template>
  <div v-loading="maskingStore.isLoading" class="proxy-view">
    <el-card class="section-card" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">{{ $t('proxy.title') }}</span>
          <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null)">
            {{ $t('proxy.add') }}
          </el-button>
        </div>
      </template>
      <el-empty v-if="list.length === 0" :description="$t('proxy.empty')" />
      <div v-else class="card-grid">
        <el-card v-for="p in list" :key="p.id" :class="['proxy-card', { 'card-default': p.default }]" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span class="card-alias">{{ p.alias }}</span>
                <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('proxy.default') }}</el-tag>
              </div>
              <div class="card-actions">
                <el-button v-if="!p.default" size="small" @click="onSetDefault(p)">{{ $t('proxy.setDefault') }}</el-button>
                <el-button size="small" @click="dialogCtrl.showEditDialog(p)">{{ $t('common.edit') }}</el-button>
                <el-button size="small" type="danger" @click="onRemove(p)">{{ $t('common.delete') }}</el-button>
              </div>
            </div>
          </template>
          <div class="proxy-fields">
            <div class="field-row">
              <span class="field-label">{{ $t('proxy.type') }}</span>
              <el-tag size="small" type="info" effect="plain">{{ p.type }}</el-tag>
            </div>
            <div class="field-row">
              <span class="field-label">{{ $t('proxy.host') }}</span>
              <span class="field-value mono">{{ p.host }}:{{ p.port }}</span>
            </div>
            <div v-if="p.auth && p.auth.username" class="field-row">
              <span class="field-label">{{ $t('proxy.auth_username') }}</span>
              <span class="field-value">{{ p.auth.username }}:****</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <ProxyEdit ref="dialog" @submitSuccess="loadList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { getProxyList, removeProxy, setDefaultProxy } from '@/api/proxy';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import ProxyEdit from './edit.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

function loadList() {
  getProxyList().then(function (data) {
    list.value = data || [];
  });
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeProxy(row.id).then(function () { loadList(); });
  });
}

function onSetDefault(row) {
  setDefaultProxy(row.id).then(function () { loadList(); });
}

onMounted(loadList);
</script>

<style scoped>
.proxy-view { padding: 20px 24px; }
.section-card { }
.section-header { display:flex;justify-content:space-between;align-items:center; }
.section-title { font-weight:600;font-size:15px; }

.card-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:12px; }
.proxy-card.card-default { border-color:var(--el-color-primary);border-width:2px; }
.card-header { display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px; }
.card-title { display:flex;align-items:center;gap:8px; }
.card-alias { font-weight:600;font-size:15px; }
.card-actions { display:flex;gap:4px;flex-wrap:wrap; }

.proxy-fields { display:flex;flex-direction:column;gap:8px; }
.field-row { display:flex;align-items:center;gap:8px; }
.field-label { font-size:12px;color:var(--text-secondary);min-width:50px;flex-shrink:0; }
.field-value { font-size:13px; }
.mono { font-family:monospace; }
</style>
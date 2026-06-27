<!--
  index.vue — 代理管理页面
  弹窗组件位于 edit.vue（新增/编辑共用）
-->
<template>
  <div v-loading="maskingStore.isLoading" class="proxy-view">
    <div class="toolbar">
      <h2>{{ $t('proxy.title') }}</h2>
      <div class="toolbar-actions">
        <el-button type="primary" @click="dialogCtrl.showAddDialog(null)">{{ $t('proxy.add') }}</el-button>
        <el-button @click="loadList">{{ $t('common.refresh') }}</el-button>
      </div>
    </div>

    <el-empty v-if="list.length === 0" :description="$t('proxy.empty')" />

    <div v-else class="proxy-list">
      <div v-for="p in list" :key="p.id" class="proxy-item">
        <div class="proxy-info">
          <span class="proxy-alias">{{ p.alias }}</span>
          <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('proxy.default') }}</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ p.type }}</el-tag>
          <span class="proxy-addr">{{ p.host }}:{{ p.port }}</span>
          <span v-if="p.auth && p.auth.username" class="proxy-auth">{{ p.auth.username }}:{{ p.auth.password }}</span>
        </div>
        <div class="proxy-actions">
          <el-button v-if="!p.default" size="small" @click="onSetDefault(p)">{{ $t('proxy.setDefault') }}</el-button>
          <el-button size="small" @click="dialogCtrl.showEditDialog(p)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onRemove(p)">{{ $t('common.delete') }}</el-button>
        </div>
      </div>
    </div>

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
.proxy-view { display:flex;flex-direction:column;gap:16px; }
.toolbar { display:flex;justify-content:space-between;align-items:center; }
.toolbar h2 { font-size:20px;margin:0; }
.toolbar-actions { display:flex;gap:8px; }

.proxy-list { display:flex;flex-direction:column;gap:8px; }
.proxy-item { display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px; }
.proxy-info { display:flex;align-items:center;gap:10px; }
.proxy-alias { font-weight:600;font-size:14px; }
.proxy-addr { font-family:monospace;font-size:13px;color:var(--text-secondary); }
.proxy-auth { font-family:monospace;font-size:12px;color:var(--text-secondary); }
.proxy-actions { display:flex;gap:6px; }
</style>
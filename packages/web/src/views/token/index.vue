<!--
  index.vue — GitHub Token 管理页面
  弹窗组件位于 edit.vue（新增/编辑共用）
-->
<template>
  <div v-loading="maskingStore.isLoading" class="token-view">
    <div class="toolbar">
      <h2>{{ $t('token.title') }}</h2>
      <div class="toolbar-actions">
        <el-button type="primary" @click="dialogCtrl.showAddDialog(null)">{{ $t('token.add') }}</el-button>
        <el-button @click="loadList">{{ $t('common.refresh') }}</el-button>
      </div>
    </div>

    <el-empty v-if="list.length === 0" :description="$t('token.empty')" />

    <div v-else class="token-list">
      <div v-for="t in list" :key="t.id" class="token-item">
        <div class="token-info">
          <span class="token-alias">{{ t.alias }}</span>
          <el-tag v-if="t.default" size="small" type="success" effect="dark">{{ $t('token.default') }}</el-tag>
          <el-tag size="small" type="info" effect="plain">{{ t.token }}</el-tag>
        </div>
        <div class="token-actions">
          <el-button v-if="!t.default" size="small" @click="onSetDefault(t)">{{ $t('token.setDefault') }}</el-button>
          <el-button size="small" @click="dialogCtrl.showEditDialog(t)">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onRemove(t)">{{ $t('common.delete') }}</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <TokenEdit ref="dialog" @submitSuccess="loadList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { getTokenList, removeToken, setDefaultToken } from '@/api/token';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import TokenEdit from './edit.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

function loadList() {
  getTokenList().then(function (data) {
    list.value = data || [];
  });
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeToken(row.id).then(function () { loadList(); });
  });
}

function onSetDefault(row) {
  setDefaultToken(row.id).then(function () { loadList(); });
}

onMounted(loadList);
</script>

<style scoped>
.token-view { display:flex;flex-direction:column;gap:16px; }
.toolbar { display:flex;justify-content:space-between;align-items:center; }
.toolbar h2 { font-size:20px;margin:0; }
.toolbar-actions { display:flex;gap:8px; }

.token-list { display:flex;flex-direction:column;gap:8px; }
.token-item { display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px; }
.token-info { display:flex;align-items:center;gap:10px; }
.token-alias { font-weight:600;font-size:14px; }
.token-actions { display:flex;gap:6px; }
</style>
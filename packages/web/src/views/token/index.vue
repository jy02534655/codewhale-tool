<template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('token.title') }}</span>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null)">
          <el-icon><Plus /></el-icon>
          {{ $t('token.add') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <el-empty v-if="list.length === 0" :description="$t('token.empty')" />
        <div v-else class="card-grid">
          <el-card v-for="t in list" :key="t.id" :class="['token-card', { 'card-active': t.default }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="card-alias">{{ t.alias }}</span>
                  <el-tag v-if="t.default" size="small" type="success" effect="dark">{{ $t('token.default') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-if="!t.default" size="small" type="primary" @click="onSetDefault(t)">
                    <el-icon><Top /></el-icon>
                    {{ $t('token.setDefault') }}
                  </el-button>
                  <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog(t)">
                    <el-icon><Edit /></el-icon>
                    {{ $t('token.edit_alias') }}
                  </el-button>
                  <el-button size="small" type="danger" @click="onRemove(t)">
                    <el-icon><Delete /></el-icon>
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-fields">
              <div class="field-row">
                <span class="field-label">{{ $t('token.token_value') }}</span>
                <el-tag size="small" type="info" effect="plain">{{ t.token }}</el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑弹窗 -->
    <TokenEdit ref="dialogRef" @submitSuccess="loadList(true)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { removeToken, setDefaultToken } from '@/api/token';
import { useMaskingStore } from '@/stores/masking';
import { useShareStore } from '@/stores/share';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import TokenEdit from './edit.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const shareStore = useShareStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

function loadList(isReLoad) {
  shareStore.getTokenList(isReLoad).then(function (result) {
    list.value = result.data || [];
  });
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeToken(row).then(function () { loadList(true); });
  });
}

function onSetDefault(row) {
  setDefaultToken(row).then(function () { loadList(true); });
}

onMounted(loadList);
</script>

<style scoped>
</style>

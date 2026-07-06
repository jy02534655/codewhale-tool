<!--
  index.vue — 代理管理页面（卡片布局）
  侧边栏导航替换了页面标题，内容区用卡片网格展示
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('proxy.title') }}</span>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null)">
          <el-icon><Plus /></el-icon>
          {{ $t('proxy.add') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <el-empty v-if="list.length === 0" :description="$t('proxy.empty')" />
        <div v-else class="card-grid">
          <el-card v-for="p in list" :key="p.id" :class="['proxy-card', { 'card-active': p.default }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="card-alias">{{ p.alias }}</span>
                  <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('proxy.default') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-if="!p.default" size="small" type="primary" @click="onSetDefault(p)">
                    <el-icon><Top /></el-icon>
                    {{ $t('proxy.setDefault') }}
                  </el-button>
                  <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog(p)">
                    <el-icon><Edit /></el-icon>
                    {{ $t('common.edit') }}
                  </el-button>
                  <el-button size="small" type="danger" @click="onRemove(p)">
                    <el-icon><Delete /></el-icon>
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-fields">
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
    </div>

    <!-- 新增/编辑弹窗 -->
    <ProxyEdit ref="dialogRef" @submitSuccess="() => loadList(true)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { removeProxy, setDefaultProxy } from '@/api/proxy';
import { useShareStore } from '@/stores/share';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import ProxyEdit from './edit.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const shareStore = useShareStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

function loadList(isReLoad) {
  shareStore.getProxyList(isReLoad).then(function (result) {
    list.value = result.data || [];
  });
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeProxy(row.id).then(function () { loadList(true); });
  });
}

function onSetDefault(row) {
  setDefaultProxy(row.id).then(function () { loadList(); });
}

onMounted(loadList);
</script>

<style scoped>
</style>
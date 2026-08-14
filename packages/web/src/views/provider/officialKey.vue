<!--
  officialKey.vue — 官方 API Key 管理页面（从 provider/index.vue 拆分）
  负责官方 API Key 的列表展示、激活、编辑别名、删除
--><template>
  <div v-loading="maskingStore.isLoading" class="page-section">
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
      <BrandEmpty v-if="officialKeys.length === 0 && !maskingStore.isLoading" :text="$t('official.no_keys')" :hint="$t('official.emptyHint')" />
      <div v-else class="card-grid">
        <el-card v-for="k in officialKeys" :key="k.id" :class="['official-card', { 'card-active': k.active }]" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-text">{{ k.alias }}</span>
                <el-tag v-if="k.active" size="small" type="success" effect="dark">{{ $t('common.current') }}</el-tag>
              </div>
              <div class="card-actions">
                <el-button v-if="!k.active" size="small" type="primary" @click="activateOfficial(k.id)">
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
          <div class="info-fields">
            <div class="field-row">
              <span class="field-label">API Key</span>
              <el-tag size="small" type="info" effect="plain">{{ k.api_key_preview }}</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
    <officialKey ref="officialKeyDialog" @submitSuccess="loadConfig" />
  </div>
</template>

<script setup>
// 引入 Vue 响应式 API 和生命周期钩子
import { ref, onMounted } from 'vue';
// 引入国际化函数
import { useI18n } from 'vue-i18n';
// 引入 Element Plus 消息确认框
import { ElMessageBox } from 'element-plus';
// 引入官方 API Key 相关 API 方法
import {
  getOfficialKeyList, activateOfficialKey, removeOfficialKey,
} from '@/api/officialKey';
// 引入弹窗容器组合式函数
import { compositionDialogContainer } from '@/composition/dialog/Container';
// 引入官方 API Key 编辑弹窗组件
import officialKey from './edit/officialKey.vue';
import { useMaskingStore } from '@/stores/masking';
import { BrandEmpty } from '@/components/brand';

// 获取国际化函数
const { t } = useI18n({ useScope: 'global' });
// 创建弹窗控制器实例
const dialogCtrl = compositionDialogContainer();
const maskingStore = useMaskingStore();

// 官方 API Key 列表数据
const officialKeys = ref([]);

// 加载官方 API Key 列表
const loadConfig = () => {
  getOfficialKeyList()
    .then((keys) => { officialKeys.value = keys || []; });
}

// 激活指定官方 API Key
const activateOfficial = (id) => {
  activateOfficialKey({ id }).then(() => { loadConfig(); });
}

// 删除官方 API Key（带确认）
const removeOfficial = (id) => {
  ElMessageBox.confirm(t('common.confirm_delete'), t('common.confirm'), { type: 'warning' })
    .then(() => { return removeOfficialKey({ id }); })
    .then(() => { loadConfig(); });
}

// 组件挂载时加载数据
onMounted(loadConfig);
</script>

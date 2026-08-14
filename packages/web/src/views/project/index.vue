<!--
  index.vue — 项目管理页面（卡片布局）
  侧边栏导航替换了页面标题，内容区用卡片网格展示
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('project.title') }}</span>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null)">
          <el-icon><Plus /></el-icon>
          {{ $t('project.add') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <BrandEmpty v-if="list.length === 0 && !maskingStore.isLoading" :text="$t('project.empty')" :hint="$t('project.emptyHint')" />
        <div v-else class="card-grid">
          <el-card
            v-for="p in list"
            :key="p.id"
            :class="['proxy-card', { 'card-active': p.default }]"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="card-alias">{{ p.alias || p.path }}</span>
                  <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('project.default') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-if="!p.default" size="small" type="primary" @click="onSetDefault(p)">
                    <el-icon><Top /></el-icon>
                    {{ $t('project.setDefault') }}
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
                <span class="field-label">{{ $t('project.path') }}</span>
                <span class="field-value mono">{{ p.path }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ProjectEdit ref="dialogRef" @submitSuccess="() => fetchList(true)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { Edit, Delete, Top, Plus } from '@element-plus/icons-vue';
import { removeProject, setDefaultProject } from '@/api/project';
import { useShareStore } from '@/stores/share';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import ProjectEdit from './edit.vue';
import { BrandEmpty } from '@/components/brand';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const shareStore = useShareStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

const fetchList = (isReLoad) => {
  shareStore.getProjectList(isReLoad).then((result) => {
    list.value = result.data || [];
  });
}

const onRemove = (row) => {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(() => {
    removeProject({ id: row.id }).then(() => { fetchList(true); });
  });
}

const onSetDefault = (row) => {
  setDefaultProject({ id: row.id }).then(() => { fetchList(true); });
}

onMounted(fetchList);
</script>

<style scoped>
</style>

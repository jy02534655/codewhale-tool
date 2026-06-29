<!--
  detail.vue — 右侧详情展示面板
  支持查看 skill 目录下的所有文件（不仅是 SKILL.md）
--><template>
  <div class="detail-panel">
    <el-empty v-if="!skill" :description="$t('skill.selectHint')" />
    <template v-else>
      <!-- 顶部：仅显示别名 -->
      <div class="detail-header">
        <h3 class="detail-title">{{ displayTitle }}</h3>
      </div>
      <!-- 备注：无 section-header -->
      <div class="detail-remark">
        <p v-if="skill.remark" class="remark-text">{{ skill.remark }}</p>
        <p v-else class="field-empty">（{{ $t('skill.noRemark') }}）</p>
      </div>
      <!-- 操作按钮（无缩进） -->
      <div class="detail-actions">
        <el-button size="small" type="primary" plain @click="emit('openEdit')">
          <el-icon><Edit /></el-icon>
          {{ $t('skill.editInfo') }}
        </el-button>
        <el-button size="small" type="primary" plain @click="emit('openReadme')">
          <el-icon><Document /></el-icon>
          {{ $t('skill.editReadme') }}
        </el-button>
        <el-button :type="skill.enabled ? 'warning' : 'success'" size="small" @click="doToggle">
          <el-icon><Switch /></el-icon>
          {{ skill.enabled ? $t('skill.disable') : $t('skill.enable') }}
        </el-button>
        <el-button size="small" type="danger" @click="doRemove">
          <el-icon><Delete /></el-icon>
          {{ $t('common.delete') }}
        </el-button>
        <el-button v-if="skill.source === 'community'" size="small" :loading="updating" @click="doUpdate">
          <el-icon><Refresh /></el-icon>
          {{ $t('skill.gitUpdate') }}
        </el-button>
      </div>
      <!-- 文件浏览器 -->
      <div class="file-browser-section">
        <div class="section-header">
          <span>📁 {{ $t('skill.files') || 'Files' }}</span>
        </div>
        <div v-if="fileLoading" v-loading="true" class="file-loading" />
        <div v-else-if="fileList.length > 0" class="file-browser">
          <div class="file-tree">
            <div
              v-for="item in fileTree"
              :key="item.path"
              class="file-node"
              :class="{ 'file-node--selected': activeFile === item.path, 'file-node--dir': item.isDir }"
            >
              <span v-if="item.isDir" class="file-icon">📁</span>
              <span v-else class="file-icon">📄</span>
              <span class="file-name" @click="selectFile(item)">{{ item.label }}</span>
            </div>
          </div>
          <div class="file-viewer">
            <div class="file-viewer-header">{{ activeFile || '' }}</div>
            <div v-if="fileContentLoading" v-loading="true" class="file-viewer-loading" />
            <pre v-else class="file-content">{{ fileContent }}</pre>
          </div>
        </div>
        <p v-else class="field-empty">（{{ $t('skill.noFiles') || 'No files' }}）</p>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { enableSkill, disableSkill, removeSkill, updateSkill, getSkillFiles, readSkillFile } from '@/api/skill'

const { t } = useI18n({ useScope: 'global' })
const props = defineProps({ skill: { type: Object, default: null } })
const emit = defineEmits(['refresh', 'openEdit', 'openReadme'])

const updating = ref(false)
const fileList = ref([])
const fileLoading = ref(false)
const activeFile = ref('')
const fileContent = ref('')
const fileContentLoading = ref(false)

const displayTitle = computed(function () {
  if (!props.skill) return ''
  return props.skill.alias || props.skill.name || props.skill.id
})

const fileTree = computed(function () {
  return fileList.value.map(function (p) {
    const parts = p.split('/')
    return { path: p, label: '\xA0'.repeat((parts.length - 1) * 4) + parts[parts.length - 1], isDir: false, depth: parts.length - 1 }
  })
})

function selectFile(item) {
  if (item.isDir) return
  activeFile.value = item.path
  fileContentLoading.value = true
  fileContent.value = ''
  const id = props.skill && (props.skill.id || props.skill)
  readSkillFile(id, item.path)
    .then(function (res) {
      fileContent.value = res || ''
    })
    .catch(function () {
      fileContent.value = t('skill.installFailed')
    })
    .finally(function () {
      fileContentLoading.value = false
    })
}

function doToggle() {
  if (!props.skill) return
  const fn = props.skill.enabled ? disableSkill : enableSkill
  fn(props.skill.id).then(function () { emit('refresh') })
}

function doRemove() {
  if (!props.skill) return
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + props.skill.id + '"?',
    t('common.confirm'),
    { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
  )
    .then(function () { return removeSkill(props.skill.id) })
    .then(function () { emit('refresh') })
}

function doUpdate() {
  if (!props.skill) return
  updating.value = true
  updateSkill(props.skill.id)
    .then(function () { emit('refresh') })
    .finally(function () { updating.value = false })
}

function loadFiles() {
  if (!props.skill) return
  fileLoading.value = true
  fileList.value = []
  activeFile.value = ''
  fileContent.value = ''
  const id = props.skill.id || props.skill
  getSkillFiles(id)
    .then(function (res) {
      fileList.value = (res && Array.isArray(res)) ? res : (res && res.data ? res.data : [])
      // 默认选中 SKILL.md
      const skillMd = fileList.value.find(function (f) { return f === 'SKILL.md' })
      if (skillMd) {
        selectFile({ path: skillMd, isDir: false })
      }
    })
    .catch(function () {
      fileList.value = []
    })
    .finally(function () {
      fileLoading.value = false
    })
}

watch(function () { return props.skill }, function (neu) {
  if (neu) loadFiles()
}, { immediate: true })
</script>
<style scoped>
.detail-panel { height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 20px; overflow: hidden; }
.detail-header { padding-bottom: 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.detail-title { font-size: 20px; font-weight: 600; margin: 0; }
.detail-remark { padding: 4px 0; flex-shrink: 0; }
.remark-text { font-size: 14px; line-height: 1.6; margin: 0; color: var(--text-primary); }
.field-empty { color: var(--text-secondary); font-size: 12px; margin: 0; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; flex-shrink: 0; }
.file-browser-section { flex: 1; min-height: 0; display: flex; flex-direction: column; background: var(--bg-primary); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 500; padding: 10px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
.file-loading { min-height: 100px; }
.file-browser { flex: 1; display: flex; min-height: 0; overflow: hidden; }
.file-tree { width: 200px; flex-shrink: 0; border-right: 1px solid var(--border); overflow-y: auto; padding: 4px 0; }
.file-node { display: flex; align-items: center; padding: 4px 12px; cursor: pointer; font-size: 12px; line-height: 1.8; color: var(--text-primary); white-space: nowrap; }
.file-node:hover { background: var(--bg-secondary); }
.file-node--selected { background: var(--el-color-primary-light-9, #ecf5ff); color: var(--el-color-primary, #409eff); }
.file-node--dir { font-weight: 500; cursor: default; }
.file-icon { width: 18px; flex-shrink: 0; text-align: center; }
.file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.file-viewer { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.file-viewer-header { padding: 8px 12px; font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--bg-secondary); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.file-viewer-loading { min-height: 100px; }
.file-content { flex: 1; margin: 0; padding: 12px; font-size: 12px; white-space: pre-wrap; overflow: auto; font-family: monospace; line-height: 1.6; }
</style>
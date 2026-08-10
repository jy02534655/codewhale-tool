<!--
  detail.vue — 右侧详情展示面板
  支持树形文件浏览、折叠目录、按文件类型预览与任意文本文件编辑
--><template>
  <div class="detail-panel">
    <el-empty v-if="!skill" :description="$t('skill.selectHint')" />
    <template v-else>
      <div class="detail-header">
        <h3 class="detail-title">{{ displayTitle }}</h3>
      </div>
      <div class="detail-remark">
        <p v-if="skill.remark">{{ skill.remark }}</p>
        <p v-else class="detail-remark--empty">{{ $t('skill.noRemark') }}</p>
      </div>
      <div class="detail-actions">
        <el-button size="small" type="success" :icon="Setting" @click="openEditDialog">{{ $t('skill.editInfo') }}</el-button>
        <el-button size="small" :icon="Sort" @click="openSortDialog">{{ sortOrderDisplay }}</el-button>
        <el-button v-if="skill.level === 'global'" size="small" type="info" :icon="DocumentCopy" @click="copyCurrentSkill">{{ $t('skill.copyToProject') }}</el-button>
        <el-button size="small" type="danger" :icon="Delete" @click="removeCurrentSkill">{{ $t('common.delete') }}</el-button>
        <el-button size="small" type="primary" :icon="Refresh" :disabled="skill.source !== 'community'" @click="updateCurrentSkill">{{ $t('skill.update') }}</el-button>
      </div>
      <div class="detail-meta">
        <span>{{ $t('common.alias') }}：{{ skill.alias || '-' }}</span>
        <span>{{ $t('skill.sourceLabel') }}：{{ sourceLabel }}</span>
        <span>{{ $t('skill.scope') }}：{{ scopeLabel }}</span>
      </div>
      <div class="file-browser-section">
        <div class="section-header">
          <el-button class="section-collapse-btn" size="small" text @click="toggleFileBrowser">
            <el-icon><component :is="fileBrowserExpanded ? ArrowDown : ArrowRight" /></el-icon>
          </el-button>
          <span>📁 {{ $t('skill.files') || 'Files' }}</span>
          <el-tag v-if="activeFile" size="small" effect="plain">{{ previewModeLabel }}</el-tag>
        </div>
        <div class="section-body" :class="{ 'section-body--collapsed': !fileBrowserExpanded }">
          <div v-show="fileBrowserExpanded" class="file-tree-wrap">
            <el-tree
              v-if="treeData.length"
              ref="treeRef"
              node-key="path"
              :data="treeData"
              :props="treeProps"
              highlight-current
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="tree-node" :class="{ 'tree-node--file': !data.isDir }">
                  <span class="tree-node-icon">{{ data.isDir ? (node.expanded ? '📂' : '📁') : '📄' }}</span>
                  <span class="tree-node-label">{{ data.label }}</span>
                  <el-button
                    v-if="!data.isDir"
                    class="tree-node-delete"
                    size="small"
                    link
                    type="danger"
                    @click.stop="removeFile(data.path)"
                  >
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </template>
            </el-tree>
            <el-empty v-else :description="$t('skill.noFiles')" />
          </div>
          <div class="file-viewer-wrap">
            <div v-if="activeFile" class="file-viewer">
              <div class="file-viewer-header">
                <span class="file-viewer-path">{{ activeFile }}</span>
                <div class="file-viewer-actions">
                  <el-button v-if="editableFile" size="small" :icon="EditPen" @click="openEditor(activeFile)">{{ $t('common.edit') }}</el-button>
                </div>
              </div>
              <div v-if="fileContentLoading" v-loading="true" class="file-viewer-loading" />
              <FilePreview v-else :path="activeFile" :content="fileContent" :show-syntax="false" class="file-preview" />
            </div>
            <el-empty v-else :description="$t('skill.selectFileHint')" />
          </div>
        </div>
      </div>
      <ReadmeDialog ref="readmeDialog" @submitSuccess="handleFileSaved" />
      <SortOrderDialog ref="sortOrderDialog" @submitSuccess="handleSortSaved" />
      <ProjectSelectDialog ref="projectSelectDialog" @submitSuccess="handleProjectCopied" />
    </template>
  </div>
</template>

<script setup>
// 引入 ref、computed 与 watch，处理详情页响应式状态。
import { ref, computed, watch, nextTick } from 'vue'

// 引入确认框，承载删除确认交互。
import { ElMessageBox, ElMessage } from 'element-plus'

// 引入详情页用到的图标。
import { ArrowDown, ArrowRight, DocumentCopy, Delete, EditPen, Refresh, Setting, Sort } from '@element-plus/icons-vue'

// 引入国际化函数，生成按钮与提示文案。
import { useI18n } from 'vue-i18n'

// 引入 Skill 相关接口。
import { removeSkill } from '@/api/skill/cmd'
import { getSkillFiles, readSkillFile, removeSkillFile } from '@/api/skill/files'

// 引入复用文件预览组件。
import FilePreview from '@/components/file/preview.vue'

// 引入弹窗容器，统一管理详情页弹窗。
import { compositionDialogContainer } from '@/composition/dialog/Container'

// 引入排序值、项目选择、README 编辑弹窗。
import SortOrderDialog from './sortOrder.vue'
import ProjectSelectDialog from './projectSelect.vue'
import ReadmeDialog from './readme.vue'

// 引入文件预览辅助，统一模式判断与可编辑判断。
import { getPreviewModeLabel, isEditableTextFile } from '@/components/file/utils'

// 获取全局翻译函数。
const { t } = useI18n({ useScope: 'global' })

// 定义父组件传入的 Skill 数据。
const props = defineProps({ skill: { type: Object, default: null } })

// 定义对外事件，通知父层刷新列表和状态。
const emit = defineEmits(['refresh', 'openEdit', 'openUpdate'])

// 保存文件树原始列表。
const fileList = ref([])

// 保存当前选中的文件路径。
const activeFile = ref('')

// 保存当前文件文本内容。
const fileContent = ref('')

// 记录文件树加载状态。
const fileListLoading = ref(false)

// 记录文件内容加载状态。
const fileContentLoading = ref(false)

// el-tree 实例引用，用于选中 SKILL.md 节点。
const treeRef = ref(null)

// 文件浏览器折叠状态。
const fileBrowserExpanded = ref(true)

// 定义 el-tree 字段映射。
const treeProps = {
  children: 'children',
  label: 'label',
}

// 弹窗容器，统一管理详情页内的排序值、项目选择、README 编辑弹窗。
const dialogCtrl = compositionDialogContainer()

// 组合详情页标题，优先展示 alias。
const displayTitle = computed(function () {
  if (!props.skill) return ''
  return props.skill.alias || props.skill.name || props.skill.slug || '-'
})

// 将来源字段翻译成当前语言的文案。
const sourceLabel = computed(function () {
  if (!props.skill) return '-'
  const source = props.skill.source || 'local'
  const key = 'skill.source.' + source
  return t(key) || source
})

// 将作用域字段翻译成当前语言的文案；项目级显示项目别名。
const scopeLabel = computed(function () {
  if (!props.skill) return '-'
  if (props.skill.level === 'project') {
    return props.skill.project || t('skill.project') || 'project'
  }
  const key = 'skill.' + props.skill.level
  return t(key) || props.skill.level
})

// 推导当前文件预览标签。
const previewModeLabel = computed(function () {
  return getPreviewModeLabel(activeFile.value)
})

// 判断当前文件是否可编辑。
const editableFile = computed(function () {
  return isEditableTextFile(activeFile.value)
})

// 排序值展示文案。
const sortOrderDisplay = computed(function () {
  if (!props.skill) return '-'
  const v = typeof props.skill.sort_order === 'number' ? props.skill.sort_order : 0
  return v === 0 ? t('skill.sortOrderDefault') : t('skill.sortOrder', { value: v })
})

// 将平铺文件列表转换为树结构。
const treeData = computed(function () {
  // 建立根节点容器，统一挂载目录树。
  const root = []

  // 记录每个目录节点，便于复用已有节点。
  const dirMap = new Map()

  // 逐个处理文件项并构造层级结构。
  fileList.value.forEach(function (item) {
    const path = typeof item === 'string' ? item : (item.path || '')
    const segments = path.split('/').filter(Boolean)
    let currentChildren = root
    let currentPath = ''

    segments.forEach(function (segment, index) {
      currentPath = currentPath ? currentPath + '/' + segment : segment
      const isDir = index < segments.length - 1
      let node = currentChildren.find(function (entry) {
        return entry.path === currentPath
      })

      if (!node) {
        node = {
          path: currentPath,
          label: segment,
          isDir,
          children: [],
        }
        currentChildren.push(node)
      }

      if (isDir) {
        dirMap.set(currentPath, node)
        currentChildren = node.children
      }
    })
  })

  // 按目录优先、名称次序排序，提升浏览体验。
  function sortNodes(nodes) {
    nodes.sort(function (a, b) {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    nodes.forEach(function (node) {
      if (node.children && node.children.length) sortNodes(node.children)
    })
  }

  sortNodes(root)
  return root
})

// 监听 Skill 变更，自动刷新文件树与预览区。
watch(function () {
  return props.skill && props.skill.id
}, function (skillId) {
  if (!skillId) {
    fileList.value = []
    activeFile.value = ''
    fileContent.value = ''
    fileBrowserExpanded.value = true
    return
  }
  // 切换 skill 时清空旧状态，触发默认选中 SKILL.md
  activeFile.value = ''
  fileContent.value = ''
  loadFiles()
}, { immediate: true })

// 加载当前 Skill 下的文件列表。
function loadFiles() {
  if (!props.skill) return
  fileListLoading.value = true
  getSkillFiles({ id: props.skill.id, level: props.skill.level, projectId: props.skill.projectId }).then(function (res) {
    fileList.value = Array.isArray(res) ? res : []
    // 仅有一个文件时默认折叠文件浏览器
    fileBrowserExpanded.value = fileList.value.length > 1
    // 如果当前没有选中文件，默认选中 SKILL.md
    if (!activeFile.value) {
      const skillMd = fileList.value.find(function (item) {
        const name = typeof item === 'string' ? item : (item.path || '')
        return name === 'SKILL.md'
      })
      if (skillMd) {
        const path = typeof skillMd === 'string' ? skillMd : (skillMd.path || '')
        nextTick(function () {
          loadFileContent(path)
        })
      }
    }
  }).catch(function () {
    ElMessage.error(t('message.networkError') || 'Failed to load files')
  }).finally(function () {
    fileListLoading.value = false
  })
}

// 加载指定文件内容。
function loadFileContent(path) {
  if (!props.skill || !path) return
  fileContentLoading.value = true
  activeFile.value = path
  readSkillFile({ id: props.skill.id, path, level: props.skill.level, projectId: props.skill.projectId }).then(function (res) {
    fileContent.value = typeof res === 'string' ? res : (res && res.content || '')
  }).catch(function () {
    ElMessage.error(t('message.networkError') || 'Failed to load file')
  }).finally(function () {
    fileContentLoading.value = false
  })
}

// 点击树节点时，仅文件节点触发预览加载。
function handleNodeClick(data) {
  if (!data || data.isDir) return
  loadFileContent(data.path)
}

// 切换文件浏览器展开/折叠。
function toggleFileBrowser() {
  fileBrowserExpanded.value = !fileBrowserExpanded.value
}

// 打开 README 或普通文本文件编辑弹窗。
function openEditor(path) {
  if (!props.skill || !path || !isEditableTextFile(path)) return
  dialogCtrl.showEditDialog({
    id: props.skill.id,
    path: path,
    level: props.skill.level,
    projectId: props.skill.projectId
  }, 'readmeDialog')
}

// 删除单个 Skill 文件，并在成功后刷新当前树状态。
function removeFile(path) {
  if (!props.skill || !path) return
  ElMessageBox.confirm(t('skill.confirmDeleteFile') + '：' + path, t('skill.confirmDeleteFileTitle'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(function () {
    return removeSkillFile({ id: props.skill.id, path, level: props.skill.level, projectId: props.skill.projectId })
  }).then(function () {
    if (activeFile.value === path) {
      activeFile.value = ''
      fileContent.value = ''
    }
    loadFiles()
  }).catch(function () {
    // 用户取消或请求失败，不做额外处理
  })
}

// 打开 Skill 信息编辑弹窗，由父层 infoDialog 承载。
function openEditDialog() {
  emit('openEdit')
}

// 文件保存后刷新预览与文件树，保持界面一致。
function handleFileSaved() {
  loadFiles()
  if (activeFile.value) {
    loadFileContent(activeFile.value)
  }
  emit('refresh')
}

// 更新当前 Skill 并通知外层刷新。
function updateCurrentSkill() {
  if (!props.skill) return
  const installParams = props.skill.installParams || null
  emit('openUpdate', {
    skillId: props.skill.id,
    installParams,
    level: props.skill.level,
    projectId: props.skill.projectId
  })
}

// 删除整个 Skill 前先做二次确认。
function removeCurrentSkill() {
  if (!props.skill) return
  ElMessageBox.confirm(t('common.confirm_delete') + '：' + displayTitle.value, t('common.delete'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(function () {
    return removeSkill({ id: props.skill.id, level: props.skill.level, projectId: props.skill.projectId })
  }).then(function () {
    emit('refresh')
  }).catch(function () {
    // 用户取消或请求失败，不做额外处理
  })
}

function copyCurrentSkill() { if (!props.skill) return; dialogCtrl.showEditDialog(props.skill, 'projectSelectDialog') }

// 打开排序值编辑弹窗。
function openSortDialog() {
  if (!props.skill) return
  dialogCtrl.showEditDialog(props.skill, 'sortOrderDialog')
}

// 排序值保存成功后刷新列表。
function handleSortSaved() {
  emit('refresh')
}

// 项目复制成功后刷新列表。
function handleProjectCopied() {
  emit('refresh')
}
</script>

<style scoped>
 .detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  overflow-y: auto;
  padding: var(--space-4) 18px;
 }

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.detail-title {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.detail-remark {
  color: var(--text-secondary);
  line-height: 1.7;
}

.detail-remark p {
  margin: 0;
}

.detail-remark--empty {
  color: var(--text-tertiary);
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: 13px;
  color: var(--text-secondary);
}

 .file-browser-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
  flex: 1;
  position: sticky;
  top: 0;
  border-top: 1px solid var(--border);
  padding-top: var(--space-3);
  margin-top: var(--space-1);
 }

 .section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
 }

.section-collapse-btn {
  padding: 0 var(--space-1);
  font-size: 14px;
}

.section-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--space-3);
  min-height: 0;
  flex: 1;
}

.section-body--collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.file-tree-wrap,
.file-viewer-wrap {
  min-height: 0;
 }

 .file-tree-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-3);
  overflow: auto;
  background: var(--bg-secondary);
 }

 /* ─── 暗黑模式文件列表适配 ─── */
[data-theme="dark"] .file-tree-wrap :deep(.el-tree) {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}
[data-theme="dark"] .file-tree-wrap :deep(.el-tree .el-tree-node__content) {
  background-color: transparent;
}
[data-theme="dark"] .file-tree-wrap :deep(.el-tree .el-tree-node__content:hover) {
  background-color: var(--bg-tertiary);
}
[data-theme="dark"] .file-tree-wrap :deep(.el-tree .el-tree-node.is-current) {
  background-color: #1a2533;
}

.file-viewer-wrap {
  display: flex;
 }

 .file-viewer {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-3);
  background: var(--bg-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
 }

.file-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.file-viewer-path {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-viewer-actions {
  display: flex;
  gap: var(--space-2);
}

.file-viewer-loading,
.file-preview {
  flex: 1;
  min-height: 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  width: 100%;
}

.tree-node-icon {
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.tree-node-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tree-node-delete {
  opacity: 0;
}

.tree-node:hover .tree-node-delete {
  opacity: 1;
}
</style>

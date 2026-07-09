<template>
  <el-dialog v-model="isShow" :title="dialogTitle" width="1100px" top="5vh" :close-on-click-modal="false" destroy-on-close @close="resetForm">
    <div class="editor-layout">
      <div class="editor-pane">
        <FileEditor v-model="content" :path="activePath" :show-syntax="true" />
      </div>
      <div class="editor-pane preview-pane">
        <div class="pane-header">{{ $t('common.preview') }}</div>
        <FilePreview :path="activePath" :content="content" :show-syntax="true" />
      </div>
    </div>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">{{ $t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
// 引入 ref 与 computed，管理弹窗状态和标题。
import { ref, computed } from 'vue'

// 引入国际化函数，生成弹窗标题与按钮文案。
import { useI18n } from 'vue-i18n'

// 引入 Skill 文件读写接口。
import { readSkillFile, saveSkillFile } from '@/api/skill/files'

// 引入通用弹窗基类，复用 show/hide 生命周期。
import { compositionDialogBase } from '@/composition/dialog/Base'

// 引入全局遮罩状态，对齐 info.vue 模式。
import { useMaskingStore } from '@/stores/masking'

// 引入复用文件编辑器组件。
import FileEditor from '@/components/file/editor.vue'

// 引入复用文件预览组件。
import FilePreview from '@/components/file/preview.vue'

// 定义提交成功事件，通知父组件刷新数据。
const emit = defineEmits(['submitSuccess'])

// 获取全局翻译函数。
const { t } = useI18n({ useScope: 'global' })

// 获取全局遮罩状态。
const maskingStore = useMaskingStore()

// 维护当前编辑内容。
const content = ref('')

// 维护当前打开的 Skill id。
const activeId = ref('')

// 维护当前编辑文件路径。
const activePath = ref('SKILL.md')

// 维护当前 skill 的 level 和 projectId，用于文件读写。
const activeLevel = ref(undefined)
const activeProjectId = ref(undefined)

// 复用通用弹窗状态控制能力，通过 initfun 加载文件内容。
const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function ({ data }) {
    if (!data) return
    activeId.value = data.id || ''
    activePath.value = data.path || 'SKILL.md'
    activeLevel.value = data.level
    activeProjectId.value = data.projectId
    readSkillFile(activeId.value, activePath.value, activeLevel.value, activeProjectId.value).then(function (res) {
      content.value = typeof res === 'string' ? res : (res && res.content || '')
    })
  }
})

// 生成弹窗标题，避免底部重复显示文件名。
const dialogTitle = computed(function () {
  if (activePath.value === 'SKILL.md') return t('skill.editReadme')
  return t('skill.editingFile') + '：' + activePath.value
})

// 重置弹窗内部状态，避免残留内容污染下一次打开。
function resetForm() {
  content.value = ''
  activeId.value = ''
  activePath.value = 'SKILL.md'
}

// 提交保存当前文件内容，并通知父组件刷新。
function onSubmit() {
  if (!activeId.value || !activePath.value) return
  saveSkillFile(activeId.value, activePath.value, content.value, activeLevel.value, activeProjectId.value).then(function () {
    emit('submitSuccess')
    hideDialog()
  })
}

// 对外暴露弹窗控制方法，供父组件调用。
defineExpose({
  showDialog,
  hideDialog,
  showDialogByData,
})
</script>

<style scoped>
.editor-layout {
  display: flex;
  gap: 12px;
  height: 68vh;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.preview-pane {
  min-width: 0;
}

.pane-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
</style>
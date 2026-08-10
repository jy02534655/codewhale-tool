<template>
  <el-dialog v-model="isShow"
    :title="dialogTitle"
    width="1100px"
    top="5vh"
    :close-on-click-modal="false"
    destroy-on-close
    @close="resetForm">
    <el-form ref="formRef" :model="formData" label-position="top" style="display: none">
      <el-form-item label=" " prop="content">
        <el-input v-model="formData.content" />
      </el-form-item>
    </el-form>
    <div class="editor-layout">
      <div class="editor-pane">
        <FileEditor v-model="formData.content" :path="formData.path" :show-syntax="true" />
      </div>
      <div class="editor-pane preview-pane">
        <div class="pane-header">{{ $t('common.preview') }}</div>
        <FilePreview :path="formData.path" :content="formData.content" :show-syntax="true" />
      </div>
    </div>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">{{ $t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { assign } from 'lodash-es'
import { useI18n } from 'vue-i18n'
import { readSkillFile, saveSkillFile } from '@/api/skill/files'
import { compositionDialogForm } from '@/composition/dialog/Form'
import { useMaskingStore } from '@/stores/masking'
import FileEditor from '@/components/file/editor.vue'
import FilePreview from '@/components/file/preview.vue'

const maskingStore = useMaskingStore()
const { t } = useI18n({ useScope: 'global' })

const formData = reactive({
  id: '',
  path: 'SKILL.md',
  content: '',
  level: undefined,
  projectId: ''
})

const dialogTitle = computed(function () {
  if (formData.path === 'SKILL.md') return t('skill.editReadme')
  return t('skill.editingFile') + '：' + formData.path
})

const { isShow, showDialog, hideDialog, showDialogByData, submitDialogForm, resetForm } =
  compositionDialogForm({
    addFun: () => Promise.resolve(),
    editFun: (params) => {
      return saveSkillFile(params.id, params.path, params.content, params.level, params.projectId)
    },
    initfun: function ({ data }) {
      if (!data) return
      assign(formData, data)
      readSkillFile(formData.id, formData.path, formData.level, formData.projectId).then(function (res) {
        formData.content = typeof res === 'string' ? res : (res && res.content || '')
      })
    },
  })

function onSubmit() {
  submitDialogForm(formData)
}

defineExpose({ showDialog, hideDialog, showDialogByData })
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

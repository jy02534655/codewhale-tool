<!-- info.vue — Skill 编辑弹窗
  compositionDialogForm，addFun 和 editFun 均为 updateMeta
-->
<template>
  <el-dialog v-model="isShow" :title="$t('skill.editInfo')" width="500px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="formRef" :model="formData" label-position="top">
      <el-form-item :label="$t('common.alias')">
        <el-input v-model="formData.alias" :placeholder="$t('skill.aliasPlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('skill.remark')">
        <el-input v-model="formData.remark" type="textarea" :rows="3" :placeholder="$t('skill.remarkPlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('skill.tags')">
        <el-input v-model="formData.tagsInput" :placeholder="$t('skill.tagsPlaceholder')" />
        <div v-if="tagsList.length" class="tags-preview">
          <el-tag v-for="t in tagsList" :key="t" size="small" type="info" effect="plain" closable @close="removeTag(t)">{{ t }}</el-tag>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">{{ $t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { assign } from 'lodash-es'
import { updateMeta } from '@/api/skill/routes'
import { useMaskingStore } from '@/stores/masking'
import { compositionDialogForm } from '@/composition/dialog/Form'

const maskingStore = useMaskingStore()
let currentId = ''
let currentLevel = ''
let currentProjectId = ''

// 表单数据（tagsInput 仅用于输入框，tags 提交时解析）
const formData = reactive({
  alias: '',
  remark: '',
  tagsInput: '',
  tags: []
})

// 标签列表（computed 从 formData.tags 派生）
const tagsList = computed(() => {
  return formData.tags || []
})

// 移除单个标签
const removeTag = (tag) => {
  formData.tags = formData.tags.filter((t) => { return t !== tag })
  formData.tagsInput = formData.tags.join(', ')
}

// 提交函数（供 compositionDialogForm 调用）
const doUpdate = (params) => {
  return updateMeta({
    id: currentId,
    alias: params.alias,
    remark: params.remark,
    tags: formData.tags,
    level: currentLevel,
    projectId: currentProjectId
  })
}

// compositionDialogForm：addFun/editFun 同一函数，initfun 中用 assign 填充
const { isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
  addFun: doUpdate,
  editFun: doUpdate,
  initfun: ({ data }) => {
    if (data) {
      currentId = data.id
      currentLevel = data.level || ''
      currentProjectId = data.projectId || ''
      assign(formData, {
        alias: data.alias || '',
        remark: data.remark || '',
        tags: data.tags ? data.tags.slice() : [],
        tagsInput: (data.tags || []).join(', ')
      })
    }
  }
})

// 提交（先解析标签，再调用 submitDialogForm）
const onSubmit = () => {
  formData.tags = formData.tagsInput.split(',').map((s) => { return s.trim() }).filter(Boolean)
  submitDialogForm(formData)
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>

<style scoped>
.tags-preview { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
</style>
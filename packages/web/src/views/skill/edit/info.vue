<!-- info.vue — Skill 编辑弹窗
  compositionDialogForm，addFun 和 editFun 均为 updateMeta
-->
<template>
  <el-dialog v-model="isShow" :title="$t('skill.editInfo')" width="500px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="form" :model="formData" label-position="top">
      <el-form-item :label="$t('skill.alias')">
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
import { useI18n } from 'vue-i18n'
import { assign } from 'lodash'
import { updateMeta } from '@/api/skill'
import { useMaskingStore } from '@/stores/masking'
import { compositionDialogForm } from '@/composition/dialog/Form'

var { t } = useI18n({ useScope: 'global' })
var maskingStore = useMaskingStore()
var currentId = ''

// 表单数据（tagsInput 仅用于输入框，tags 提交时解析）
var formData = reactive({
  alias: '',
  remark: '',
  tagsInput: '',
  tags: []
})

// 标签列表（computed 从 formData.tags 派生）
var tagsList = computed(function () {
  return formData.tags || []
})

// 移除单个标签
function removeTag(tag) {
  formData.tags = formData.tags.filter(function (t) { return t !== tag })
  formData.tagsInput = formData.tags.join(', ')
}

// 提交函数（供 compositionDialogForm 调用）
function doUpdate(params) {
  return updateMeta(currentId, {
    alias: params.alias,
    remark: params.remark,
    tags: formData.tags
  })
}

// compositionDialogForm：addFun/editFun 同一函数，initfun 中用 assign 填充
const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
  formName: 'form',
  addFun: doUpdate,
  editFun: doUpdate,
  initfun: function ({ data }) {
    if (data) {
      currentId = data.id
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
function onSubmit() {
  formData.tags = formData.tagsInput.split(',').map(function (s) { return s.trim() }).filter(Boolean)
  submitDialogForm(formData)
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>

<style scoped>
.tags-preview { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
</style>
<template>
  <el-dialog v-model="isShow"
    :title="$t('skill.editSortOrder')"
    width="360px"
    :close-on-click-modal="false"
    @close="resetForm">
    <el-form ref="formRef" :model="formData" label-position="top">
      <el-form-item :label="$t('skill.sortOrder')" prop="sortOrder">
        <el-input-number
          v-model="formData.sortOrder"
          :min="0"
          :max="99999"
          :step="1"
          size="small"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue'
import { assign } from 'lodash-es'
import { useMaskingStore } from '@/stores/masking'
import { updateSkillSortOrder } from '@/api/skill/routes'
import { compositionDialogForm } from '@/composition/dialog/Form'

const maskingStore = useMaskingStore()

const formData = reactive({
  id: undefined,
  sortOrder: 0,
  level: '',
  projectId: ''
})

const { isShow, showDialog, hideDialog, showDialogByData, submitDialogForm, resetForm } =
  compositionDialogForm({
    editFun: updateSkillSortOrder,
    initfun: ({ data }) => {
      if (data) {
        assign(formData, data)
        formData.sortOrder = typeof data.sort_order === 'number' ? data.sort_order : 0
      }
    },
  })

const onSubmit = () => {
  submitDialogForm(formData)
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>

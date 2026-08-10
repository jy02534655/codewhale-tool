<template>
  <el-dialog v-model="isShow"
    :title="$t('skill.selectProject')"
    width="420px"
    :close-on-click-modal="false"
    @close="resetForm">
    <el-form ref="formRef" :model="formData" label-position="top">
      <el-form-item :label="$t('skill.selectProject')" prop="projectId">
        <el-select
          v-model="formData.projectId"
          :placeholder="$t('skill.selectProjectPlaceholder')"
          style="width: 100%"
          filterable
          :disabled="maskingStore.isLoading"
        >
          <el-option
            v-for="p in projectList"
            :key="p.id || p.path"
            :label="p.alias || p.path"
            :value="p.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="maskingStore.isLoading" @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { assign } from 'lodash-es'
import { useShareStore } from '@/stores/share'
import { useMaskingStore } from '@/stores/masking'
import { copySkillToProject } from '@/api/skill/cmd'
import { compositionDialogForm } from '@/composition/dialog/Form'

const shareStore = useShareStore()
const maskingStore = useMaskingStore()

const formData = reactive({
  id: undefined,
  projectId: ''
})

const projectList = ref([])

const { isShow, showDialog, hideDialog, showDialogByData, submitDialogForm, resetForm } =
  compositionDialogForm({
    editFun: copySkillToProject,
    initfun: function ({ data }) {
      if (data) {
        assign(formData, data)
      }
      _loadProjects()
    },
  })

function _loadProjects() {
  shareStore.getProjectList().then(function (result) {
    projectList.value = result.data || []
    const defaultProject = (result.data || []).find(function (p) { return p.default }) || (result.data || [])[0]
    if (defaultProject) {
      formData.projectId = defaultProject.id || ''
    }
  }).catch(function () {
    projectList.value = []
  })
}

function onSubmit() {
  submitDialogForm(formData)
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>

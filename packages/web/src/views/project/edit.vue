<!--
  edit.vue — 新增/编辑项目弹窗
-->
<template>
  <el-dialog v-model="isShow" :title="isEdit ? t('project.edit_title') : t('project.add_title')" width="520px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="t('project.alias')" prop="alias">
        <el-input v-model="formData.alias" :placeholder="t('project.alias_placeholder')" />
      </el-form-item>
      <el-form-item :label="t('project.path')" prop="path">
        <FilePicker v-model="formData.path" mode="dir" :placeholder="t('project.path_placeholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
  import { reactive } from 'vue';
  import { assign } from 'lodash-es';
  import { useI18n } from 'vue-i18n';
  import { useMaskingStore } from '@/stores/masking';
  import FilePicker from '@/components/form/file/picker.vue';
  import { addProject, editProject } from '@/api/project';
  import { compositionDialogForm } from '@/composition/dialog/Form';

  const maskingStore = useMaskingStore();
  const { t } = useI18n({ useScope: 'global' });

  const formData = reactive({
    id: undefined,
    alias: '',
    path: ''
  });

  const rules = {
    alias: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
    path: [{ required: true, message: () => t('project.path_placeholder'), trigger: 'change' }]
  };

  const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
    addFun: addProject,
    editFun: editProject,
    initfun({ data }) {
      if (data) {
        assign(formData, data)
      }
    }
  });

  function onSubmit() {
    submitDialogForm(formData);
  }

  defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>

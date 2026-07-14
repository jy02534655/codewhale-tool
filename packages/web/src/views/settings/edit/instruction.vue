<!--
  instruction.vue — 指令配置新增/编辑弹窗
  使用 compositionDialogForm 统一处理表单校验与提交
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? t('settings.edit_instruction_dialog_title') : t('settings.add_instruction_dialog_title')"
    width="520px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="t('settings.instruction_path')" prop="path">
        <el-input v-model="formData.path" :placeholder="t('settings.instruction_path_placeholder')" />
      </el-form-item>
      <el-form-item :label="t('settings.instruction_content')" prop="content">
        <el-input v-model="formData.content" type="textarea" :rows="8"
          :placeholder="t('settings.instruction_content_placeholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();
const { t } = useI18n({ useScope: 'global' });

const formData = reactive({ path: '', content: '' });

const rules = {
  path: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
  addFun: () => Promise.resolve(),
  editFun: () => Promise.resolve(),
  initfun({ data, state }) {
    if (state === 1 && data) {
      formData.path = data.path || '';
      formData.content = data.content || '';
    } else {
      formData.path = '';
      formData.content = '';
    }
  },
});

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>

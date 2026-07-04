<!--
  model.vue — 模型新增弹窗（仅新增）
  el-form + formData + rules
  使用 compositionDialogForm 统一处理表单校验与提交
-->
<template>
  <el-dialog v-model="isShow" :title="$t('third_party.add_model_dialog_title')"
    width="400px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('third_party.model_name_placeholder')" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('third_party.model_name_placeholder')" />
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
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { addModel } from '@/api/provider/model';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();
const { t } = useI18n({ useScope: 'global' });

const formData = reactive({ name: undefined, id: undefined });

const rules = {
  name: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
};

const { isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
  addFun: addModel,
  initfun({ data }) {
    formData.id = data?.id;
  },
});

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>
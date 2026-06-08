<!--
  model.vue — 模型新增弹窗（仅新增）
  el-form + formData + rules
-->
<template>
  <el-dialog v-model="isShow" :title="$t('third_party.add_model_dialog_title')"
    width="400px" :close-on-click-modal="false">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item label="" prop="name">
        <el-input v-model="formData.name" :placeholder="$t('third_party.model_name_placeholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('third_party.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('third_party.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { addModel } from '@/api/provider';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogBase } from '@/composition/dialog/Base';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();

const formData = reactive({ name: undefined, providerId: undefined });

const rules = {
  name: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
};

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun({ data }) {
    formData.providerId = data?.id;
  },
});

function onSubmit() {
  addModel(formData.providerId, formData.name.trim())
    .then(() => { hideDialog(); emit('submitSuccess'); });
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>

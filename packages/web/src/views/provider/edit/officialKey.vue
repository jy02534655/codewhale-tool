<!--
  officialKey.vue — 官方 API Key 新增/编辑弹窗
  新增模式：alias(可选) + api_key(必填)
  编辑模式：alias(必填)，api_key 隐藏
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('official.edit_alias_title') : $t('official.add_dialog_title')"
    width="450px" :close-on-click-modal="false" @closed="closeDialog">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('official.alias_label')" prop="alias">
        <el-input v-model="formData.alias" :placeholder="$t('official.alias_placeholder')" />
      </el-form-item>
      <el-form-item v-if="!isEdit" :label="$t('official.api_key_label')" prop="api_key">
        <el-input v-model="formData.api_key" type="password" show-password
          placeholder="sk-..." />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">{{ $t('official.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('official.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { assign } from 'lodash';
import { addOfficialKey, editOfficialKey } from '@/api/officialKey';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();

const formData = reactive({ alias: undefined, api_key: undefined, id: undefined });

// 动态校验：新增时 api_key 必填，编辑时 alias 必填
const rules = computed(() => {
  if (isEdit.value) {
    return { alias: [{ required: true, message: '请输入别名', trigger: 'blur' }] };
  }
  return {
    api_key: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
  };
});

const { isEdit, isShow, showDialog, hideDialog, closeDialog, showDialogByData, submitDialogForm } = compositionDialogForm({
  formName: 'form',
  addFun: addOfficialKey,
  editFun: editOfficialKey,
  initfun({ data }) {
    if (data) assign(formData, data);
  },
});

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>
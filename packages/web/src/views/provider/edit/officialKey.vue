<!--
  officialKey.vue — 官方 API Key 新增/编辑弹窗
  新增模式：alias(默认) + api_key(必填)
  编辑模式：alias(必填)，api_key 隐藏
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('official.edit_alias_title') : $t('official.add_dialog_title')"
    width="450px" :close-on-click-modal="false" @close="resetForm">
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
      <el-button @click="hideDialog">{{ $t('official.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('official.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { assign } from 'lodash';
import { addOfficialKey, editOfficialKey } from '@/api/officialKey';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();

const formData = reactive({ alias: 'DeepSeek 官方 Key', api_key: undefined, id: undefined });

// 新增/编辑均校验别名，新增时需额外校验 api_key（通过 v-if 隐藏的表单项不参与校验）
const rules = {
  alias: [{ required: true, message: '请输入别名', trigger: 'blur' }],
  api_key: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } = compositionDialogForm({
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

defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>
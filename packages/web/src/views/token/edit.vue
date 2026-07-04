<!--
  edit.vue — GitHub Token 新增/编辑弹窗
  新增模式：显示 alias + token 两个字段
  编辑模式：仅显示 alias，token 隐藏不可编辑（同模型 API Key 模式）
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('token.edit_title') : $t('token.add_title')"
    width="480px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('common.alias')" prop="alias">
        <el-input v-model="formData.alias" :placeholder="$t('token.alias_placeholder')" />
      </el-form-item>
      <el-form-item v-if="!isEdit" :label="$t('token.token_value')" prop="token">
        <el-input v-model="formData.token" type="password" show-password
          :placeholder="$t('token.token_placeholder')" />
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
import { assign } from 'lodash';
import { addToken, editToken } from '@/api/token';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();
const { t } = useI18n({ useScope: 'global' });

const formData = reactive({ alias: undefined, token: undefined, id: undefined });

// alias 始终 required；token 仅新增时 required（v-if 隐藏的表单项不参与校验）
const rules = {
  alias: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  token: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } =
  compositionDialogForm({
    addFun: addToken,
    editFun: editToken,
    initfun({ data }) {
      if (data) assign(formData, data);
    },
  });

function onSubmit() {
  // 编辑时：不发送 token，后端只更新 alias
  if (isEdit.value) {
    const payload = { id: formData.id, alias: formData.alias };
    submitDialogForm(payload);
  } else {
    submitDialogForm(formData);
  }
}

defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>
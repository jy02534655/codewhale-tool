<!--
  edit.vue — 代理新增/编辑弹窗
  新增模式：显示全部字段
  编辑模式：显示全部字段
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('proxy.edit_title') : $t('proxy.add_title')"
    width="480px" :close-on-click-modal="false" @close="resetForm">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('common.alias')" prop="alias">
        <el-input v-model="formData.alias" :placeholder="$t('proxy.alias_placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('proxy.type')" prop="type">
        <el-select v-model="formData.type" :placeholder="$t('proxy.type_placeholder')" style="width:100%">
          <el-option label="HTTP" value="http" />
          <el-option label="SOCKS5" value="socks5" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('proxy.host')" prop="host">
        <el-input v-model="formData.host" :placeholder="$t('proxy.host_placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('proxy.port')" prop="port">
        <el-input v-model.number="formData.port" type="number" :placeholder="$t('proxy.port_placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('proxy.auth_username')">
        <el-input v-model="formData.username" :placeholder="$t('proxy.auth_username_placeholder')" />
      </el-form-item>
      <el-form-item :label="$t('proxy.auth_password')">
        <el-input v-model="formData.password" type="password" show-password :placeholder="$t('proxy.auth_password_placeholder')" />
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
import { addProxy, editProxy } from '@/api/proxy';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const maskingStore = useMaskingStore();
const { t } = useI18n({ useScope: 'global' });

const formData = reactive({
  alias: undefined,
  type: 'socks5',
  host: undefined,
  port: undefined,
  username: undefined,
  password: undefined,
  id: undefined,
});

const rules = {
  alias: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  host: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  port: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } =
  compositionDialogForm({
    formName: 'form',
    addFun: addProxy,
    editFun: editProxy,
    initfun({ data }) {
      if (data) {
        // 将行数据映射到表单字段（auth.username → username, auth.password → password）
        assign(formData, {
          alias: data.alias,
          type: data.type || 'socks5',
          host: data.host,
          port: data.port,
          username: (data.auth && data.auth.username) || undefined,
          password: (data.auth && data.auth.password) || undefined,
          id: data.id,
        });
      }
    },
  });

function onSubmit() {
  // 将表单数据转换为 API 格式（username/password → auth）
  const payload = {
    alias: formData.alias,
    type: formData.type,
    host: formData.host,
    port: formData.port,
    id: formData.id,
    auth: (formData.username || formData.password)
      ? { username: formData.username || '', password: formData.password || '' }
      : undefined,
  };
  submitDialogForm(payload);
}

defineExpose({ showDialog, hideDialog, showDialogByData, resetForm });
</script>
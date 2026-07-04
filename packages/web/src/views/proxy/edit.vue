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

/** 校验 host：必填，合法格式 = IPv4 / IPv6 / hostname */
function validateHost(rule, value, callback) {
  if (!value) return callback(new Error(t('common.required')));
  // IPv4
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (ipv4.test(value)) {
    const parts = value.split('.').map(Number);
    if (parts.every(function (n) { return n >= 0 && n <= 255; })) return callback();
    return callback(new Error(t('message.invalidHost')));
  }
  // IPv6 (包含冒号，且只有 hex 字符、冒号和点号)
  if (value.indexOf(':') !== -1) {
    // 简单校验：允许十六进制 + 冒号 + 点号
    if (/^[0-9a-fA-F:.]+$/.test(value)) return callback();
    return callback(new Error(t('message.invalidHost')));
  }
  // Hostname：字母数字、点、连字符，不以连字符开头或结尾，不含连续点
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value)) return callback();
  return callback(new Error(t('message.invalidHost')));
}

const rules = {
  alias: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  type: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  host: [
    { required: true, message: () => t('common.required'), trigger: 'blur' },
    { validator: validateHost, trigger: 'blur' },
  ],
  port: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, resetForm, showDialogByData, submitDialogForm } =
  compositionDialogForm({
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
<!--
  provider.vue — 供应商新增/编辑弹窗
  el-form + formData + rules + assign
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('third_party.edit_dialog_title') : $t('third_party.add_dialog_title')"
    width="520px" :close-on-click-modal="false" @closed="closeDialog">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item :label="$t('third_party.provider_type')" prop="provider">
        <el-select v-model="formData.provider" :placeholder="$t('third_party.select_placeholder')"
          style="width:100%" :disabled="isEdit" filterable @change="onProviderSelect">
          <el-option v-for="v in vendorOptions" :key="v.id" :label="v.label" :value="v.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('third_party.alias_label')" prop="label">
        <el-input v-model="formData.label" :placeholder="vendorLabel(formData.provider)" />
      </el-form-item>
      <el-form-item :label="$t('third_party.api_key_label')" prop="api_key">
        <el-input v-model="formData.api_key" type="password" show-password
          :disabled="isEdit" placeholder="sk-..." />
      </el-form-item>
      <el-form-item :label="$t('third_party.base_url_label')">
        <el-input v-model="formData.base_url" :placeholder="$t('third_party.base_url_placeholder')" />
      </el-form-item>
      <el-form-item v-if="!isEdit" :label="$t('third_party.initial_models')">
        <el-input v-model="formData.models" :placeholder="$t('third_party.models_placeholder')" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">{{ $t('third_party.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('third_party.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { assign } from 'lodash';
import { getKnownProviders, getProviderI18nLabel } from '@codewhale/core/i18n';
import { addProvider, editProvider } from '@/api/provider';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();
const { locale } = useI18n({ useScope: 'global' });
const vendorOptions = computed(() => getKnownProviders(locale.value));
const vendorLabel = (id) => getProviderI18nLabel(id, locale.value);

const formData = reactive({
  provider: undefined,
  label: undefined,
  api_key: undefined,
  base_url: undefined,
  models: undefined,
  id: undefined,
});

const rules = {
  provider: [{ required: true, message: '请选择供应商类型', trigger: 'change' }],
  api_key: [{ required: true, message: '请输入 API Key', trigger: 'blur' }],
};

const { isEdit, isShow, showDialog, hideDialog, closeDialog, showDialogByData, submitDialogForm } = compositionDialogForm({
  formName: 'form',
  addFun: addProvider,
  editFun: editProvider,
  initfun({ data }) {
    if (data) assign(formData, data);
  },
});

function onProviderSelect(val) {
  if (val) formData.label = vendorLabel(val);
}

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>

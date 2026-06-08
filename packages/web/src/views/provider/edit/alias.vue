<!--
  alias.vue — 官方 Key 别名编辑弹窗（仅编辑）
  el-form + formData + rules + assign
-->
<template>
  <el-dialog v-model="isShow" :title="$t('official.edit_alias_title')"
    width="350px" :close-on-click-modal="false">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item label="" prop="alias">
        <el-input v-model="formData.alias" :placeholder="$t('official.alias')" />
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
import { editOfficialKey } from '@/api/officialKey';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogBase } from '@/composition/dialog/Base';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();

const formData = reactive({ alias: undefined, id: undefined });

const rules = {
  alias: [{ required: true, message: '请输入别名', trigger: 'blur' }],
};

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun({ data }) {
    if (data) assign(formData, data);
  },
});

function onSubmit() {
  editOfficialKey({ id: formData.id, alias: formData.alias })
    .then(() => { hideDialog(); emit('submitSuccess'); });
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>

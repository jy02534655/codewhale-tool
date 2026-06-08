<!--
  install.vue — Skill 安装弹窗
-->
<template>
  <el-dialog v-model="isShow" title="安装 Skill" width="400px" :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="Skill ID">
        <el-input v-model="skillId" placeholder="如 pdf" @keyup.enter="onSubmit" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">取消</el-button>
      <el-button type="primary" :disabled="!skillId.trim()"
        :loading="maskingStore.isLoading" @click="onSubmit">
        确认安装
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { installSkill } from '@/api/skill';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogBase } from '@/composition/dialog/Base';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();

const skillId = ref('');

const { isShow, showDialog, hideDialog } = compositionDialogBase({
  initfun() {
    skillId.value = '';
  },
});

function onSubmit() {
  installSkill(skillId.value.trim())
    .then(() => { hideDialog(); emit('submitSuccess'); });
}

defineExpose({ showDialog, hideDialog });
</script>

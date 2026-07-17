<!--
  SecurityCard.vue — 通用设置：安全与审批卡片
  负责 approval_policy / sandbox_mode / allow_shell
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.security_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.approval_policy')" prop="approval_policy">
        <template #label>

                  <FormItemLabel labelKey="settings.approval_policy" helpKey="settings.help.approval_policy" />

                </template>
        <el-select v-model="formData.approval_policy">
          <el-option v-for="item in approvalPolicyOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.sandbox_mode')" prop="sandbox_mode">
        <template #label>

                  <FormItemLabel labelKey="settings.sandbox_mode" helpKey="settings.help.sandbox_mode" />

                </template>
        <el-select v-model="formData.sandbox_mode">
          <el-option v-for="item in sandboxModeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.allow_shell')" prop="allow_shell">
        <template #label>

                  <FormItemLabel labelKey="settings.allow_shell" helpKey="settings.help.allow_shell" />

                </template>
        <el-switch v-model="formData.allow_shell" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
  import { QuestionFilled } from '@element-plus/icons-vue';
import FormItemLabel from '@/components/FormItemLabel.vue';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getSettingsOptions } from '@/utils/i18n/settings';
  
  const formData = defineModel('formData');

  const { locale } = useI18n({ useScope: 'global' });

  const approvalPolicyOptions = computed(() => getSettingsOptions('approval_policy', locale.value));
  const sandboxModeOptions = computed(() => getSettingsOptions('sandbox_mode', locale.value));

  </script>

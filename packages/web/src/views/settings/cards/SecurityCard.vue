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
          <div class="form-item-label">
            <span>{{ $t('settings.approval_policy') }}</span>
            <el-tooltip placement="top" :content="helpText.approval_policy">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.approval_policy">
          <el-option v-for="item in approvalPolicyOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.sandbox_mode')" prop="sandbox_mode">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.sandbox_mode') }}</span>
            <el-tooltip placement="top" :content="helpText.sandbox_mode">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.sandbox_mode">
          <el-option v-for="item in sandboxModeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.allow_shell')" prop="allow_shell">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.allow_shell') }}</span>
            <el-tooltip placement="top" :content="helpText.allow_shell">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.allow_shell" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSettingsOptions } from '@/utils/i18n/settings';
import { settingsHelp } from '@/utils/settingsHelp';

const formData = defineModel('formData');

const { locale } = useI18n({ useScope: 'global' });

const approvalPolicyOptions = computed(() => getSettingsOptions('approval_policy', locale.value));
const sandboxModeOptions = computed(() => getSettingsOptions('sandbox_mode', locale.value));

const helpText = {
  approval_policy: settingsHelp.approval_policy,
  sandbox_mode: settingsHelp.sandbox_mode,
  allow_shell: settingsHelp.allow_shell,
};
</script>
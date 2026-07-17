<!--
  RetryCard.vue — 通用设置：重试卡片
  负责 retry_enabled / retry_max_retries /
  retry_initial_delay / retry_max_delay / retry_exponential_base
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.retry_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.retry_enabled')" prop="retry_enabled">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.retry_enabled') }}</span>
            <el-tooltip placement="top" :content="helpText.retry_enabled">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.retry_enabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_max_retries')" prop="retry_max_retries">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.retry_max_retries') }}</span>
            <el-tooltip placement="top" :content="helpText.retry_max_retries">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.retry_max_retries" :min="0" :max="10" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_initial_delay')" prop="retry_initial_delay">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.retry_initial_delay') }}</span>
            <el-tooltip placement="top" :content="helpText.retry_initial_delay">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.retry_initial_delay" :min="0" :max="60" :step="0.1" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_max_delay')" prop="retry_max_delay">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.retry_max_delay') }}</span>
            <el-tooltip placement="top" :content="helpText.retry_max_delay">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.retry_max_delay" :min="0" :max="300" :step="0.1" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_exponential_base')" prop="retry_exponential_base">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.retry_exponential_base') }}</span>
            <el-tooltip placement="top" :content="helpText.retry_exponential_base">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.retry_exponential_base" :min="1" :max="10" :step="0.1" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { settingsHelp } from '@/utils/settingsHelp';

const formData = defineModel('formData');

const helpText = {
  retry_enabled: settingsHelp.retry_enabled,
  retry_max_retries: settingsHelp.retry_max_retries,
  retry_initial_delay: settingsHelp.retry_initial_delay,
  retry_max_delay: settingsHelp.retry_max_delay,
  retry_exponential_base: settingsHelp.retry_exponential_base,
};
</script>
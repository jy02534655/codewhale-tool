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

                  <FormItemLabel labelKey="settings.retry_enabled" helpKey="settings.help.retry_enabled" />

                </template>
        <el-switch v-model="formData.retry_enabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_max_retries')" prop="retry_max_retries">
        <template #label>

                  <FormItemLabel labelKey="settings.retry_max_retries" helpKey="settings.help.retry_max_retries" />

                </template>
        <el-input-number v-model="formData.retry_max_retries" :min="0" :max="10" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_initial_delay')" prop="retry_initial_delay">
        <template #label>

                  <FormItemLabel labelKey="settings.retry_initial_delay" helpKey="settings.help.retry_initial_delay" />

                </template>
        <el-input-number v-model="formData.retry_initial_delay" :min="0" :max="60" :step="0.1" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_max_delay')" prop="retry_max_delay">
        <template #label>

                  <FormItemLabel labelKey="settings.retry_max_delay" helpKey="settings.help.retry_max_delay" />

                </template>
        <el-input-number v-model="formData.retry_max_delay" :min="0" :max="300" :step="0.1" />
      </el-form-item>
      <el-form-item :label="$t('settings.retry_exponential_base')" prop="retry_exponential_base">
        <template #label>

                  <FormItemLabel labelKey="settings.retry_exponential_base" helpKey="settings.help.retry_exponential_base" />

                </template>
        <el-input-number v-model="formData.retry_exponential_base" :min="1" :max="10" :step="0.1" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
  import { QuestionFilled } from '@element-plus/icons-vue';
import FormItemLabel from '@/components/label/index.vue';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  
  const { locale } = useI18n({ useScope: 'global' });

  const formData = defineModel('formData');

  </script>

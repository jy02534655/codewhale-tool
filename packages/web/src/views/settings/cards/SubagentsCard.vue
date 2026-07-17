<!--
  SubagentsCard.vue — 通用设置：子代理卡片
  负责 subagents_max_concurrent / subagents_token_budget /
  subagents_api_timeout_secs / subagents_heartbeat_timeout_secs / subagents_default_model
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.subagents_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.subagents_max_concurrent')" prop="subagents_max_concurrent">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_max_concurrent" helpKey="settings.help.subagents_max_concurrent" />

                </template>
        <el-input-number v-model="formData.subagents_max_concurrent" :min="1" :max="20" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_token_budget')" prop="subagents_token_budget">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_token_budget" helpKey="settings.help.subagents_token_budget" />

                </template>
        <el-input-number v-model="formData.subagents_token_budget" :min="0" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_api_timeout_secs')" prop="subagents_api_timeout_secs">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_api_timeout_secs" helpKey="settings.help.subagents_api_timeout_secs" />

                </template>
        <el-input-number v-model="formData.subagents_api_timeout_secs" :min="1" :max="1800" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_heartbeat_timeout_secs')" prop="subagents_heartbeat_timeout_secs">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_heartbeat_timeout_secs" helpKey="settings.help.subagents_heartbeat_timeout_secs" />

                </template>
        <el-input-number v-model="formData.subagents_heartbeat_timeout_secs" :min="30" :max="3600" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_default_model')" prop="subagents_default_model">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_default_model" helpKey="settings.help.subagents_default_model" />

                </template>
        <el-input v-model="formData.subagents_default_model" placeholder="deepseek-v4-pro" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import FormItemLabel from '@/components/FormItemLabel.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });

const formData = defineModel('formData');

  </script>

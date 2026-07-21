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
      <el-form-item :label="$t('settings.subagents_max_concurrent.label')" prop="subagents_max_concurrent">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_max_concurrent.label" helpKey="settings.subagents_max_concurrent.help" />

                </template>
        <el-input-number v-model="formData.subagents_max_concurrent" :min="1" :max="20" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_token_budget.label')" prop="subagents_token_budget">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_token_budget.label" helpKey="settings.subagents_token_budget.help" />

                </template>
        <el-input-number v-model="formData.subagents_token_budget" :min="0" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_api_timeout_secs.label')" prop="subagents_api_timeout_secs">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_api_timeout_secs.label" helpKey="settings.subagents_api_timeout_secs.help" />

                </template>
        <el-input-number v-model="formData.subagents_api_timeout_secs" :min="1" :max="1800" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_heartbeat_timeout_secs.label')" prop="subagents_heartbeat_timeout_secs">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_heartbeat_timeout_secs.label" helpKey="settings.subagents_heartbeat_timeout_secs.help" />

                </template>
        <el-input-number v-model="formData.subagents_heartbeat_timeout_secs" :min="30" :max="3600" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_default_model.label')" prop="subagents_default_model">
        <template #label>

                  <FormItemLabel labelKey="settings.subagents_default_model.label" helpKey="settings.subagents_default_model.help" />

                </template>
        <el-input v-model="formData.subagents_default_model" placeholder="deepseek-v4-pro" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import FormItemLabel from '@/components/label/index.vue';

const formData = defineModel('formData');

  </script>

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
          <div class="form-item-label">
            <span>{{ $t('settings.subagents_max_concurrent') }}</span>
            <el-tooltip placement="top" :content="helpText.subagents_max_concurrent">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.subagents_max_concurrent" :min="1" :max="20" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_token_budget')" prop="subagents_token_budget">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.subagents_token_budget') }}</span>
            <el-tooltip placement="top" :content="helpText.subagents_token_budget">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.subagents_token_budget" :min="0" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_api_timeout_secs')" prop="subagents_api_timeout_secs">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.subagents_api_timeout_secs') }}</span>
            <el-tooltip placement="top" :content="helpText.subagents_api_timeout_secs">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.subagents_api_timeout_secs" :min="1" :max="1800" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_heartbeat_timeout_secs')" prop="subagents_heartbeat_timeout_secs">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.subagents_heartbeat_timeout_secs') }}</span>
            <el-tooltip placement="top" :content="helpText.subagents_heartbeat_timeout_secs">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.subagents_heartbeat_timeout_secs" :min="30" :max="3600" />
      </el-form-item>
      <el-form-item :label="$t('settings.subagents_default_model')" prop="subagents_default_model">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.subagents_default_model') }}</span>
            <el-tooltip placement="top" :content="helpText.subagents_default_model">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.subagents_default_model" placeholder="deepseek-v4-pro" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { settingsHelp } from '@/utils/settingsHelp';

const formData = defineModel('formData');

const helpText = {
  subagents_max_concurrent: settingsHelp.subagents_max_concurrent,
  subagents_token_budget: settingsHelp.subagents_token_budget,
  subagents_api_timeout_secs: settingsHelp.subagents_api_timeout_secs,
  subagents_heartbeat_timeout_secs: settingsHelp.subagents_heartbeat_timeout_secs,
  subagents_default_model: settingsHelp.subagents_default_model,
};
</script>
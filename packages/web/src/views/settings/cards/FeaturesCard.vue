<!--
  FeaturesCard.vue — 通用设置：功能开关卡片
  负责 features_shell_tool / features_subagents / features_web_search /
  features_apply_patch / features_mcp / features_exec_policy / features_vision_model
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.features_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.features_shell_tool')" prop="features_shell_tool">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_shell_tool') }}</span>
            <el-tooltip placement="top" :content="helpText.features_shell_tool">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_shell_tool" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_subagents')" prop="features_subagents">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_subagents') }}</span>
            <el-tooltip placement="top" :content="helpText.features_subagents">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_subagents" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_web_search')" prop="features_web_search">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_web_search') }}</span>
            <el-tooltip placement="top" :content="helpText.features_web_search">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_web_search" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_apply_patch')" prop="features_apply_patch">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_apply_patch') }}</span>
            <el-tooltip placement="top" :content="helpText.features_apply_patch">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_apply_patch" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_mcp')" prop="features_mcp">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_mcp') }}</span>
            <el-tooltip placement="top" :content="helpText.features_mcp">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_mcp" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_exec_policy')" prop="features_exec_policy">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_exec_policy') }}</span>
            <el-tooltip placement="top" :content="helpText.features_exec_policy">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_exec_policy" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_vision_model')" prop="features_vision_model">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.features_vision_model') }}</span>
            <el-tooltip placement="top" :content="helpText.features_vision_model">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.features_vision_model" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { settingsHelp } from '@/utils/settingsHelp';

const formData = defineModel('formData');

const helpText = {
  features_shell_tool: settingsHelp.features_shell_tool,
  features_subagents: settingsHelp.features_subagents,
  features_web_search: settingsHelp.features_web_search,
  features_apply_patch: settingsHelp.features_apply_patch,
  features_mcp: settingsHelp.features_mcp,
  features_exec_policy: settingsHelp.features_exec_policy,
  features_vision_model: settingsHelp.features_vision_model,
};
</script>
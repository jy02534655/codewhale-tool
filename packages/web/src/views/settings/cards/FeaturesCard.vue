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

                  <FormItemLabel labelKey="settings.features_shell_tool" helpKey="settings.help.features_shell_tool" />

                </template>
        <el-switch v-model="formData.features_shell_tool" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_subagents')" prop="features_subagents">
        <template #label>

                  <FormItemLabel labelKey="settings.features_subagents" helpKey="settings.help.features_subagents" />

                </template>
        <el-switch v-model="formData.features_subagents" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_web_search')" prop="features_web_search">
        <template #label>

                  <FormItemLabel labelKey="settings.features_web_search" helpKey="settings.help.features_web_search" />

                </template>
        <el-switch v-model="formData.features_web_search" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_apply_patch')" prop="features_apply_patch">
        <template #label>

                  <FormItemLabel labelKey="settings.features_apply_patch" helpKey="settings.help.features_apply_patch" />

                </template>
        <el-switch v-model="formData.features_apply_patch" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_mcp')" prop="features_mcp">
        <template #label>

                  <FormItemLabel labelKey="settings.features_mcp" helpKey="settings.help.features_mcp" />

                </template>
        <el-switch v-model="formData.features_mcp" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_exec_policy')" prop="features_exec_policy">
        <template #label>

                  <FormItemLabel labelKey="settings.features_exec_policy" helpKey="settings.help.features_exec_policy" />

                </template>
        <el-switch v-model="formData.features_exec_policy" />
      </el-form-item>
      <el-form-item :label="$t('settings.features_vision_model')" prop="features_vision_model">
        <template #label>

                  <FormItemLabel labelKey="settings.features_vision_model" helpKey="settings.help.features_vision_model" />

                </template>
        <el-switch v-model="formData.features_vision_model" />
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
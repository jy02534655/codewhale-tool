<!--
  BasicSettingsCard.vue — 通用设置：基础设置卡片
  负责 language / default_text_model / update_check_for_updates
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.basic_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.language')" label-width="140px">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.language') }}</span>
            <el-tooltip placement="top" :content="helpText.locale">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.locale" @change="emit('save')">
          <el-option
            v-for="item in locales"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.default_model')" label-width="140px" class="full-width">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.default_model') }}</span>
            <el-tooltip placement="top" :content="helpText.default_text_model">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="formData.default_text_model"
          :placeholder="$t('settings.default_model_placeholder')"
          @blur="emit('save')"
        />
      </el-form-item>
      <el-form-item :label="$t('settings.update_check_for_updates')" label-width="140px">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.update_check_for_updates') }}</span>
            <el-tooltip placement="top" :content="helpText.update_check_for_updates">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.update_check_for_updates" @change="emit('save')" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { settingsHelp } from '@/utils/settingsHelp';

const formData = defineModel('formData');
const emit = defineEmits(['save']);

const locales = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
];

const helpText = {
  locale: settingsHelp.locale,
  default_text_model: settingsHelp.default_text_model,
  update_check_for_updates: settingsHelp.update_check_for_updates,
};
</script>

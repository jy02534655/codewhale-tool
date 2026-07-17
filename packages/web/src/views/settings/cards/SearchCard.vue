<!--
  SearchCard.vue — 通用设置：搜索卡片
  负责 search_provider / search_base_url
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.search_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.search_provider')" prop="search_provider">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.search_provider') }}</span>
            <el-tooltip placement="top" :content="helpText.search_provider">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.search_provider">
          <el-option v-for="item in searchProviderOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.search_base_url')" prop="search_base_url">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.search_base_url') }}</span>
            <el-tooltip placement="top" :content="helpText.search_base_url">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.search_base_url" placeholder="https://..." />
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

const searchProviderOptions = computed(() => getSettingsOptions('search_provider', locale.value));

const helpText = {
  search_provider: settingsHelp.search_provider,
  search_base_url: settingsHelp.search_base_url,
};
</script>
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

                  <FormItemLabel labelKey="settings.search_provider" helpKey="settings.help.search_provider" />

                </template>
        <el-select v-model="formData.search_provider">
          <el-option v-for="item in searchProviderOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.search_base_url')" prop="search_base_url">
        <template #label>

                  <FormItemLabel labelKey="settings.search_base_url" helpKey="settings.help.search_base_url" />

                </template>
        <el-input v-model="formData.search_base_url" :placeholder="$t('settings.placeholder_search_base_url')" />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
  import { QuestionFilled } from '@element-plus/icons-vue';
import FormItemLabel from '@/components/FormItemLabel.vue';
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getSettingsOptions } from '@/utils/i18n/settings';
  
  const formData = defineModel('formData');

  const { locale } = useI18n({ useScope: 'global' });

  const searchProviderOptions = computed(() => getSettingsOptions('search_provider', locale.value));

  </script>

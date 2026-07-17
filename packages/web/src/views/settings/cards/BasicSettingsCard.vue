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
      <el-form-item :label="$t('settings.language')">
        <template #label>

                  <FormItemLabel labelKey="settings.language" helpKey="settings.help.locale" />

                </template>
        <el-select v-model="formData.locale" @change="emit('save')">
          <el-option v-for="item in localeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.default_model')" class="full-width">
        <template #label>

                  <FormItemLabel labelKey="settings.default_model" helpKey="settings.help.default_text_model" />

                </template>
        <el-input v-model="formData.default_text_model" :placeholder="$t('settings.default_model_placeholder')" @blur="emit('save')" />
      </el-form-item>
      <el-form-item :label="$t('settings.update_check_for_updates')">
        <template #label>

                  <FormItemLabel labelKey="settings.update_check_for_updates" helpKey="settings.help.update_check_for_updates" />

                </template>
        <el-switch v-model="formData.update_check_for_updates" @change="emit('save')" />
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
  const emit = defineEmits(['save']);

  const { locale } = useI18n({ useScope: 'global' });

  const localeOptions = computed(() => getSettingsOptions('locale', locale.value));

  </script>

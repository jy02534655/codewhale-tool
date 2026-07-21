<!--
  NotificationsCard.vue — 通用设置：通知卡片
  负责 notifications_method / notifications_threshold_secs / notifications_completion_sound
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.notifications_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.notifications_method')" prop="notifications_method">
        <template #label>

                  <FormItemLabel labelKey="settings.notifications_method" helpKey="settings.help.notifications_method" />

                </template>
        <el-select v-model="formData.notifications_method">
          <el-option v-for="item in notificationsMethodOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.notifications_threshold_secs')" prop="notifications_threshold_secs">
        <template #label>

                  <FormItemLabel labelKey="settings.notifications_threshold_secs" helpKey="settings.help.notifications_threshold_secs" />

                </template>
        <el-input-number v-model="formData.notifications_threshold_secs" :min="0" :max="3600" />
      </el-form-item>
      <el-form-item :label="$t('settings.notifications_completion_sound')" prop="notifications_completion_sound">
        <template #label>

                  <FormItemLabel labelKey="settings.notifications_completion_sound" helpKey="settings.help.notifications_completion_sound" />

                </template>
        <el-select v-model="formData.notifications_completion_sound">
          <el-option v-for="item in notificationsCompletionSoundOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
import FormItemLabel from '@/components/label/index.vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSettingsOptions } from '@/utils/i18n/settings';

const formData = defineModel('formData');

const { locale } = useI18n({ useScope: 'global' });

const notificationsMethodOptions = computed(() => getSettingsOptions('notifications_method', locale.value));
const notificationsCompletionSoundOptions = computed(() => getSettingsOptions('notifications_completion_sound', locale.value));

 </script>

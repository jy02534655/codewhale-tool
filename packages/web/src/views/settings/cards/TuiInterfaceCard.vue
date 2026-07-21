<!--
  TuiInterfaceCard.vue — 通用设置：TUI 界面卡片
  负责 theme / default_mode / sidebar_focus / mention_menu_behavior /
  cost_currency / verbosity / show_thinking / show_tool_details /
  auto_compact / paste_burst_detection / auto_compact_threshold_percent /
  mention_menu_limit / mention_walk_depth / max_history / background_color / default_model
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.tui_interface_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.theme')" prop="theme">
        <template #label>

                  <FormItemLabel labelKey="settings.theme" helpKey="settings.help.theme" />

                </template>
        <el-select v-model="formData.theme">
          <el-option v-for="item in themeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.default_mode')" prop="default_mode">
        <template #label>

                  <FormItemLabel labelKey="settings.default_mode" helpKey="settings.help.default_mode" />

                </template>
        <el-select v-model="formData.default_mode">
          <el-option v-for="item in defaultModeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.sidebar_focus')" prop="sidebar_focus">
        <template #label>

                  <FormItemLabel labelKey="settings.sidebar_focus" helpKey="settings.help.sidebar_focus" />

                </template>
        <el-select v-model="formData.sidebar_focus">
          <el-option v-for="item in sidebarFocusOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.mention_menu_behavior')" prop="mention_menu_behavior">
        <template #label>

                  <FormItemLabel labelKey="settings.mention_menu_behavior" helpKey="settings.help.mention_menu_behavior" />

                </template>
        <el-select v-model="formData.mention_menu_behavior">
          <el-option v-for="item in mentionMenuBehaviorOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.cost_currency')" prop="cost_currency">
        <template #label>

                  <FormItemLabel labelKey="settings.cost_currency" helpKey="settings.help.cost_currency" />

                </template>
        <el-select v-model="formData.cost_currency">
          <el-option v-for="item in costCurrencyOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.verbosity')" prop="verbosity">
        <template #label>

                  <FormItemLabel labelKey="settings.verbosity" helpKey="settings.help.verbosity" />

                </template>
        <el-select v-model="formData.verbosity">
          <el-option v-for="item in verbosityOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.show_thinking')" prop="show_thinking">
        <template #label>

                  <FormItemLabel labelKey="settings.show_thinking" helpKey="settings.help.show_thinking" />

                </template>
        <el-switch v-model="formData.show_thinking" />
      </el-form-item>
      <el-form-item :label="$t('settings.show_tool_details')" prop="show_tool_details">
        <template #label>

                  <FormItemLabel labelKey="settings.show_tool_details" helpKey="settings.help.show_tool_details" />

                </template>
        <el-switch v-model="formData.show_tool_details" />
      </el-form-item>
      <el-form-item :label="$t('settings.auto_compact')" prop="auto_compact">
        <template #label>

                  <FormItemLabel labelKey="settings.auto_compact" helpKey="settings.help.auto_compact" />

                </template>
        <el-switch v-model="formData.auto_compact" />
      </el-form-item>
      <el-form-item :label="$t('settings.paste_burst_detection')" prop="paste_burst_detection">
        <template #label>

                  <FormItemLabel labelKey="settings.paste_burst_detection" helpKey="settings.help.paste_burst_detection" />

                </template>
        <el-switch v-model="formData.paste_burst_detection" />
      </el-form-item>
      <el-form-item :label="$t('settings.auto_compact_threshold_percent')" prop="auto_compact_threshold_percent">
        <template #label>

                  <FormItemLabel labelKey="settings.auto_compact_threshold_percent" helpKey="settings.help.auto_compact_threshold_percent" />

                </template>
        <el-input-number v-model="formData.auto_compact_threshold_percent" :min="10" :max="100" />
      </el-form-item>
      <el-form-item :label="$t('settings.mention_menu_limit')" prop="mention_menu_limit">
        <template #label>

                  <FormItemLabel labelKey="settings.mention_menu_limit" helpKey="settings.help.mention_menu_limit" />

                </template>
        <el-input-number v-model="formData.mention_menu_limit" :min="1" />
      </el-form-item>
      <el-form-item :label="$t('settings.mention_walk_depth')" prop="mention_walk_depth">
        <template #label>

                  <FormItemLabel labelKey="settings.mention_walk_depth" helpKey="settings.help.mention_walk_depth" />

                </template>
        <el-input-number v-model="formData.mention_walk_depth" :min="0" />
      </el-form-item>
      <el-form-item :label="$t('settings.max_history')" prop="max_history">
        <template #label>

                  <FormItemLabel labelKey="settings.max_history" helpKey="settings.help.max_history" />

                </template>
        <el-input-number v-model="formData.max_history" :min="1" />
      </el-form-item>
      <el-form-item :label="$t('settings.background_color')" prop="background_color">
        <template #label>

                  <FormItemLabel labelKey="settings.background_color" helpKey="settings.help.background_color" />

                </template>
        <el-input v-model="formData.background_color" placeholder="#RRGGBB or default" />
      </el-form-item>
      <el-form-item :label="$t('settings.default_model_override')" prop="default_model">
        <template #label>

                  <FormItemLabel labelKey="settings.default_model_override" helpKey="settings.help.default_model_override" />

                </template>
        <el-input v-model="formData.default_model" :placeholder="$t('settings.default_model_placeholder')" disabled />
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

  const themeOptions = computed(() => getSettingsOptions('theme', locale.value));
  const defaultModeOptions = computed(() => getSettingsOptions('default_mode', locale.value));
  const sidebarFocusOptions = computed(() => getSettingsOptions('sidebar_focus', locale.value));
  const mentionMenuBehaviorOptions = computed(() => getSettingsOptions('mention_menu_behavior', locale.value));
  const costCurrencyOptions = computed(() => getSettingsOptions('cost_currency', locale.value));
  const verbosityOptions = computed(() => getSettingsOptions('verbosity', locale.value));

  </script>

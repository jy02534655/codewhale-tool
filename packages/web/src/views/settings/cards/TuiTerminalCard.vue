<!--
  TuiTerminalCard.vue — 通用设置：TUI 终端卡片
  负责 tui_alternate_screen / tui_mouse_capture /
  tui_terminal_probe_timeout_ms / tui_stream_chunk_timeout_secs / tui_osc8_links
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.tui_terminal_title') }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item :label="$t('settings.tui_alternate_screen')" prop="tui_alternate_screen">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.tui_alternate_screen') }}</span>
            <el-tooltip placement="top" :content="helpText.tui_alternate_screen">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.tui_alternate_screen">
          <el-option v-for="item in tuiAlternateScreenOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.tui_mouse_capture')" prop="tui_mouse_capture">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.tui_mouse_capture') }}</span>
            <el-tooltip placement="top" :content="helpText.tui_mouse_capture">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.tui_mouse_capture" />
      </el-form-item>
      <el-form-item :label="$t('settings.tui_terminal_probe_timeout_ms')" prop="tui_terminal_probe_timeout_ms">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.tui_terminal_probe_timeout_ms') }}</span>
            <el-tooltip placement="top" :content="helpText.tui_terminal_probe_timeout_ms">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.tui_terminal_probe_timeout_ms" :min="100" :max="5000" />
      </el-form-item>
      <el-form-item :label="$t('settings.tui_stream_chunk_timeout_secs')" prop="tui_stream_chunk_timeout_secs">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.tui_stream_chunk_timeout_secs') }}</span>
            <el-tooltip placement="top" :content="helpText.tui_stream_chunk_timeout_secs">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.tui_stream_chunk_timeout_secs" :min="1" :max="3600" />
      </el-form-item>
      <el-form-item :label="$t('settings.tui_osc8_links')" prop="tui_osc8_links">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.tui_osc8_links') }}</span>
            <el-tooltip placement="top" :content="helpText.tui_osc8_links">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.tui_osc8_links" />
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

const tuiAlternateScreenOptions = computed(() => getSettingsOptions('tui_alternate_screen', locale.value));

const helpText = {
  tui_alternate_screen: settingsHelp.tui_alternate_screen,
  tui_mouse_capture: settingsHelp.tui_mouse_capture,
  tui_terminal_probe_timeout_ms: settingsHelp.tui_terminal_probe_timeout_ms,
  tui_stream_chunk_timeout_secs: settingsHelp.tui_stream_chunk_timeout_secs,
  tui_osc8_links: settingsHelp.tui_osc8_links,
};
</script>
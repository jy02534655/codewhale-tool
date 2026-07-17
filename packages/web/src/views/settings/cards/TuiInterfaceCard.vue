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
          <div class="form-item-label">
            <span>{{ $t('settings.theme') }}</span>
            <el-tooltip placement="top" :content="helpText.theme">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.theme">
          <el-option v-for="item in themeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.default_mode')" prop="default_mode">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.default_mode') }}</span>
            <el-tooltip placement="top" :content="helpText.default_mode">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.default_mode">
          <el-option v-for="item in defaultModeOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.sidebar_focus')" prop="sidebar_focus">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.sidebar_focus') }}</span>
            <el-tooltip placement="top" :content="helpText.sidebar_focus">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.sidebar_focus">
          <el-option v-for="item in sidebarFocusOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.mention_menu_behavior')" prop="mention_menu_behavior">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.mention_menu_behavior') }}</span>
            <el-tooltip placement="top" :content="helpText.mention_menu_behavior">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.mention_menu_behavior">
          <el-option v-for="item in mentionMenuBehaviorOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.cost_currency')" prop="cost_currency">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.cost_currency') }}</span>
            <el-tooltip placement="top" :content="helpText.cost_currency">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.cost_currency">
          <el-option v-for="item in costCurrencyOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.verbosity')" prop="verbosity">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.verbosity') }}</span>
            <el-tooltip placement="top" :content="helpText.verbosity">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="formData.verbosity">
          <el-option v-for="item in verbosityOptions" :key="item.value" :value="item.value" :label="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.show_thinking')" prop="show_thinking">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.show_thinking') }}</span>
            <el-tooltip placement="top" :content="helpText.show_thinking">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.show_thinking" />
      </el-form-item>
      <el-form-item :label="$t('settings.show_tool_details')" prop="show_tool_details">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.show_tool_details') }}</span>
            <el-tooltip placement="top" :content="helpText.show_tool_details">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.show_tool_details" />
      </el-form-item>
      <el-form-item :label="$t('settings.auto_compact')" prop="auto_compact">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.auto_compact') }}</span>
            <el-tooltip placement="top" :content="helpText.auto_compact">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.auto_compact" />
      </el-form-item>
      <el-form-item :label="$t('settings.paste_burst_detection')" prop="paste_burst_detection">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.paste_burst_detection') }}</span>
            <el-tooltip placement="top" :content="helpText.paste_burst_detection">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-switch v-model="formData.paste_burst_detection" />
      </el-form-item>
      <el-form-item :label="$t('settings.auto_compact_threshold_percent')" prop="auto_compact_threshold_percent">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.auto_compact_threshold_percent') }}</span>
            <el-tooltip placement="top" :content="helpText.auto_compact_threshold_percent">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.auto_compact_threshold_percent" :min="10" :max="100" />
      </el-form-item>
      <el-form-item :label="$t('settings.mention_menu_limit')" prop="mention_menu_limit">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.mention_menu_limit') }}</span>
            <el-tooltip placement="top" :content="helpText.mention_menu_limit">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.mention_menu_limit" :min="1" />
      </el-form-item>
      <el-form-item :label="$t('settings.mention_walk_depth')" prop="mention_walk_depth">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.mention_walk_depth') }}</span>
            <el-tooltip placement="top" :content="helpText.mention_walk_depth">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.mention_walk_depth" :min="0" />
      </el-form-item>
      <el-form-item :label="$t('settings.max_history')" prop="max_history">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.max_history') }}</span>
            <el-tooltip placement="top" :content="helpText.max_history">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input-number v-model="formData.max_history" :min="1" />
      </el-form-item>
      <el-form-item :label="$t('settings.background_color')" prop="background_color">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.background_color') }}</span>
            <el-tooltip placement="top" :content="helpText.background_color">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.background_color" placeholder="#RRGGBB or default" />
      </el-form-item>
      <el-form-item :label="$t('settings.default_model_override')" prop="default_model">
        <template #label>
          <div class="form-item-label">
            <span>{{ $t('settings.default_model_override') }}</span>
            <el-tooltip placement="top" :content="helpText.default_model_override">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="formData.default_model" :placeholder="$t('settings.default_model_placeholder')" disabled />
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

const themeOptions = computed(() => getSettingsOptions('theme', locale.value));
const defaultModeOptions = computed(() => getSettingsOptions('default_mode', locale.value));
const sidebarFocusOptions = computed(() => getSettingsOptions('sidebar_focus', locale.value));
const mentionMenuBehaviorOptions = computed(() => getSettingsOptions('mention_menu_behavior', locale.value));
const costCurrencyOptions = computed(() => getSettingsOptions('cost_currency', locale.value));
const verbosityOptions = computed(() => getSettingsOptions('verbosity', locale.value));

const helpText = {
  theme: settingsHelp.theme,
  default_mode: settingsHelp.default_mode,
  sidebar_focus: settingsHelp.sidebar_focus,
  mention_menu_behavior: settingsHelp.mention_menu_behavior,
  cost_currency: settingsHelp.cost_currency,
  verbosity: settingsHelp.verbosity,
  show_thinking: settingsHelp.show_thinking,
  show_tool_details: settingsHelp.show_tool_details,
  auto_compact: settingsHelp.auto_compact,
  paste_burst_detection: settingsHelp.paste_burst_detection,
  auto_compact_threshold_percent: settingsHelp.auto_compact_threshold_percent,
  mention_menu_limit: settingsHelp.mention_menu_limit,
  mention_walk_depth: settingsHelp.mention_walk_depth,
  max_history: settingsHelp.max_history,
  background_color: settingsHelp.background_color,
  default_model_override: settingsHelp.default_model_override,
};
</script>
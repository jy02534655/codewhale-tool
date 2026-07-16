<!--
  index.vue — 通用设置页面（Masonry 瀑布流布局版）
  使用 CSS column-count 实现多列卡片布局，保留批量保存、取消、恢复默认。
-->
<template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('settings.title') }}</span>
      </div>

      <!-- ========== 操作按钮 ========== -->
      <div class="action-bar">
        <el-button type="primary" @click="onSave">{{ $t('settings.actions_save') }}</el-button>
        <el-button @click="onCancel">{{ $t('settings.actions_cancel') }}</el-button>
        <el-button @click="onRestoreDefaults">{{ $t('settings.actions_restore_defaults') }}</el-button>
      </div>

      <el-form ref="settingsFormRef" :model="form" :rules="rules" label-width="auto" size="default">

        <div class="settings-masonry">

        <!-- ========== 基础设置 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.basic_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.language')" label-width="140px">
              <el-select v-model="form.locale" @change="onSave">
                <el-option
                  v-for="item in locales"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.default_model')" label-width="140px" class="full-width">
              <el-input
                v-model="form.default_text_model"
                :placeholder="$t('settings.default_model_placeholder')"
                @blur="onSave"
              />
            </el-form-item>
            <el-form-item :label="$t('settings.update_check_for_updates')" label-width="140px">
              <el-switch v-model="form.update_check_for_updates" @change="onSave" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== TUI 界面 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.tui_interface_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.theme')" prop="theme">
              <el-select v-model="form.theme">
                <el-option v-for="item in themeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.default_mode')" prop="default_mode">
              <el-select v-model="form.default_mode">
                <el-option v-for="item in defaultModeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.sidebar_focus')" prop="sidebar_focus">
              <el-select v-model="form.sidebar_focus">
                <el-option v-for="item in sidebarFocusOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.mention_menu_behavior')" prop="mention_menu_behavior">
              <el-select v-model="form.mention_menu_behavior">
                <el-option v-for="item in mentionMenuBehaviorOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.cost_currency')" prop="cost_currency">
              <el-select v-model="form.cost_currency">
                <el-option v-for="item in costCurrencyOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.verbosity')" prop="verbosity">
              <el-select v-model="form.verbosity">
                <el-option v-for="item in verbosityOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.show_thinking')" prop="show_thinking">
              <el-switch v-model="form.show_thinking" />
            </el-form-item>
            <el-form-item :label="$t('settings.show_tool_details')" prop="show_tool_details">
              <el-switch v-model="form.show_tool_details" />
            </el-form-item>
            <el-form-item :label="$t('settings.auto_compact')" prop="auto_compact">
              <el-switch v-model="form.auto_compact" />
            </el-form-item>
            <el-form-item :label="$t('settings.paste_burst_detection')" prop="paste_burst_detection">
              <el-switch v-model="form.paste_burst_detection" />
            </el-form-item>
            <el-form-item :label="$t('settings.auto_compact_threshold_percent')" prop="auto_compact_threshold_percent">
              <el-input-number v-model="form.auto_compact_threshold_percent" :min="10" :max="100" />
            </el-form-item>
            <el-form-item :label="$t('settings.mention_menu_limit')" prop="mention_menu_limit">
              <el-input-number v-model="form.mention_menu_limit" :min="1" />
            </el-form-item>
            <el-form-item :label="$t('settings.mention_walk_depth')" prop="mention_walk_depth">
              <el-input-number v-model="form.mention_walk_depth" :min="0" />
            </el-form-item>
            <el-form-item :label="$t('settings.max_history')" prop="max_history">
              <el-input-number v-model="form.max_history" :min="1" />
            </el-form-item>
            <el-form-item :label="$t('settings.background_color')" prop="background_color">
              <el-input v-model="form.background_color" placeholder="#RRGGBB or default" />
            </el-form-item>
            <el-form-item :label="$t('settings.default_model_override')" prop="default_model">
              <el-input v-model="form.default_model" :placeholder="$t('settings.default_model_placeholder')" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== TUI 终端 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.tui_terminal_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.tui_alternate_screen')" prop="tui_alternate_screen">
              <el-select v-model="form.tui_alternate_screen">
                <el-option v-for="item in tuiAlternateScreenOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.tui_mouse_capture')" prop="tui_mouse_capture">
              <el-switch v-model="form.tui_mouse_capture" />
            </el-form-item>
            <el-form-item :label="$t('settings.tui_terminal_probe_timeout_ms')" prop="tui_terminal_probe_timeout_ms">
              <el-input-number v-model="form.tui_terminal_probe_timeout_ms" :min="100" :max="5000" />
            </el-form-item>
            <el-form-item :label="$t('settings.tui_stream_chunk_timeout_secs')" prop="tui_stream_chunk_timeout_secs">
              <el-input-number v-model="form.tui_stream_chunk_timeout_secs" :min="1" :max="3600" />
            </el-form-item>
            <el-form-item :label="$t('settings.tui_osc8_links')" prop="tui_osc8_links">
              <el-switch v-model="form.tui_osc8_links" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 安全与审批 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.security_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.approval_policy')" prop="approval_policy">
              <el-select v-model="form.approval_policy">
                <el-option v-for="item in approvalPolicyOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.sandbox_mode')" prop="sandbox_mode">
              <el-select v-model="form.sandbox_mode">
                <el-option v-for="item in sandboxModeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.allow_shell')" prop="allow_shell">
              <el-switch v-model="form.allow_shell" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 子代理 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.subagents_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.subagents_max_concurrent')" prop="subagents_max_concurrent">
              <el-input-number v-model="form.subagents_max_concurrent" :min="1" :max="20" />
            </el-form-item>
            <el-form-item :label="$t('settings.subagents_token_budget')" prop="subagents_token_budget">
              <el-input-number v-model="form.subagents_token_budget" :min="0" />
            </el-form-item>
            <el-form-item :label="$t('settings.subagents_api_timeout_secs')" prop="subagents_api_timeout_secs">
              <el-input-number v-model="form.subagents_api_timeout_secs" :min="1" :max="1800" />
            </el-form-item>
            <el-form-item :label="$t('settings.subagents_heartbeat_timeout_secs')" prop="subagents_heartbeat_timeout_secs">
              <el-input-number v-model="form.subagents_heartbeat_timeout_secs" :min="30" :max="3600" />
            </el-form-item>
            <el-form-item :label="$t('settings.subagents_default_model')" prop="subagents_default_model">
              <el-input v-model="form.subagents_default_model" placeholder="deepseek-v4-pro" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 重试 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.retry_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.retry_enabled')" prop="retry_enabled">
              <el-switch v-model="form.retry_enabled" />
            </el-form-item>
            <el-form-item :label="$t('settings.retry_max_retries')" prop="retry_max_retries">
              <el-input-number v-model="form.retry_max_retries" :min="0" :max="10" />
            </el-form-item>
            <el-form-item :label="$t('settings.retry_initial_delay')" prop="retry_initial_delay">
              <el-input-number v-model="form.retry_initial_delay" :min="0" :max="60" :step="0.1" />
            </el-form-item>
            <el-form-item :label="$t('settings.retry_max_delay')" prop="retry_max_delay">
              <el-input-number v-model="form.retry_max_delay" :min="0" :max="300" :step="0.1" />
            </el-form-item>
            <el-form-item :label="$t('settings.retry_exponential_base')" prop="retry_exponential_base">
              <el-input-number v-model="form.retry_exponential_base" :min="1" :max="10" :step="0.1" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 通知 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.notifications_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.notifications_method')" prop="notifications_method">
              <el-select v-model="form.notifications_method">
                <el-option v-for="item in notificationsMethodOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.notifications_threshold_secs')" prop="notifications_threshold_secs">
              <el-input-number v-model="form.notifications_threshold_secs" :min="0" :max="3600" />
            </el-form-item>
            <el-form-item :label="$t('settings.notifications_completion_sound')" prop="notifications_completion_sound">
              <el-select v-model="form.notifications_completion_sound">
                <el-option v-for="item in notificationsCompletionSoundOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 功能开关 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.features_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.features_shell_tool')" prop="features_shell_tool">
              <el-switch v-model="form.features_shell_tool" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_subagents')" prop="features_subagents">
              <el-switch v-model="form.features_subagents" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_web_search')" prop="features_web_search">
              <el-switch v-model="form.features_web_search" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_apply_patch')" prop="features_apply_patch">
              <el-switch v-model="form.features_apply_patch" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_mcp')" prop="features_mcp">
              <el-switch v-model="form.features_mcp" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_exec_policy')" prop="features_exec_policy">
              <el-switch v-model="form.features_exec_policy" />
            </el-form-item>
            <el-form-item :label="$t('settings.features_vision_model')" prop="features_vision_model">
              <el-switch v-model="form.features_vision_model" />
            </el-form-item>
          </div>
        </el-card>

        <!-- ========== 搜索 ========== -->
        <el-card class="settings-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="section-title">{{ $t('settings.search_title') }}</span>
            </div>
          </template>
          <div class="settings-grid">
            <el-form-item :label="$t('settings.search_provider')" prop="search_provider">
              <el-select v-model="form.search_provider">
                <el-option v-for="item in searchProviderOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('settings.search_base_url')" prop="search_base_url">
              <el-input v-model="form.search_base_url" placeholder="https://..." />
            </el-form-item>
          </div>
        </el-card>


        </div>

      <!-- ========== Instructions ========== -->
      <el-card class="settings-card instructions-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.instructions_title') }}</span>
            <div>
              <el-button type="primary" size="small" @click="onAddInstruction">
                {{ $t('settings.instructions_add') }}
              </el-button>
              <el-button type="success" size="small" @click="updateInstructions">
                {{ $t('settings.actions_save') }}
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="form.instructions.length === 0" class="instructions-empty">
          {{ $t('settings.instructions_empty') }}
        </div>
        <div v-else class="instruction-list">
          <div v-for="(inst, index) in form.instructions" :key="index" class="instruction-item">
            <div class="instruction-main">
              <div class="instruction-info">
                <span class="instruction-path">{{ inst.path }}</span>
                <el-tag v-if="inst.readonly" type="info" size="small">
                  {{ $t('settings.instruction_readonly') }}
                </el-tag>
              </div>
              <div class="instruction-actions">
                <el-button v-if="!inst.readonly" type="primary" link size="small" @click="onEditInstruction(index)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button v-if="!inst.readonly" type="danger" link size="small" @click="onRemoveInstruction(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
                <el-button type="primary" link size="small" :disabled="index === 0" @click="moveInstruction(index, -1)">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button type="primary" link size="small" :disabled="index === form.instructions.length - 1" @click="moveInstruction(index, 1)">
                  <el-icon><Bottom /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-if="inst.content" class="instruction-content">{{ inst.content }}</div>
          </div>
        </div>

        <InstructionDialog ref="instructionDialog" @submitSuccess="onInstructionSubmit" />
      </el-card>

      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Edit, Delete, Top, Bottom } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSettings, getSettingsDefaults, updateSettings, updateInstructions as updateInstructionsApi } from '@/api/settings';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import InstructionDialog from './edit/instruction.vue';
import { getSettingsOptions } from '@/utils/i18n/settings-options';

const { t, locale } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

// ========== 表单引用 ==========
const settingsFormRef = ref(null);

// ========== 表单数据 ==========
const form = reactive({
  locale: 'zh-Hans',
  default_text_model: 'deepseek-v4-pro',
  instructions: [],
  theme: 'system',
  default_mode: 'agent',
  sidebar_focus: 'pinned',
  show_thinking: true,
  show_tool_details: true,
  auto_compact: true,
  auto_compact_threshold_percent: 80,
  paste_burst_detection: true,
  mention_menu_limit: 128,
  mention_walk_depth: 6,
  mention_menu_behavior: 'fuzzy',
  cost_currency: 'usd',
  background_color: 'default',
  max_history: 1000,
  verbosity: 'normal',
  tui_alternate_screen: 'auto',
  tui_mouse_capture: true,
  tui_terminal_probe_timeout_ms: 500,
  tui_stream_chunk_timeout_secs: 300,
  tui_osc8_links: true,
  approval_policy: 'on-request',
  sandbox_mode: 'read-only',
  allow_shell: false,
  subagents_max_concurrent: 20,
  subagents_token_budget: 0,
  subagents_api_timeout_secs: 120,
  subagents_heartbeat_timeout_secs: 300,
  subagents_default_model: '',
  retry_enabled: true,
  retry_max_retries: 3,
  retry_initial_delay: 1.0,
  retry_max_delay: 60.0,
  retry_exponential_base: 2.0,
  notifications_method: 'auto',
  notifications_threshold_secs: 30,
  notifications_completion_sound: 'beep',
  features_shell_tool: true,
  features_subagents: true,
  features_web_search: true,
  features_apply_patch: true,
  features_mcp: true,
  features_exec_policy: true,
  features_vision_model: false,
  search_provider: 'duckduckgo',
  search_base_url: '',
  update_check_for_updates: true,
});

// 用于取消重置的原始数据快照
const originalForm = JSON.parse(JSON.stringify(form));

// ========== 表单校验规则 ==========
const rules = {
  locale: [{ required: true, message: t('common.required'), trigger: 'change' }],
  default_text_model: [{ required: true, message: t('common.required'), trigger: 'change' }],
  theme: [{ required: true, message: t('common.required'), trigger: 'change' }],
  default_mode: [{ required: true, message: t('common.required'), trigger: 'change' }],
  sidebar_focus: [{ required: true, message: t('common.required'), trigger: 'change' }],
  mention_menu_behavior: [{ required: true, message: t('common.required'), trigger: 'change' }],
  cost_currency: [{ required: true, message: t('common.required'), trigger: 'change' }],
  verbosity: [{ required: true, message: t('common.required'), trigger: 'change' }],
  tui_alternate_screen: [{ required: true, message: t('common.required'), trigger: 'change' }],
  approval_policy: [{ required: true, message: t('common.required'), trigger: 'change' }],
  sandbox_mode: [{ required: true, message: t('common.required'), trigger: 'change' }],
  notifications_method: [{ required: true, message: t('common.required'), trigger: 'change' }],
  notifications_completion_sound: [{ required: true, message: t('common.required'), trigger: 'change' }],
  search_provider: [{ required: true, message: t('common.required'), trigger: 'change' }],
};

// ========== 语言选项 ==========
const locales = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
];

// ========== 下拉选项（独立配置，随 locale 自动更新） ==========
const themeOptions = computed(() => getSettingsOptions('theme', locale.value));
const defaultModeOptions = computed(() => getSettingsOptions('default_mode', locale.value));
const sidebarFocusOptions = computed(() => getSettingsOptions('sidebar_focus', locale.value));
const mentionMenuBehaviorOptions = computed(() => getSettingsOptions('mention_menu_behavior', locale.value));
const costCurrencyOptions = computed(() => getSettingsOptions('cost_currency', locale.value));
const verbosityOptions = computed(() => getSettingsOptions('verbosity', locale.value));
const tuiAlternateScreenOptions = computed(() => getSettingsOptions('tui_alternate_screen', locale.value));
const approvalPolicyOptions = computed(() => getSettingsOptions('approval_policy', locale.value));
const sandboxModeOptions = computed(() => getSettingsOptions('sandbox_mode', locale.value));
const notificationsMethodOptions = computed(() => getSettingsOptions('notifications_method', locale.value));
const notificationsCompletionSoundOptions = computed(() => getSettingsOptions('notifications_completion_sound', locale.value));
const searchProviderOptions = computed(() => getSettingsOptions('search_provider', locale.value));

// ========== Masonry 卡片定义 ==========
const settingCards = [
  { key: 'basic', hasHeader: true, titleKey: 'settings.basic_title' },
  { key: 'tui_interface', hasHeader: true, titleKey: 'settings.tui_interface_title' },
  { key: 'tui_terminal', hasHeader: true, titleKey: 'settings.tui_terminal_title' },
  { key: 'security', hasHeader: true, titleKey: 'settings.security_title' },
  { key: 'subagents', hasHeader: true, titleKey: 'settings.subagents_title' },
  { key: 'retry', hasHeader: true, titleKey: 'settings.retry_title' },
  { key: 'notifications', hasHeader: true, titleKey: 'settings.notifications_title' },
  { key: 'features', hasHeader: true, titleKey: 'settings.features_title' },
  { key: 'search', hasHeader: true, titleKey: 'settings.search_title' },
  { key: 'update', hasHeader: true, titleKey: 'settings.update_title' },
];

// ========== 获取设置 ==========
function fetchSettings() {
  maskingStore.loading({ view: 'settings' });
  getSettings()
    .then(function (data) {
      if (!data) return;
      Object.assign(form, {
        locale: data.locale || 'zh-Hans',
        default_text_model: data.default_text_model || 'deepseek-v4-pro',
        instructions: data.instructions || [],
        theme: data.theme || 'system',
        default_mode: data.default_mode || 'agent',
        sidebar_focus: data.sidebar_focus || 'pinned',
        show_thinking: data.show_thinking ?? true,
        show_tool_details: data.show_tool_details ?? true,
        auto_compact: data.auto_compact ?? true,
        auto_compact_threshold_percent: data.auto_compact_threshold_percent || 80,
        paste_burst_detection: data.paste_burst_detection ?? true,
        mention_menu_limit: data.mention_menu_limit || 128,
        mention_walk_depth: data.mention_walk_depth ?? 6,
        mention_menu_behavior: data.mention_menu_behavior || 'fuzzy',
        cost_currency: data.cost_currency || 'usd',
        background_color: data.background_color || 'default',
        max_history: data.max_history || 1000,
        verbosity: data.verbosity || 'normal',
        tui_alternate_screen: data.tui_alternate_screen || 'auto',
        tui_mouse_capture: data.tui_mouse_capture ?? true,
        tui_terminal_probe_timeout_ms: data.tui_terminal_probe_timeout_ms || 500,
        tui_stream_chunk_timeout_secs: data.tui_stream_chunk_timeout_secs || 300,
        tui_osc8_links: data.tui_osc8_links ?? true,
        approval_policy: data.approval_policy || 'on-request',
        sandbox_mode: data.sandbox_mode || 'read-only',
        allow_shell: data.allow_shell ?? false,
        subagents_max_concurrent: data.subagents_max_concurrent || 20,
        subagents_token_budget: data.subagents_token_budget || 0,
        subagents_api_timeout_secs: data.subagents_api_timeout_secs || 120,
        subagents_heartbeat_timeout_secs: data.subagents_heartbeat_timeout_secs || 300,
        subagents_default_model: data.subagents_default_model || '',
        retry_enabled: data.retry_enabled ?? true,
        retry_max_retries: data.retry_max_retries || 3,
        retry_initial_delay: data.retry_initial_delay ?? 1.0,
        retry_max_delay: data.retry_max_delay ?? 60.0,
        retry_exponential_base: data.retry_exponential_base ?? 2.0,
        notifications_method: data.notifications_method || 'auto',
        notifications_threshold_secs: data.notifications_threshold_secs || 30,
        notifications_completion_sound: data.notifications_completion_sound || 'beep',
        features_shell_tool: data.features_shell_tool ?? true,
        features_subagents: data.features_subagents ?? true,
        features_web_search: data.features_web_search ?? true,
        features_apply_patch: data.features_apply_patch ?? true,
        features_mcp: data.features_mcp ?? true,
        features_exec_policy: data.features_exec_policy ?? true,
        features_vision_model: data.features_vision_model ?? false,
        search_provider: data.search_provider || 'duckduckgo',
        search_base_url: data.search_base_url || '',
        update_check_for_updates: data.update_check_for_updates ?? true,
      });
      // 同步原始快照
      Object.assign(originalForm, JSON.parse(JSON.stringify(form)));
    })
      .finally(function () {
        maskingStore.clear({ view: 'settings' });
      });
}

// ========== 保存 ==========
function onSave() {
  settingsFormRef.value.validate(function (valid) {
    if (!valid) {
      ElMessage.warning('请检查表单填写是否正确');
      return;
    }
    maskingStore.loading({ view: 'settings' });
    updateSettings({
      locale: form.locale,
      default_text_model: form.default_text_model,
      theme: form.theme,
      default_mode: form.default_mode,
      sidebar_focus: form.sidebar_focus,
      show_thinking: form.show_thinking,
      show_tool_details: form.show_tool_details,
      auto_compact: form.auto_compact,
      auto_compact_threshold_percent: form.auto_compact_threshold_percent,
      paste_burst_detection: form.paste_burst_detection,
      mention_menu_limit: form.mention_menu_limit,
      mention_walk_depth: form.mention_walk_depth,
      mention_menu_behavior: form.mention_menu_behavior,
      cost_currency: form.cost_currency,
      background_color: form.background_color,
      max_history: form.max_history,
      verbosity: form.verbosity,
      tui_alternate_screen: form.tui_alternate_screen,
      tui_mouse_capture: form.tui_mouse_capture,
      tui_terminal_probe_timeout_ms: form.tui_terminal_probe_timeout_ms,
      tui_stream_chunk_timeout_secs: form.tui_stream_chunk_timeout_secs,
      tui_osc8_links: form.tui_osc8_links,
      approval_policy: form.approval_policy,
      sandbox_mode: form.sandbox_mode,
      allow_shell: form.allow_shell,
      subagents_max_concurrent: form.subagents_max_concurrent,
      subagents_token_budget: form.subagents_token_budget,
      subagents_api_timeout_secs: form.subagents_api_timeout_secs,
      subagents_heartbeat_timeout_secs: form.subagents_heartbeat_timeout_secs,
      subagents_default_model: form.subagents_default_model,
      retry_enabled: form.retry_enabled,
      retry_max_retries: form.retry_max_retries,
      retry_initial_delay: form.retry_initial_delay,
      retry_max_delay: form.retry_max_delay,
      retry_exponential_base: form.retry_exponential_base,
      notifications_method: form.notifications_method,
      notifications_threshold_secs: form.notifications_threshold_secs,
      notifications_completion_sound: form.notifications_completion_sound,
      features_shell_tool: form.features_shell_tool,
      features_subagents: form.features_subagents,
      features_web_search: form.features_web_search,
      features_apply_patch: form.features_apply_patch,
      features_mcp: form.features_mcp,
      features_exec_policy: form.features_exec_policy,
      features_vision_model: form.features_vision_model,
      search_provider: form.search_provider,
      search_base_url: form.search_base_url,
      update_check_for_updates: form.update_check_for_updates,
    })
      .then(function () {
        // 保存成功后更新原始快照
        Object.assign(originalForm, JSON.parse(JSON.stringify(form)));
        ElMessage.success(t('settings.save_success'));
      })
      .catch(function () {
        // 失败不更新快照，保留上次成功状态
      })
      .finally(function () {
        maskingStore.clear({ view: 'settings' });
      });
    });
}

// ========== 取消 ==========
function onCancel() {
  // 将 form 重置为原始快照
  Object.assign(form, JSON.parse(JSON.stringify(originalForm)));
  // 清除校验状态
  settingsFormRef.value.clearValidate();
  ElMessage.info(t('settings.cancel_reset'));
}

// ========== 恢复默认 ==========
function onRestoreDefaults() {
  ElMessageBox.confirm(t('settings.reset_confirm_message'), t('settings.reset_confirm_title'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  })
      .then(function () {
        maskingStore.loading({ view: 'settings' });
        return getSettingsDefaults();
    })
    .then(function (data) {
      if (!data) return;
      Object.assign(form, {
        locale: data.locale || 'zh-Hans',
        default_text_model: data.default_text_model || 'deepseek-v4-pro',
        instructions: data.instructions || [],
        theme: data.theme || 'system',
        default_mode: data.default_mode || 'agent',
        sidebar_focus: data.sidebar_focus || 'pinned',
        show_thinking: data.show_thinking ?? true,
        show_tool_details: data.show_tool_details ?? true,
        auto_compact: data.auto_compact ?? true,
        auto_compact_threshold_percent: data.auto_compact_threshold_percent || 80,
        paste_burst_detection: data.paste_burst_detection ?? true,
        mention_menu_limit: data.mention_menu_limit || 128,
        mention_walk_depth: data.mention_walk_depth ?? 6,
        mention_menu_behavior: data.mention_menu_behavior || 'fuzzy',
        cost_currency: data.cost_currency || 'usd',
        background_color: data.background_color || 'default',
        max_history: data.max_history || 1000,
        verbosity: data.verbosity || 'normal',
        tui_alternate_screen: data.tui_alternate_screen || 'auto',
        tui_mouse_capture: data.tui_mouse_capture ?? true,
        tui_terminal_probe_timeout_ms: data.tui_terminal_probe_timeout_ms || 500,
        tui_stream_chunk_timeout_secs: data.tui_stream_chunk_timeout_secs || 300,
        tui_osc8_links: data.tui_osc8_links ?? true,
        approval_policy: data.approval_policy || 'on-request',
        sandbox_mode: data.sandbox_mode || 'read-only',
        allow_shell: data.allow_shell ?? false,
        subagents_max_concurrent: data.subagents_max_concurrent || 20,
        subagents_token_budget: data.subagents_token_budget || 0,
        subagents_api_timeout_secs: data.subagents_api_timeout_secs || 120,
        subagents_heartbeat_timeout_secs: data.subagents_heartbeat_timeout_secs || 300,
        subagents_default_model: data.subagents_default_model || '',
        retry_enabled: data.retry_enabled ?? true,
        retry_max_retries: data.retry_max_retries || 3,
        retry_initial_delay: data.retry_initial_delay ?? 1.0,
        retry_max_delay: data.retry_max_delay ?? 60.0,
        retry_exponential_base: data.retry_exponential_base ?? 2.0,
        notifications_method: data.notifications_method || 'auto',
        notifications_threshold_secs: data.notifications_threshold_secs || 30,
        notifications_completion_sound: data.notifications_completion_sound || 'beep',
        features_shell_tool: data.features_shell_tool ?? true,
        features_subagents: data.features_subagents ?? true,
        features_web_search: data.features_web_search ?? true,
        features_apply_patch: data.features_apply_patch ?? true,
        features_mcp: data.features_mcp ?? true,
        features_exec_policy: data.features_exec_policy ?? true,
        features_vision_model: data.features_vision_model ?? false,
        search_provider: data.search_provider || 'duckduckgo',
        search_base_url: data.search_base_url || '',
        update_check_for_updates: data.update_check_for_updates ?? true,
      });
      // 注意：这里不更新 originalForm，让用户确认后手动点击保存
      ElMessage.success(t('settings.reset_success'));
    })
    .catch(function () {
      // 用户取消恢复
    })
    .finally(function () {
      maskingStore.clear({ view: 'settings' });
    });
}

// ========== Instructions ==========
function onAddInstruction() {
  editingInstructionIndex.value = -1;
  dialogCtrl.showAddDialog(null, 'instructionDialog');
}

function onEditInstruction(index) {
  editingInstructionIndex.value = index;
  dialogCtrl.showEditDialog(form.instructions[index], 'instructionDialog');
}

function onInstructionSubmit({ data, state }) {
  if (state === 0) {
    form.instructions.push({ path: data.path, content: data.content });
  } else if (state === 1 && editingInstructionIndex.value >= 0 && editingInstructionIndex.value < form.instructions.length) {
    form.instructions[editingInstructionIndex.value] = { path: data.path, content: data.content };
  }
  // 不再自动保存，等待用户点击保存按钮
}

function onRemoveInstruction(index) {
  form.instructions.splice(index, 1);
  // 不再自动保存
}

// ========== 独立保存 Instructions ==========
function updateInstructions() {
  maskingStore.loading({ view: 'settings' });
  updateInstructionsApi(form.instructions)
    .then(function () {
      Object.assign(originalForm, JSON.parse(JSON.stringify(form)));
      ElMessage.success(t('settings.save_success'));
    })
    .catch(function () {
      // 失败不更新快照
    })
    .finally(function () {
      maskingStore.clear({ view: 'settings' });
    });
}

function moveInstruction(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= form.instructions.length) return;
  const temp = form.instructions[index];
  form.instructions[index] = form.instructions[target];
  form.instructions[target] = temp;
  // 不再自动保存
}

onMounted(fetchSettings);
</script>

<style scoped>
/* ========== 操作按钮栏 ========== */
.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

/* ========== 卡片样式 ========== */
.settings-card {
  border-radius: 4px;
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 20px;
  break-inside: avoid;
}
.settings-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

/* ========== 瀑布流布局 ========== */
.settings-masonry {
  column-count: 3;
  column-gap: 16px;
}

/* Instructions 卡片单独样式 */
.instructions-card {
  margin-top: 20px;
  border-radius: 4px;
}

/* ========== 卡片头部 ========== */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.card-header .section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 彩色标识条 */
.card-header .section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #409eff, #79bbff);
}

/* ========== 表单网格 ========== */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px 20px;
}
.settings-grid :deep(.el-form-item) {
  margin-bottom: 0;
}
.settings-grid :deep(.el-form-item__content) {
  display: flex;
  justify-content: flex-end;
}

/* ========== 页面基础 ========== */
.page-view {
  padding: 16px;
}
.section-header {
  margin-bottom: 16px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
}

/* ========== Instructions 列表 ========== */
.instruction-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.instruction-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 14px;
  background: #fafbfc;
  transition: background 0.2s;
}
.instruction-item:hover {
  background: #f5f7fa;
}
.instruction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.instruction-path {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 13px;
  color: #409eff;
  word-break: break-all;
}
.instruction-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.instruction-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.instruction-content {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
}
.instructions-empty {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .settings-masonry {
    column-count: 1;
  }
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .instruction-main {
    flex-direction: column;
    align-items: flex-start;
  }
  .instruction-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .action-bar {
    flex-direction: column;
  }
  .action-bar .el-button {
    width: 100%;
  }
}
</style>

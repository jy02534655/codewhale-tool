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

      <el-form ref="settingsFormRef" :model="formData" :rules="rules" label-width="auto" label-position="left" size="default" require-asterisk-position="right">

        <div class="settings-masonry">

        <BasicSettingsCard v-model:formData="formData" @save="onSave" />
        <TuiInterfaceCard v-model:formData="formData" />
        <TuiTerminalCard v-model:formData="formData" />
        <SecurityCard v-model:formData="formData" />
        <SubagentsCard v-model:formData="formData" />
        <RetryCard v-model:formData="formData" />
        <NotificationsCard v-model:formData="formData" />
        <FeaturesCard v-model:formData="formData" />
        <SearchCard v-model:formData="formData" />
        <SettingsGroupCard
          v-for="group in readonlyGroups"
          :key="group.titleKey"
          v-model:formData="formData"
          :title-key="group.titleKey"
          :items="group.items"
        />

        </div>

      <Instructions :instructions="formData.instructions" @update:instructions="formData.instructions = $event" @save="updateInstructions" />

      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSettings, getSettingsDefaults, updateSettings, updateInstructions as updateInstructionsApi } from '@/api/settings';
import { useMaskingStore } from '@/stores/masking';
import Instructions from './instructions.vue';
import BasicSettingsCard from './cards/BasicSettingsCard.vue';
import TuiInterfaceCard from './cards/TuiInterfaceCard.vue';
import TuiTerminalCard from './cards/TuiTerminalCard.vue';
import SecurityCard from './cards/SecurityCard.vue';
import SubagentsCard from './cards/SubagentsCard.vue';
import RetryCard from './cards/RetryCard.vue';
import NotificationsCard from './cards/NotificationsCard.vue';
import FeaturesCard from './cards/FeaturesCard.vue';
import SearchCard from './cards/SearchCard.vue';
import SettingsGroupCard from './cards/SettingsGroupCard.vue';
import { readonlyGroups } from './cards/readonlyGroups.js';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();

// ========== 表单引用 ==========
const settingsFormRef = ref(null);

// ========== 表单数据 ==========
const formData = reactive({
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
const originalForm = JSON.parse(JSON.stringify(formData));

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

// ========== 获取设置 ==========
function fetchSettings() {
  maskingStore.loading({ view: 'settings' });
  getSettings()
    .then(function (data) {
      if (!data) return;
      Object.assign(formData, {
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
      Object.assign(originalForm, JSON.parse(JSON.stringify(formData)));
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
      locale: formData.locale,
      default_text_model: formData.default_text_model,
      theme: formData.theme,
      default_mode: formData.default_mode,
      sidebar_focus: formData.sidebar_focus,
      show_thinking: formData.show_thinking,
      show_tool_details: formData.show_tool_details,
      auto_compact: formData.auto_compact,
      auto_compact_threshold_percent: formData.auto_compact_threshold_percent,
      paste_burst_detection: formData.paste_burst_detection,
      mention_menu_limit: formData.mention_menu_limit,
      mention_walk_depth: formData.mention_walk_depth,
      mention_menu_behavior: formData.mention_menu_behavior,
      cost_currency: formData.cost_currency,
      background_color: formData.background_color,
      max_history: formData.max_history,
      verbosity: formData.verbosity,
      tui_alternate_screen: formData.tui_alternate_screen,
      tui_mouse_capture: formData.tui_mouse_capture,
      tui_terminal_probe_timeout_ms: formData.tui_terminal_probe_timeout_ms,
      tui_stream_chunk_timeout_secs: formData.tui_stream_chunk_timeout_secs,
      tui_osc8_links: formData.tui_osc8_links,
      approval_policy: formData.approval_policy,
      sandbox_mode: formData.sandbox_mode,
      allow_shell: formData.allow_shell,
      subagents_max_concurrent: formData.subagents_max_concurrent,
      subagents_token_budget: formData.subagents_token_budget,
      subagents_api_timeout_secs: formData.subagents_api_timeout_secs,
      subagents_heartbeat_timeout_secs: formData.subagents_heartbeat_timeout_secs,
      subagents_default_model: formData.subagents_default_model,
      retry_enabled: formData.retry_enabled,
      retry_max_retries: formData.retry_max_retries,
      retry_initial_delay: formData.retry_initial_delay,
      retry_max_delay: formData.retry_max_delay,
      retry_exponential_base: formData.retry_exponential_base,
      notifications_method: formData.notifications_method,
      notifications_threshold_secs: formData.notifications_threshold_secs,
      notifications_completion_sound: formData.notifications_completion_sound,
      features_shell_tool: formData.features_shell_tool,
      features_subagents: formData.features_subagents,
      features_web_search: formData.features_web_search,
      features_apply_patch: formData.features_apply_patch,
      features_mcp: formData.features_mcp,
      features_exec_policy: formData.features_exec_policy,
      features_vision_model: formData.features_vision_model,
      search_provider: formData.search_provider,
      search_base_url: formData.search_base_url,
      update_check_for_updates: formData.update_check_for_updates,
    })
      .then(function () {
        // 保存成功后更新原始快照
        Object.assign(originalForm, JSON.parse(JSON.stringify(formData)));
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
  // 将 formData 重置为原始快照
  Object.assign(formData, JSON.parse(JSON.stringify(originalForm)));
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
      Object.assign(formData, {
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

// ========== 独立保存 Instructions ==========
function updateInstructions() {
  maskingStore.loading({ view: 'settings' });
  updateInstructionsApi(formData.instructions)
    .then(function () {
      Object.assign(originalForm, JSON.parse(JSON.stringify(formData)));
      ElMessage.success(t('settings.save_success'));
    })
    .catch(function () {
      // 失败不更新快照
    })
    .finally(function () {
      maskingStore.clear({ view: 'settings' });
    });
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
  /* hover 浮动效果已移除，保持界面稳定 */
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
.settings-masonry :deep(.el-form-item__content) {
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

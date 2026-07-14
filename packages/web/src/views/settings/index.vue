<!--
  index.vue — 通用设置页面
  负责语言、默认模型、instructions 的统一配置与管理
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('settings.title') }}</span>
      </div>

      <!-- 基础设置 -->
      <el-card shadow="never" class="settings-card">
        <el-form :model="form" class="settings-grid" size="small">
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
        </el-form>
      </el-card>

      <!-- TUI 界面 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.tui_interface_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.show_thinking')" label-width="140px">
            <el-switch v-model="form.show_thinking" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.show_tool_details')" label-width="140px">
            <el-switch v-model="form.show_tool_details" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.auto_compact')" label-width="140px">
            <el-switch v-model="form.auto_compact" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.paste_burst_detection')" label-width="140px">
            <el-switch v-model="form.paste_burst_detection" @change="onSave" />
          </el-form-item>

          <!-- 数字配置类 -->
          <el-form-item :label="$t('settings.auto_compact_threshold_percent')" label-width="140px">
            <el-input-number v-model="form.auto_compact_threshold_percent" :min="10" :max="100" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.mention_menu_limit')" label-width="140px">
            <el-input-number v-model="form.mention_menu_limit" :min="1" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.mention_walk_depth')" label-width="140px">
            <el-input-number v-model="form.mention_walk_depth" :min="0" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.max_history')" label-width="140px">
            <el-input-number v-model="form.max_history" :min="1" @change="onSave" />
          </el-form-item>

          <!-- 下拉类 -->
          <el-form-item :label="$t('settings.theme')" label-width="140px">
            <el-select v-model="form.theme" @change="onSave">
              <el-option value="system" label="System" />
              <el-option value="dark" label="Dark" />
              <el-option value="light" label="Light" />
              <el-option value="grayscale" label="Grayscale" />
              <el-option value="catppuccin-mocha" label="Catppuccin Mocha" />
              <el-option value="tokyo-night" label="Tokyo Night" />
              <el-option value="dracula" label="Dracula" />
              <el-option value="gruvbox-dark" label="Gruvbox Dark" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.default_mode')" label-width="140px">
            <el-select v-model="form.default_mode" @change="onSave">
              <el-option value="agent" label="Agent" />
              <el-option value="plan" label="Plan" />
              <el-option value="yolo" label="Yolo" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.sidebar_focus')" label-width="140px">
            <el-select v-model="form.sidebar_focus" @change="onSave">
              <el-option value="pinned" label="Pinned" />
              <el-option value="auto" label="Auto" />
              <el-option value="tasks" label="Tasks" />
              <el-option value="agents" label="Agents" />
              <el-option value="context" label="Context" />
              <el-option value="hidden" label="Hidden" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.mention_menu_behavior')" label-width="140px">
            <el-select v-model="form.mention_menu_behavior" @change="onSave">
              <el-option value="fuzzy" label="Fuzzy" />
              <el-option value="browser" label="Browser" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.cost_currency')" label-width="140px">
            <el-select v-model="form.cost_currency" @change="onSave">
              <el-option value="usd" label="USD" />
              <el-option value="cny" label="CNY" />
              <el-option value="rmb" label="RMB" />
              <el-option value="yuan" label="Yuan" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.verbosity')" label-width="140px">
            <el-select v-model="form.verbosity" @change="onSave">
              <el-option value="normal" label="Normal" />
              <el-option value="concise" label="Concise" />
            </el-select>
          </el-form-item>

          <!-- 文本输入 -->
          <el-form-item :label="$t('settings.background_color')" label-width="140px" class="full-width">
            <el-input v-model="form.background_color" @blur="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.default_model_override')" label-width="140px" class="full-width">
            <el-input v-model="form.default_model" @blur="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- TUI 终端 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.tui_terminal_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.tui_mouse_capture')" label-width="140px">
            <el-switch v-model="form.tui_mouse_capture" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.tui_osc8_links')" label-width="140px">
            <el-switch v-model="form.tui_osc8_links" @change="onSave" />
          </el-form-item>

          <!-- 数字配置类 -->
          <el-form-item :label="$t('settings.tui_terminal_probe_timeout_ms')" label-width="140px">
            <el-input-number v-model="form.tui_terminal_probe_timeout_ms" :min="100" :max="5000" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.tui_stream_chunk_timeout_secs')" label-width="140px">
            <el-input-number v-model="form.tui_stream_chunk_timeout_secs" :min="1" :max="3600" @change="onSave" />
          </el-form-item>

          <!-- 下拉类 -->
          <el-form-item :label="$t('settings.tui_alternate_screen')" label-width="140px">
            <el-select v-model="form.tui_alternate_screen" @change="onSave">
              <el-option value="auto" label="Auto" />
              <el-option value="always" label="Always" />
              <el-option value="never" label="Never" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 安全与审批 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.security_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.allow_shell')" label-width="140px">
            <el-switch v-model="form.allow_shell" @change="onSave" />
          </el-form-item>

          <!-- 下拉类 -->
          <el-form-item :label="$t('settings.approval_policy')" label-width="140px">
            <el-select v-model="form.approval_policy" @change="onSave">
              <el-option value="on-request" label="On Request" />
              <el-option value="untrusted" label="Untrusted" />
              <el-option value="never" label="Never" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.sandbox_mode')" label-width="140px">
            <el-select v-model="form.sandbox_mode" @change="onSave">
              <el-option value="read-only" label="Read Only" />
              <el-option value="workspace-write" label="Workspace Write" />
              <el-option value="danger-full-access" label="Danger Full Access" />
              <el-option value="external-sandbox" label="External Sandbox" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 子代理 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.subagents_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 数字配置类 -->
          <el-form-item :label="$t('settings.subagents_max_concurrent')" label-width="140px">
            <el-input-number v-model="form.subagents_max_concurrent" :min="1" :max="20" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.subagents_token_budget')" label-width="140px">
            <el-input-number v-model="form.subagents_token_budget" :min="0" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.subagents_api_timeout_secs')" label-width="140px">
            <el-input-number v-model="form.subagents_api_timeout_secs" :min="1" :max="1800" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.subagents_heartbeat_timeout_secs')" label-width="140px">
            <el-input-number v-model="form.subagents_heartbeat_timeout_secs" :min="30" :max="3600" @change="onSave" />
          </el-form-item>

          <!-- 文本输入 -->
          <el-form-item :label="$t('settings.subagents_default_model')" label-width="140px" class="full-width">
            <el-input v-model="form.subagents_default_model" @blur="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 重试 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.retry_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.retry_enabled')" label-width="140px">
            <el-switch v-model="form.retry_enabled" @change="onSave" />
          </el-form-item>

          <!-- 数字配置类 -->
          <el-form-item :label="$t('settings.retry_max_retries')" label-width="140px">
            <el-input-number v-model="form.retry_max_retries" :min="0" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.retry_initial_delay')" label-width="140px">
            <el-input-number v-model="form.retry_initial_delay" :min="0" :step="0.1" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.retry_max_delay')" label-width="140px">
            <el-input-number v-model="form.retry_max_delay" :min="0" :step="0.1" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.retry_exponential_base')" label-width="140px">
            <el-input-number v-model="form.retry_exponential_base" :min="1" :step="0.1" @change="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 通知 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.notifications_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 数字配置类 -->
          <el-form-item :label="$t('settings.notifications_threshold_secs')" label-width="140px">
            <el-input-number v-model="form.notifications_threshold_secs" :min="0" @change="onSave" />
          </el-form-item>

          <!-- 下拉类 -->
          <el-form-item :label="$t('settings.notifications_method')" label-width="140px">
            <el-select v-model="form.notifications_method" @change="onSave">
              <el-option value="auto" label="Auto" />
              <el-option value="osc9" label="OSC 9" />
              <el-option value="bel" label="BEL" />
              <el-option value="off" label="Off" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('settings.notifications_completion_sound')" label-width="140px">
            <el-select v-model="form.notifications_completion_sound" @change="onSave">
              <el-option value="beep" label="Beep" />
              <el-option value="off" label="Off" />
              <el-option value="bell" label="Bell" />
              <el-option value="file" label="File" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 功能开关 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.features_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.features_shell_tool')" label-width="140px">
            <el-switch v-model="form.features_shell_tool" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_subagents')" label-width="140px">
            <el-switch v-model="form.features_subagents" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_web_search')" label-width="140px">
            <el-switch v-model="form.features_web_search" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_apply_patch')" label-width="140px">
            <el-switch v-model="form.features_apply_patch" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_mcp')" label-width="140px">
            <el-switch v-model="form.features_mcp" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_exec_policy')" label-width="140px">
            <el-switch v-model="form.features_exec_policy" @change="onSave" />
          </el-form-item>
          <el-form-item :label="$t('settings.features_vision_model')" label-width="140px">
            <el-switch v-model="form.features_vision_model" @change="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 搜索 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.search_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 下拉类 -->
          <el-form-item :label="$t('settings.search_provider')" label-width="140px">
            <el-select v-model="form.search_provider" @change="onSave">
              <el-option value="duckduckgo" label="DuckDuckGo" />
              <el-option value="bing" label="Bing" />
              <el-option value="tavily" label="Tavily" />
              <el-option value="bocha" label="Bocha" />
              <el-option value="metaso" label="Metaso" />
              <el-option value="searxng" label="SearXNG" />
              <el-option value="baidu" label="Baidu" />
              <el-option value="volcengine" label="Volcengine" />
              <el-option value="sofya" label="Sofya" />
            </el-select>
          </el-form-item>

          <!-- 文本输入 -->
          <el-form-item :label="$t('settings.search_base_url')" label-width="140px" class="full-width">
            <el-input v-model="form.search_base_url" @blur="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 更新检查 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.update_title') }}</span>
          </div>
        </template>
        <el-form :model="form" class="settings-grid" size="small">
          <!-- 切换类 -->
          <el-form-item :label="$t('settings.update_check_for_updates')" label-width="140px">
            <el-switch v-model="form.update_check_for_updates" @change="onSave" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- Instructions 管理 -->
      <el-card shadow="never" class="settings-card">
        <template #header>
          <div class="card-header">
            <span class="section-title">{{ $t('settings.instructions_title') }}</span>
            <el-button size="small" type="primary" @click="onAddInstruction">
              <el-icon><Plus /></el-icon>
              {{ $t('settings.instructions_add') }}
            </el-button>
          </div>
        </template>

        <el-empty v-if="form.instructions.length === 0" :description="$t('settings.instructions_empty')" />

        <div v-else class="instruction-list">
          <div v-for="(item, index) in form.instructions" :key="index" class="instruction-item">
            <div class="instruction-main">
              <div class="instruction-info">
                <span class="instruction-path">{{ item.path }}</span>
                <el-tag v-if="item.readonly" size="small" type="info" effect="plain">
                  {{ $t('settings.instruction_readonly') }}
                </el-tag>
              </div>
              <div class="instruction-actions">
                <el-button size="small" type="primary" plain :disabled="item.readonly" @click="onEditInstruction(index)">
                  <el-icon><Edit /></el-icon>
                  {{ $t('common.edit') }}
                </el-button>
                <el-button size="small" type="danger" :disabled="item.readonly" @click="onRemoveInstruction(index)">
                  <el-icon><Delete /></el-icon>
                  {{ $t('common.delete') }}
                </el-button>
                <el-button size="small" :disabled="index === 0" @click="moveInstruction(index, -1)">
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button size="small" :disabled="index === form.instructions.length - 1" @click="moveInstruction(index, 1)">
                  <el-icon><Bottom /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <InstructionDialog ref="instructionDialog" @submitSuccess="onInstructionSubmit" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Edit, Delete, Top, Bottom } from '@element-plus/icons-vue';
import { getSettings, updateSettings } from '@/api/settings';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import InstructionDialog from './edit/instruction.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const locales = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'pt-BR', label: 'Português (BR)' },
];

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
  default_model: '',
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

const editingInstructionIndex = ref(-1);

function fetchSettings() {
  maskingStore.loading({ loadingText: t('settings.loading'), nextTime: 100, view: 'provider' });
  getSettings()
    .then(function (data) {
      if (!data) return;
      form.locale = data.locale || 'zh-Hans';
      form.default_text_model = data.default_text_model || 'deepseek-v4-pro';
      form.instructions = Array.isArray(data.instructions) ? data.instructions : [];

      // TUI 界面
      form.theme = data.theme || 'system';
      form.default_mode = data.default_mode || 'agent';
      form.sidebar_focus = data.sidebar_focus || 'pinned';
      form.show_thinking = data.show_thinking ?? true;
      form.show_tool_details = data.show_tool_details ?? true;
      form.auto_compact = data.auto_compact ?? true;
      form.auto_compact_threshold_percent = data.auto_compact_threshold_percent || 80;
      form.paste_burst_detection = data.paste_burst_detection ?? true;
      form.mention_menu_limit = data.mention_menu_limit || 128;
      form.mention_walk_depth = data.mention_walk_depth ?? 6;
      form.mention_menu_behavior = data.mention_menu_behavior || 'fuzzy';
      form.cost_currency = data.cost_currency || 'usd';
      form.background_color = data.background_color || 'default';
      form.max_history = data.max_history || 1000;
      form.default_model = data.default_model || '';
      form.verbosity = data.verbosity || 'normal';

      // TUI 终端
      form.tui_alternate_screen = data.tui_alternate_screen || 'auto';
      form.tui_mouse_capture = data.tui_mouse_capture ?? true;
      form.tui_terminal_probe_timeout_ms = data.tui_terminal_probe_timeout_ms || 500;
      form.tui_stream_chunk_timeout_secs = data.tui_stream_chunk_timeout_secs || 300;
      form.tui_osc8_links = data.tui_osc8_links ?? true;

      // 安全与审批
      form.approval_policy = data.approval_policy || 'on-request';
      form.sandbox_mode = data.sandbox_mode || 'read-only';
      form.allow_shell = data.allow_shell ?? false;

      // 子代理
      form.subagents_max_concurrent = data.subagents_max_concurrent || 20;
      form.subagents_token_budget = data.subagents_token_budget || 0;
      form.subagents_api_timeout_secs = data.subagents_api_timeout_secs || 120;
      form.subagents_heartbeat_timeout_secs = data.subagents_heartbeat_timeout_secs || 300;
      form.subagents_default_model = data.subagents_default_model || '';

      // 重试
      form.retry_enabled = data.retry_enabled ?? true;
      form.retry_max_retries = data.retry_max_retries || 3;
      form.retry_initial_delay = data.retry_initial_delay ?? 1.0;
      form.retry_max_delay = data.retry_max_delay ?? 60.0;
      form.retry_exponential_base = data.retry_exponential_base ?? 2.0;

      // 通知
      form.notifications_method = data.notifications_method || 'auto';
      form.notifications_threshold_secs = data.notifications_threshold_secs || 30;
      form.notifications_completion_sound = data.notifications_completion_sound || 'beep';

      // 功能开关
      form.features_shell_tool = data.features_shell_tool ?? true;
      form.features_subagents = data.features_subagents ?? true;
      form.features_web_search = data.features_web_search ?? true;
      form.features_apply_patch = data.features_apply_patch ?? true;
      form.features_mcp = data.features_mcp ?? true;
      form.features_exec_policy = data.features_exec_policy ?? true;
      form.features_vision_model = data.features_vision_model ?? false;

      // 搜索
      form.search_provider = data.search_provider || 'duckduckgo';
      form.search_base_url = data.search_base_url || '';

      // 更新
      form.update_check_for_updates = data.update_check_for_updates ?? true;
    })
    .finally(function () {
      maskingStore.clear();
    });
}

function onSave() {
  updateSettings({
    locale: form.locale,
    default_text_model: form.default_text_model,
    instructions: form.instructions,
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
    default_model: form.default_model,
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
  });
}

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
  onSave();
}

function onRemoveInstruction(index) {
  form.instructions.splice(index, 1);
  onSave();
}

function moveInstruction(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= form.instructions.length) return;
  const temp = form.instructions[index];
  form.instructions[index] = form.instructions[target];
  form.instructions[target] = temp;
  onSave();
}

onMounted(fetchSettings);
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}
.settings-grid .el-form-item {
  margin-bottom: 0;
}
.settings-grid .full-width {
  grid-column: 1 / -1;
}
.page-view {
  padding: 16px;
}
.section-header {
  margin-bottom: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
}
.settings-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.instruction-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.instruction-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
}
.instruction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.instruction-path {
  font-family: monospace;
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
</style>
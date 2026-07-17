<!--
  ReadOnlySettingsCard.vue — 通用设置：不可配置项卡片
  将配置文档中已有、但当前 Web UI 暂不支持的通用设置项集中展示为只读态。
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.readonly_title') }}</span>
      </div>
    </template>
    <div class="readonly-sections">
      <div v-for="group in readonlyGroups" :key="group.title" class="readonly-section">
        <div class="readonly-section-title">{{ group.title }}</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="item in group.items" :key="item.key">
            <template #label>
              <div class="form-item-label">
                <span>{{ item.label }}</span>
                <el-tooltip placement="top" :content="helpText[item.key]">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <span class="readonly-value">{{ item.value }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { QuestionFilled } from '@element-plus/icons-vue';
import { settingsHelp } from '@/utils/settingsHelp';

const typeLabel = {
  text: '文本',
  number: '数字',
  switch: '布尔',
  select: '选项',
};

const readonlyGroups = [
  {
    title: '模型与推理',
    items: [
      { key: 'reasoning_effort', label: 'reasoning_effort', type: 'select', value: '' },
    ],
  },
  {
    title: '上下文管理',
    items: [
      { key: 'context.enabled', label: 'context.enabled', type: 'switch', value: '' },
      { key: 'context.verbatim_window_turns', label: 'context.verbatim_window_turns', type: 'number', value: '' },
      { key: 'context.l1_threshold', label: 'context.l1_threshold', type: 'number', value: '' },
      { key: 'context.l2_threshold', label: 'context.l2_threshold', type: 'number', value: '' },
      { key: 'context.l3_threshold', label: 'context.l3_threshold', type: 'number', value: '' },
      { key: 'context.seam_model', label: 'context.seam_model', type: 'text', value: '' },
      { key: 'CODEWHALE_CACHE_MAXIMAL', label: 'CODEWHALE_CACHE_MAXIMAL', type: 'switch', value: '' },
    ],
  },
  {
    title: '通知',
    items: [
      { key: 'notifications.include_summary', label: 'notifications.include_summary', type: 'switch', value: '' },
      { key: 'notifications.sound_file', label: 'notifications.sound_file', type: 'text', value: '' },
    ],
  },
  {
    title: '更新检查',
    items: [
      { key: 'update.update_uri', label: 'update.update_uri', type: 'text', value: '' },
    ],
  },
  {
    title: '安全',
    items: [
      { key: 'permissions.toml', label: 'permissions.toml', type: 'text', value: '' },
    ],
  },
  {
    title: '路径配置',
    items: [
      { key: 'skills_dir', label: 'skills_dir', type: 'text', value: '' },
      { key: 'skills.scan_codewhale_only', label: 'skills.scan_codewhale_only', type: 'switch', value: '' },
      { key: 'mcp_config_path', label: 'mcp_config_path', type: 'text', value: '' },
      { key: 'notes_path', label: 'notes_path', type: 'text', value: '' },
      { key: 'memory_path', label: 'memory_path', type: 'text', value: '' },
      { key: 'memory.enabled', label: 'memory.enabled', type: 'switch', value: '' },
      { key: 'snapshots.enabled', label: 'snapshots.enabled', type: 'switch', value: '' },
      { key: 'snapshots.max_age_days', label: 'snapshots.max_age_days', type: 'number', value: '' },
      { key: 'verifier.enabled', label: 'verifier.enabled', type: 'switch', value: '' },
      { key: 'verifier.verdict_policy', label: 'verifier.verdict_policy', type: 'select', value: '' },
    ],
  },
  {
    title: '子代理',
    items: [
      { key: 'subagents.max_depth', label: 'subagents.max_depth', type: 'number', value: '' },
      { key: 'subagents.launch_concurrency', label: 'subagents.launch_concurrency', type: 'number', value: '' },
      { key: 'subagents.max_admitted', label: 'subagents.max_admitted', type: 'number', value: '' },
      { key: 'subagents.worker_model', label: 'subagents.worker_model', type: 'text', value: '' },
      { key: 'subagents.explorer_model', label: 'subagents.explorer_model', type: 'text', value: '' },
      { key: 'subagents.awaiter_model', label: 'subagents.awaiter_model', type: 'text', value: '' },
      { key: 'subagents.review_model', label: 'subagents.review_model', type: 'text', value: '' },
      { key: 'subagents.custom_model', label: 'subagents.custom_model', type: 'text', value: '' },
    ],
  },
  {
    title: '容量控制',
    items: [
      { key: 'capacity.enabled', label: 'capacity.enabled', type: 'switch', value: '' },
      { key: 'capacity.low_risk_max', label: 'capacity.low_risk_max', type: 'number', value: '' },
      { key: 'capacity.medium_risk_max', label: 'capacity.medium_risk_max', type: 'number', value: '' },
      { key: 'capacity.severe_min_slack', label: 'capacity.severe_min_slack', type: 'number', value: '' },
      { key: 'capacity.severe_violation_ratio', label: 'capacity.severe_violation_ratio', type: 'number', value: '' },
      { key: 'capacity.refresh_cooldown_turns', label: 'capacity.refresh_cooldown_turns', type: 'number', value: '' },
      { key: 'capacity.replan_cooldown_turns', label: 'capacity.replan_cooldown_turns', type: 'number', value: '' },
      { key: 'capacity.max_replay_per_turn', label: 'capacity.max_replay_per_turn', type: 'number', value: '' },
      { key: 'capacity.min_turns_before_guardrail', label: 'capacity.min_turns_before_guardrail', type: 'number', value: '' },
      { key: 'capacity.profile_window', label: 'capacity.profile_window', type: 'number', value: '' },
      { key: 'capacity.deepseek_v3_2_chat_prior', label: 'capacity.deepseek_v3_2_chat_prior', type: 'number', value: '' },
      { key: 'capacity.deepseek_v3_2_reasoner_prior', label: 'capacity.deepseek_v3_2_reasoner_prior', type: 'number', value: '' },
      { key: 'capacity.deepseek_v4_pro_prior', label: 'capacity.deepseek_v4_pro_prior', type: 'number', value: '' },
      { key: 'capacity.deepseek_v4_flash_prior', label: 'capacity.deepseek_v4_flash_prior', type: 'number', value: '' },
      { key: 'capacity.fallback_default_prior', label: 'capacity.fallback_default_prior', type: 'number', value: '' },
    ],
  },
];

const helpText = {};
readonlyGroups.forEach((group) => {
  group.items.forEach((item) => {
    helpText[item.key] = settingsHelp[item.key] || '';
  });
});
</script>
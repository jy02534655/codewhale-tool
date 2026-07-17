<!--
  ReadOnlyGroupCard.vue — 通用设置：只读分组卡片
  将某一组不可配置项以禁用表单组件展示，仅保留视觉占位，
  不参与表单提交。
-->
<template>
  <el-card class="settings-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ title }}</span>
      </div>
    </template>
    <div class="settings-grid">
      <el-form-item v-for="item in items" :key="item.key">
        <template #label>
          <div class="form-item-label">
            <span>{{ getLabel(item) }}</span>
            <el-tooltip placement="top" :content="getHelp(item)">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-input v-if="item.type === 'text'" :model-value="item.value" disabled />
        <el-input-number v-else-if="item.type === 'number'" :model-value="item.value" disabled />
        <el-switch v-else-if="item.type === 'switch'" :model-value="item.value" disabled />
        <el-select v-else-if="item.type === 'select'" :model-value="item.value" disabled placeholder=" ">
          <el-option v-for="opt in selectOptions(item.key)" :key="opt.value" :value="opt.value" :label="opt.label" />
        </el-select>
        <el-input v-else :model-value="item.value" disabled />
      </el-form-item>
    </div>
  </el-card>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { QuestionFilled } from '@element-plus/icons-vue';
  import { getSettingsOptions } from '@/utils/i18n/settings';

  const props = defineProps({
    titleKey: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    }
  });

  const { locale, t } = useI18n({ useScope: 'global' });

  const title = computed(() => t(props.titleKey));

  function getLabel(item) {
    const key = `settings.readonly.${item.key}`;
    const translated = t(key);
    return translated === key ? item.label : translated;
  }

  function getHelp(item) {
    return t(`settings.help.${item.key}`) || '';
  }

  function selectOptions(key) {
    const optionKey = key.replace(/\./g, '_');
    const options = getSettingsOptions(optionKey, locale.value);
    return options.length > 0 ? options : [];
  }
</script>

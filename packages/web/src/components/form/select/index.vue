<!-- SettingsSelect.vue — 通用设置：下拉选择（el-select + optionKey） -->
<template>
  <el-select :model-value="modelValue" placeholder=" " @update:modelValue="$emit('update:modelValue', $event)">
    <el-option
      v-for="opt in resolvedOptions"
      :key="opt.value"
      :value="opt.value"
      :label="opt.label"
    />
  </el-select>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getSettingsOptions } from '@/utils/i18n/settings';

  // modelValue: 当前选中值
  // optionKey: SETTINGS_OPTIONS 中的键，用于获取当前语言的选项列表
  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: ''
    },
    optionKey: {
      type: String,
      default: ''
    }
  });

  const emit = defineEmits(['update:modelValue']); // eslint-disable-line no-unused-vars

  const { locale } = useI18n({ useScope: 'global' });

  // 根据 optionKey 和当前语言动态解析选项
  const resolvedOptions = computed(() => {
    if (!props.optionKey) return [];
    return getSettingsOptions(props.optionKey, locale.value);
  });
</script>

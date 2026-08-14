<!--
  ThemeCard.vue — 设置页主题风格独立卡片
  脱离 groupCard 的 el-form-item 体系，单独维护主题预览与切换
-->
<template>
  <el-card class="settings-card theme-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span class="section-title">{{ $t('settings.theme.title') }}</span>
      </div>
    </template>
    <ThemePreviewCard v-model="localValue" />
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import ThemePreviewCard from '@/components/settings/ThemePreviewCard.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});
</script>

<style scoped>
.theme-card {
  margin-bottom: 16px;
}
</style>

<!--
  ThemePreviewCard.vue — 设置页主题预览卡片
  以可视化色卡替代下拉框，展示各主题的视觉印象并支持点击切换
-->
<template>
  <div class="theme-preview-grid">
    <div
      v-for="opt in options"
      :key="opt.value"
      :class="['theme-preview-card', { 'theme-preview-card--active': modelValue === opt.value }]"
      @click="onSelect(opt.value)"
    >
      <!-- 主题印象色卡 -->
      <div class="theme-preview-card__swatch" :style="swatchStyle(opt.value)">
        <BrandWhale class="theme-preview-card__whale" />
      </div>
      <div class="theme-preview-card__label">{{ opt.label }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getSettingsOptions } from '@/utils/i18n/settings';
import BrandWhale from '@/components/brand/BrandWhale.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  optionKey: {
    type: String,
    default: 'theme'
  }
});

const emit = defineEmits(['update:modelValue']);

const { locale } = useI18n({ useScope: 'global' });

const options = computed(() => {
  if (!props.optionKey) return [];
  return getSettingsOptions(props.optionKey, locale.value);
});

const onSelect = (value) => {
  emit('update:modelValue', value);
};

const swatchStyle = (theme) => {
  const palette = {
    system: 'linear-gradient(135deg, #faf8f5, #d5dbcc)',
    dark: 'linear-gradient(135deg, #0d1117, #30363d)',
    light: 'linear-gradient(135deg, #faf8f5, #0d5c75)',
    grayscale: 'linear-gradient(135deg, #f5f5f5, #333333)',
    'catppuccin-mocha': 'linear-gradient(135deg, #1e1e2e, #cba6f7)',
    'tokyo-night': 'linear-gradient(135deg, #1a1b26, #7aa2f7)',
    dracula: 'linear-gradient(135deg, #282a36, #bd93f9)',
    'gruvbox-dark': 'linear-gradient(135deg, #282828, #fe8019)'
  };
  return {
    background: palette[theme] || 'linear-gradient(135deg, #faf8f5, #0d5c75)'
  };
};
</script>

<style scoped>
.theme-preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.theme-preview-card {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.theme-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.theme-preview-card--active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(13, 92, 117, 0.18);
}

.theme-preview-card__swatch {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-preview-card__whale {
  width: 24px;
  height: 24px;
  color: #ffffff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

.theme-preview-card__label {
  padding: 6px 8px;
  font-size: 12px;
  text-align: center;
  background: var(--bg-card);
  color: var(--text-primary);
  border-top: 1px solid var(--border);
}

@media (max-width: 768px) {
  .theme-preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

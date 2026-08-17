<!--
  ThemeSwitcher.vue — 顶部主题切换入口
  顶部仅展示「当前主题」图标+名称，hover 后弹出主题预览浮动层。
  每个预览卡片使用主题真实背景纯色 + 对应文字色，整体就是纯色主题风格。
-->
<template>
  <el-popover popper-class="theme-switcher-popover" placement="bottom" :width="340" trigger="hover" :show-after="120" :hide-after="80">
    <template #reference>
      <button type="button" class="theme-switcher__trigger">
        <BrandWhale :color="currentAccent" />
        <span class="theme-switcher__label">{{ currentLabel }}</span>
      </button>
    </template>

    <!-- 浮动层：Web UI 纯色主题网格预览 -->
    <div class="theme-popover-grid">
      <div
        v-for="t in options"
        :key="t.value"
        :class="['theme-popover-item', { 'theme-popover-item--active': modelValue === t.value }]"
        :style="cardStyle(t)"
        @click="onSelect(t.value)"
      >
        <div class="theme-popover-item__preview">
          <BrandWhale :color="t.accent" />
        </div>
        <div class="theme-popover-item__label">{{ t.label }}</div>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue';
import BrandWhale from './BrandWhale.vue';

defineOptions({ name: 'ThemeSwitcher' });

const props = defineProps({
  modelValue: {
    type: String,
    default: 'light',
  },
  options: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const currentAccent = computed(() => {
  const found = props.options.find((t) => t.value === props.modelValue);
  return found ? found.accent : '#0d5c75';
});

const currentLabel = computed(() => {
  const found = props.options.find((t) => t.value === props.modelValue);
  return found ? found.label : '';
});

const onSelect = (val) => {
  emit('update:modelValue', val);
  emit('change', val);
};

// 主题真实背景色 + 文字色，用于纯色预览卡片
const themeColors = {
  light: { bg: '#faf8f5', text: '#1f2328' },
  sage: { bg: '#f5f7f3', text: '#1f2328' },
  ocean: { bg: '#f4f6fa', text: '#1f2328' },
  rose: { bg: '#faf5f6', text: '#1f2328' },
  lavender: { bg: '#f7f5fa', text: '#1f2328' },
  dark: { bg: '#0d1117', text: '#e6edf3' }
};

const cardStyle = (t) => {
  const colors = themeColors[t.value] || themeColors.light;
  return {
    '--item-accent': t.accent,
    background: colors.bg,
    color: colors.text
  };
};
</script>

<style>
.theme-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  line-height: 1.2;
}

.theme-switcher__trigger:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.theme-switcher__trigger :deep(.brand-whale) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.theme-switcher__label {
  font-size: 12px;
}

/* 浮动层主题网格 — 纯色卡片风格 */
.theme-popover-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.theme-popover-item {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  text-align: center;
}

.theme-popover-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.theme-popover-item--active {
  border-color: var(--item-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--item-accent) 18%, transparent);
}

.theme-popover-item__preview {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-popover-item__preview :deep(.brand-whale) {
  width: 24px;
  height: 24px;
}

.theme-popover-item__label {
  padding: 6px 8px;
  font-size: 12px;
}

/* 浮动层容器固定为浅色中性背景，避免跟随主题切换而闪烁 */
:deep(.theme-switcher-popover) {
  background: #ffffff !important;
  border-color: #e0e0e0 !important;
}
</style>

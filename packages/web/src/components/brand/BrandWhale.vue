<!--
  BrandWhale.vue — CodeWhale 品牌鲸鱼图标
  极简线条风格，使用 currentColor 跟随主题色
-->
<template>
  <svg
    viewBox="0 0 24 24"
    class="brand-whale"
    :class="{ 'brand-whale--dark': isDark }"
    :style="whaleStyle"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- 身体：圆润的流线型 -->
    <path d="M5 13.5c0-3.5 3-7 7.5-7S20 10 20 13.5s-2.5 5.5-6 5.5-6.5-2-6.5-5.5z" />
    <!-- 腹部 -->
    <path d="M8 13.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5" opacity="0.4" />
    <!-- 尾巴 -->
    <path d="M18.5 13.5c1.8-0.8 3.5-0.5 3.5 1s-1.8 1.8-3.5 1" />
    <!-- 胸鳍 -->
    <path d="M10 15.5c-1 1-1 2.5 0 3" />
    <!-- 眼睛 -->
    <circle cx="9.5" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
    <!-- 喷水 -->
    <path d="M7 7c0.5-1 1.5-1.5 2-1" opacity="0.6" />
    <path d="M6.5 5.5c0.8-1.2 2-2 3-2.2" opacity="0.4" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'BrandWhale' });

const props = defineProps({
  color: {
    type: String,
    default: ''
  }
});

// 传递 color 时以内联样式覆盖主题色，实现每个选项独立预览色
const whaleStyle = computed(() => {
  if (props.color) {
    return { color: props.color };
  }
  return undefined;
});

const isDark = computed(() => {
  return document.documentElement.getAttribute('data-theme') === 'dark';
});
</script>

<style scoped>
.brand-whale {
  width: 28px;
  height: 28px;
  color: var(--accent);
  transition: color 0.2s ease;
}

.brand-whale--dark {
  color: var(--accent);
}
</style>

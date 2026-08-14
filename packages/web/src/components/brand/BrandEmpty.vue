<!--
  BrandEmpty.vue — CodeWhale 品牌空状态
  统一封装鲸鱼插图 + 引导文案，替代 Element Plus 默认 el-empty
-->
<template>
  <div class="brand-empty">
    <div class="brand-empty__illustration">
      <BrandWhale :direction="direction" />
    </div>
    <p class="brand-empty__text">{{ text }}</p>
    <p v-if="hint" class="brand-empty__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import BrandWhale from './BrandWhale.vue';

defineOptions({ name: 'BrandEmpty' });

defineProps({
  text: {
    type: String,
    default: '暂无数据',
  },
  hint: {
    type: String,
    default: '',
  },
  direction: {
    type: String,
    default: 'right', // right | left
  },
});
</script>

<style scoped>
.brand-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 12px;
}

.brand-empty__illustration {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  transition: background 0.2s ease;
}

.brand-empty__illustration :deep(.brand-whale) {
  width: 56px;
  height: 56px;
  color: var(--accent);
}

.brand-empty__text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0;
}

.brand-empty__hint {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
  max-width: 320px;
  line-height: var(--leading-normal);
}
</style>

<template>
  <div class="split-layout">
    <div
      class="split-left"
      :style="{ width: leftWidth, flexShrink: 0 }"
    >
      <slot name="left" />
    </div>
    <div
      class="split-divider"
      :style="{ margin: gap ? `0 ${gap}` : '0' }"
    />
    <div class="split-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  leftWidth: { type: String, default: '320px' },
  gap: { type: String, default: '0' },
})
</script>
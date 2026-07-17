<!--
  FormItemLabel.vue — 通用设置表单标签
  将 label、tooltip、help icon 封装为可复用组件，供 #label 插槽使用
-->
<template>
  <div class="form-item-label">
    <span>{{ $t(labelKey) }}</span>
    <el-tooltip placement="top" :content="$t(helpKey)">
      <el-icon class="help-icon"><QuestionFilled /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup>
  // 引入 Element Plus 的问号图标，用于展示配置项说明
  import { QuestionFilled } from '@element-plus/icons-vue';

  // labelKey：表单标签的 i18n key
  // helpKey：tooltip 说明文本的 i18n key
  defineProps({
    labelKey: {
      type: String,
      required: true
    },
    helpKey: {
      type: String,
      required: true
    }
  });
</script>

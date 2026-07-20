<!-- FormItemLabel.vue — 通用设置：表单项标签与帮助提示 -->
<template>
  <div class="form-item-label">
    <!-- 显示当前语言的 label 文本 -->
    <span>{{ $t(labelKey) }}</span>
    <!-- 帮助图标悬停时显示 tooltip 文本 -->
    <el-tooltip placement="top" :content="$t(helpKey)">
      <el-icon class="help-icon"><QuestionFilled /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup>
  // 引入 Element Plus 问号图标
  import { QuestionFilled } from '@element-plus/icons-vue';

  // labelKey: vue-i18n key，如 'settings.language'
  // helpKey: vue-i18n key，如 'settings.help.locale'
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

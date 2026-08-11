<template>
  <div class="cw-file-editor">
    <div class="cw-file-editor__header">
      <span>{{ $t('common.edit') }}</span>
      <el-tag size="small" effect="plain">{{ previewModeLabel }}</el-tag>
    </div>
    <el-alert
      v-if="showSyntax && syntaxMessage"
      :title="syntaxMessage"
      :type="syntaxType"
      :closable="false"
      class="cw-file-editor__syntax"
    />
    <textarea :value="modelValue" class="cw-file-editor__textarea" spellcheck="false" @input="onInput"></textarea>
  </div>
</template>

<script setup>
// 引入 computed 与 toRef，复用统一的展示逻辑。
import { computed, toRef } from 'vue'

// 引入国际化函数，用于语法提示与标签文案。
import { useI18n } from 'vue-i18n'

// 引入统一文件展示逻辑。
import { useFilePresentation } from './utils'

// 定义编辑器组件入参。
const props = defineProps({
  modelValue: { type: String, default: '' },
  path: { type: String, default: '' },
  showSyntax: { type: Boolean, default: true },
})

// 定义 v-model 更新事件。
const emit = defineEmits(['update:modelValue'])

// 获取全局翻译函数。
const { t } = useI18n({ useScope: 'global' })

// 把路径转成 ref，便于工具函数消费。
const pathRef = toRef(props, 'path')

// 用 computed 包装内容，保持与预览逻辑一致。
const contentRef = computed(() => {
  return props.modelValue
})

// 统一生成模式标签与语法提示。
const { previewModeLabel, syntaxType, syntaxMessage } = useFilePresentation(pathRef, contentRef, t)

// 处理文本输入并向父组件同步。
const onInput = (event) => {
  emit('update:modelValue', event.target.value)
};
</script>

<style scoped>
.cw-file-editor {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.cw-file-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}

.cw-file-editor__syntax {
  margin-bottom: 10px;
}

.cw-file-editor__textarea {
  flex: 1;
  resize: none;
  min-height: 0;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.cw-file-editor__textarea:focus {
  outline: none;
  border-color: var(--el-color-primary);
}
</style>

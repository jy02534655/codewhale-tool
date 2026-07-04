<template>
  <div class="cw-file-preview">
    <div v-if="showHeader" class="cw-file-preview__header">
      <span class="cw-file-preview__path">{{ path || '' }}</span>
      <el-tag v-if="path" size="small" effect="plain">{{ previewModeLabel }}</el-tag>
    </div>
    <el-alert
      v-if="showSyntax && syntaxMessage"
      :title="syntaxMessage"
      :type="syntaxType"
      :closable="false"
      class="cw-file-preview__syntax"
    />
    <div v-if="previewMode === 'markdown'" class="cw-file-preview__body skill-preview markdown-preview" v-html="previewHtml"></div>
    <pre v-else-if="previewMode === 'code'" class="cw-file-preview__body skill-preview code-preview"><code class="hljs" v-html="previewCodeHtml"></code></pre>
    <div v-else class="cw-file-preview__body skill-preview text-preview">{{ content }}</div>
  </div>
</template>

<script setup>
// 引入 toRef，便于将 props 转成可复用响应式引用。
import { toRef } from 'vue'

// 引入全局国际化实例，生成语法提示文案。
import { useI18n } from 'vue-i18n'

// 引入统一文件展示逻辑。
import { useFilePresentation } from './utils'

// 引入代码高亮主题样式。
import 'highlight.js/styles/github-dark.css'

// 定义预览组件入参。
const props = defineProps({
  path: { type: String, default: '' },
  content: { type: String, default: '' },
  showHeader: { type: Boolean, default: false },
  showSyntax: { type: Boolean, default: false },
})

// 获取全局翻译函数。
const { t } = useI18n({ useScope: 'global' })

// 把路径转成 ref，便于工具函数消费。
const pathRef = toRef(props, 'path')

// 把内容转成 ref，便于工具函数消费。
const contentRef = toRef(props, 'content')

// 统一生成预览与语法提示数据。
const { previewMode, previewModeLabel, previewHtml, previewCodeHtml, syntaxType, syntaxMessage } = useFilePresentation(pathRef, contentRef, t)
</script>

<style scoped>
.cw-file-preview {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
}

.cw-file-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
}

.cw-file-preview__path {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.cw-file-preview__syntax {
  margin-bottom: 10px;
}

.cw-file-preview__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}
</style>

<style>
/* ─── 全局 Skill 文件预览样式（非 scoped，作用于 v-html 渲染内容）─── */
.skill-preview {
  box-sizing: border-box;
}

.skill-preview.markdown-preview {
  font-size: 14px;
  padding: 16px 18px;
  line-height: 1.8;
  overflow-wrap: break-word;
  word-break: break-word;
  overflow-x: hidden;
}

.skill-preview.markdown-preview h1,
.skill-preview.markdown-preview h2,
.skill-preview.markdown-preview h3,
.skill-preview.markdown-preview h4,
.skill-preview.markdown-preview h5,
.skill-preview.markdown-preview h6 {
  margin-top: 0;
  margin-bottom: 12px;
  line-height: 1.35;
}

.skill-preview.markdown-preview p,
.skill-preview.markdown-preview ul,
.skill-preview.markdown-preview ol,
.skill-preview.markdown-preview blockquote {
  margin-top: 0;
  margin-bottom: 12px;
  overflow-wrap: break-word;
  word-break: break-word;
}

.skill-preview.markdown-preview code {
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  overflow-wrap: break-word;
  word-break: break-word;
}

.skill-preview.markdown-preview pre {
  margin-top: 0;
  margin-bottom: 12px;
  overflow-x: hidden;
  max-width: 100%;
}

.skill-preview.markdown-preview pre code {
  display: block;
  padding: 14px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
}

.skill-preview.markdown-preview table {
  width: 100%;
  border-collapse: collapse;
  display: table;
  overflow-wrap: break-word;
  word-break: break-word;
}

.skill-preview.markdown-preview th,
.skill-preview.markdown-preview td {
  border: 1px solid var(--border);
  padding: 8px 10px;
  text-align: left;
  overflow-wrap: break-word;
  word-break: break-word;
}

.skill-preview.code-preview {
  margin: 0;
  padding: 16px 18px;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
  overflow-x: hidden;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.7;
}

.skill-preview.code-preview code {
  display: block;
  font-family: inherit;
}

.skill-preview.text-preview {
  padding: 16px 18px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
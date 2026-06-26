<!--
  readme.vue — SKILL.md 在线编辑弹窗
  使用 compositionDialogBase，左右分栏
--><template>
  <el-dialog v-model="isShow" :title="$t('skill.editReadme')" width="800px" top="5vh" :close-on-click-modal="false" destroy-on-close @close="resetForm">
    <div v-loading="loading" class="md-editor-layout">
      <div class="md-editor-pane">
        <div class="pane-header">{{ $t('common.edit') }}</div>
        <textarea v-model="content" class="md-textarea" spellcheck="false"></textarea>
      </div>
      <div class="md-editor-pane md-preview-pane">
        <div class="pane-header">{{ $t('common.preview') }}</div>
        <div class="md-preview" v-html="previewHtml"></div>
      </div>
    </div>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="onSubmit">{{ $t('common.save') }}</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, computed } from 'vue'
import { getReadme, saveReadme } from '@/api/skill'
import { compositionDialogBase } from '@/composition/dialog/Base'

const emit = defineEmits(['submitSuccess'])

let skillId = ''
const loading = ref(false)
const saving = ref(false)
const content = ref('')

function simpleMdToHtml(text) {
  if (!text) return ''
  let html = text
  html = html.replace(/```([\s\S]*?)```/g, function (_, code) { return '<pre><code>' + escapeHtml(code) + '</code></pre>' })
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<em><strong>$1</strong></em>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p><\/p>/g, '')
  return html
}
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const previewHtml = computed(function () {
  try { return simpleMdToHtml(content.value) } catch { return '<p style="color:red">渲染失败</p>' }
})

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function (opts) {
    const data = opts && opts.data
    if (data) {
      skillId = data.id || data
      content.value = ''
      loading.value = true
      const id = data.id || data
      getReadme(id)
        .then(function (res) { content.value = res || '# ' + id + '\n\n' })
        .catch(function () { content.value = '# ' + id + '\n\n' })
        .finally(function () { loading.value = false })
    }
  }
})

function resetForm() { skillId = ''; content.value = '' }

function onSubmit() {
  if (!skillId) return
  saving.value = true
  saveReadme(skillId, content.value)
    .then(function () { hideDialog(); emit('submitSuccess') })
    .finally(function () { saving.value = false })
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>
<style scoped>
.md-editor-layout { display: flex; gap: 12px; height: 60vh; }
.md-editor-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.pane-header { font-size: 12px; font-weight: 600; color: var(--text-secondary); padding-bottom: 6px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.md-textarea { flex: 1; resize: none; font-family: monospace; font-size: 13px; line-height: 1.6; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-primary); color: var(--text-primary); }
.md-textarea:focus { outline: none; border-color: var(--el-color-primary); }
.md-preview { flex: 1; overflow-y: auto; padding: 12px; border: 1px solid var(--border-secondary, #eee); border-radius: var(--radius); font-size: 14px; line-height: 1.7; word-wrap: break-word; background: var(--bg-primary); }
.md-preview :deep(h1) { font-size: 1.6em; margin: 0.5em 0 0.3em; }
.md-preview :deep(h2) { font-size: 1.3em; }
.md-preview :deep(h3) { font-size: 1.1em; }
.md-preview :deep(code) { background: var(--bg-secondary); padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.md-preview :deep(pre) { background: var(--bg-secondary); padding: 12px; border-radius: var(--radius); overflow-x: auto; }
.md-preview :deep(pre code) { background: none; padding: 0; }
.md-preview :deep(blockquote) { border-left: 3px solid var(--el-color-primary); padding-left: 12px; margin: 12px 0; color: var(--text-secondary); }
.md-preview :deep(ul) { padding-left: 1.5em; }
.md-preview :deep(ol) { padding-left: 1.5em; }
.md-preview :deep(a) { color: var(--el-color-primary); }
</style>
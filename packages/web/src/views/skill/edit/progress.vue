<!--
  progress.vue — 安装进度浮层组件
  第一行：当前步骤标签 + 下载附加信息
  第二行：总进度条
  第三行：download-skill.log 格式化日志实时推送
--><template>
  <el-dialog v-model="isShow" :title="$t('skill.progressTitle')" width="680px" top="5vh" :close-on-click-modal="false" :close-on-press-escape="!running" :show-close="!running" :destroy-on-close="true">
    <!-- 第一行：当前步骤（简单位置指示，不显示日志） -->
    <div v-if="activeStepLabel" class="ip-step-row">
      <span class="ip-step-icon">{{ running ? '⏳' : '✅' }}</span>
      <span class="ip-step-label-active">{{ activeStepLabel }}</span>
      <span v-if="stepDetail" class="ip-step-detail">{{ stepDetail }}</span>
      <span v-if="showStats" class="ip-step-meta">{{ formatBytes(downloadBytes) }} / {{ formatBytes(totalBytes) }}</span>
      <span v-if="showStats && speedText" class="ip-step-speed">{{ speedText }}</span>
    </div>

    <!-- 第二行：进度 -->
    <div class="ip-progress-block">
      <div class="ip-progress-row">
        <div class="ip-progress-bar">
          <el-progress :percentage="totalPercent" :status="totalPercent >= 100 ? 'success' : ''" :stroke-width="10" />
        </div>
      </div>
    </div>

    <el-divider />

    <!-- 第三行：download-skill.log 格式化日志（来自 _onLog 回调，已是 [时间戳] [LEVEL] 格式） -->
    <div ref="logRef" class="ip-log">
      <div v-for="(entry, i) in logEntries" :key="i" class="ip-log-line" :class="'ip-log--' + entry.level.toLowerCase()">{{ entry.message }}</div>
      <div v-if="logEntries.length === 0 && !running" class="ip-log-empty">{{ $t('skill.installDone') }}</div>
      <div v-if="logEntries.length === 0 && running" class="ip-log-empty">{{ $t('skill.waitingStart') }}</div>
    </div>

    <template #footer>
      <el-button v-if="!running" type="primary" @click="closeDialog">{{ $t('common.close') }}</el-button>
      <el-button v-else disabled type="info">{{ $t('skill.installingMsg') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { compositionDialogBase } from '@/composition/dialog/Base'

const emit = defineEmits(['complete'])
const { isShow, showDialog, hideDialog } = compositionDialogBase({})
const { t } = useI18n({ useScope: 'global' })

// ─── 步骤映射 ──────────────────────────────────────────────
const STAGE_MAP = {
  connecting: t('skill.stageConnecting'),
  downloading: t('skill.stageDownloading'),
  extracting: t('skill.stageExtracting'),
  installing: t('skill.stageInstalling'),
  registering: t('skill.stageInstalling'),
  verifying: t('skill.stageVerifying'),
  done: t('skill.stageDone'),
  fallback: t('skill.stageFallback'),
  cloning: t('skill.stageCloning'),
  checkout: t('skill.stageCheckout'),
  checking_out: t('skill.stageCheckout'),
  copying: t('skill.stageCopying'),
  cloned: t('skill.stageCloned'),
  finding: t('skill.stageFinding'),
  extracted: t('skill.stageExtracted'),
  api_complete: t('skill.stageApiComplete'),
  download: t('skill.stageDownloading'),
  detected: t('skill.stageDetected'),
}

// ─── 基本状态 ──────────────────────────────────────────────
const running = ref(false)
const activeStepLabel = ref('')
const stepDetail = ref('')
const totalPercent = ref(0)
const downloadPercent = ref(0)
const downloadBytes = ref(0)
const totalBytes = ref(0)
const speedText = ref('')
const showStats = ref(false)
const showSubProgress = ref(false)
const logEntries = ref([])
const logRef = ref(null)
let es = null

// ─── 格式化工具 ────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

// ─── 启动 ──────────────────────────────────────────────────
function start(url) {
  logEntries.value = []
  activeStepLabel.value = t('skill.preparing')
  stepDetail.value = ''
  totalPercent.value = 0; downloadPercent.value = 0
  downloadBytes.value = 0; totalBytes.value = 0
  speedText.value = ''; showStats.value = false
  showSubProgress.value = false
  running.value = true; showDialog()

  es = new EventSource(url)

  // ── progress 事件：步骤 + 进度 + 字节数 ──
  es.addEventListener('progress', function (e) {
    let data
    try { data = JSON.parse(e.data) } catch { return }
    if (data.stage) {
      const label = STAGE_MAP[data.stage] || data.stage
      if (activeStepLabel.value !== label) activeStepLabel.value = label
    }
    if (data.message) stepDetail.value = data.message
    if (data.percent != null) totalPercent.value = Math.round(data.percent)
    if (data.downloaded != null) {
      downloadBytes.value = data.downloaded; showStats.value = true
      if (data.downloaded > 0) showSubProgress.value = true
      if (data.total && data.total > 0) {
        totalBytes.value = data.total
        downloadPercent.value = Math.round((data.downloaded / data.total) * 100)
      }
    }
    if (data.speed != null && data.speed > 0) speedText.value = formatBytes(data.speed) + '/s'
  })

  // ── complete ──
  es.addEventListener('complete', function () {
    es.close()
    activeStepLabel.value = t('skill.stageDone')
    stepDetail.value = ''; totalPercent.value = 100
    downloadPercent.value = 100; running.value = false
    showSubProgress.value = false
    nextTick(function () { scrollLog() })
    emit('complete', true)
  })

  // ── error ──
  es.addEventListener('error', function () {
    es.close(); running.value = false
    showSubProgress.value = false
    nextTick(function () { scrollLog() })
    emit('complete', false)
  })

  // ── log：download.js 的 _log() 回调，已格式化为 [时间戳] [LEVEL] message ──
  es.addEventListener('log', function (e) {
    let data
    try { data = JSON.parse(e.data) } catch { return }
    logEntries.value.push({ level: data.level || 'info', message: data.message })
    nextTick(function () { scrollLog() })
  })
}

// ─── 自动滚底 ──────────────────────────────────────────────
function scrollLog() {
  if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight
}

// ─── 关闭 ──────────────────────────────────────────────────
function closeDialog() { if (es) { es.close(); es = null }; hideDialog() }
function close() { closeDialog() }

defineExpose({ start, close })
</script>

<style scoped>
/* 第一行：步骤标签 */
.ip-step-row { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 10px; padding: 8px 12px; background: var(--el-color-primary-light-9, #ecf5ff); border-radius: 6px; color: var(--el-color-primary, #409eff); min-height: 40px; flex-wrap: wrap; }
.ip-step-icon { font-size: 16px; }
.ip-step-label-active { color: var(--el-color-primary, #409eff); }
.ip-step-detail { font-size: 12px; font-weight: 400; color: var(--text-secondary); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ip-step-meta { font-size: 12px; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
.ip-step-speed { font-size: 12px; font-weight: 500; color: var(--el-color-primary, #409eff); white-space: nowrap; }

/* 第二行：进度块 */
.ip-progress-block { margin-bottom: 4px; }
.ip-progress-row { display: flex; align-items: center; gap: 12px; min-height: 32px; }
.ip-progress-bar { flex: 1; }

/* 第三行：格式化日志（VSCode 暗色风格） */
.ip-log { height: 350px; overflow-y: auto; background: #1e1e1e; color: #d4d4d4; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: 12px; line-height: 1.65; padding: 8px 12px; border-radius: 4px; }
.ip-log-empty { color: #808080; text-align: center; padding-top: 140px; }
.ip-log-line { white-space: pre-wrap; word-break: break-all; }
.ip-log--info { color: #d4d4d4; }
.ip-log--warn { color: #dcdcaa; }
.ip-log--error { color: #f44747; }
.ip-log--debug { color: #808080; }
</style>
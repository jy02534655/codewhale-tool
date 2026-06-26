<!--
  progress.vue — 安装进度浮层组件
  第一行：当前步骤标签（简单位置指示）
  第二行：总进度条 + 子进度条（下载进度）
  第三行：download-skill.log 格式化日志实时推送
--><template>
  <el-dialog v-model="visible" title="安装进度" width="680px" top="5vh" :close-on-click-modal="false" :close-on-press-escape="!running" :show-close="!running" :destroy-on-close="true">
    <!-- 第一行：当前步骤（简单位置指示，不显示日志） -->
    <div class="ip-step-row" v-if="activeStepLabel">
      <span class="ip-step-icon">{{ running ? '⏳' : '✅' }}</span>
      <span class="ip-step-label-active">{{ activeStepLabel }}</span>
      <span v-if="stepDetail" class="ip-step-detail">{{ stepDetail }}</span>
    </div>

    <!-- 第二行：进度 -->
    <div class="ip-progress-block">
      <div class="ip-progress-row">
        <div class="ip-progress-bar">
          <el-progress :percentage="totalPercent" :status="totalPercent >= 100 ? 'success' : ''" :stroke-width="10" />
        </div>
        <span v-if="showStats" class="ip-progress-stats">{{ formatBytes(downloadBytes) }} / {{ formatBytes(totalBytes) }} {{ speedText }}</span>
      </div>
      <div class="ip-sub-progress-row" :style="{ height: showSubProgress ? '28px' : '0px', opacity: showSubProgress ? 1 : 0 }">
        <div class="ip-sub-progress-bar">
          <el-progress v-if="showSubProgress" :percentage="downloadPercent" :stroke-width="6" color="#67C23A" />
        </div>
        <span v-if="showSubProgress" class="ip-sub-label">下载进度</span>
      </div>
    </div>

    <el-divider />

    <!-- 第三行：download-skill.log 格式化日志（来自 _onLog 回调，已是 [时间戳] [LEVEL] 格式） -->
    <div class="ip-log" ref="logRef">
      <div v-for="(entry, i) in logEntries" :key="i" class="ip-log-line" :class="'ip-log--' + entry.level.toLowerCase()">{{ entry.message }}</div>
      <div v-if="logEntries.length === 0 && !running" class="ip-log-empty">安装已完成</div>
      <div v-if="logEntries.length === 0 && running" class="ip-log-empty">等待开始...</div>
    </div>

    <template #footer>
      <el-button v-if="!running" type="primary" @click="closeDialog">关闭</el-button>
      <el-button v-else disabled type="info">安装中...</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['complete'])

// ─── 步骤映射 ──────────────────────────────────────────────
var STAGE_MAP = {
  connecting: '连接仓库',
  downloading: '下载文件',
  extracting: '解压文件',
  installing: '注册 Skill',
  registering: '注册 Skill',
  verifying: '验证 SKILL.md',
  done: '安装完成',
  fallback: '回退重试',
  cloning: 'Git 克隆',
  checkout: '检出文件',
  checking_out: '检出文件',
  copying: '复制文件',
  cloned: '克隆完成',
  finding: '定位目录',
  extracted: '解压完成',
  api_complete: 'API 下载完成',
  download: '下载中',
  detected: '已探测',
}

// ─── 基本状态 ──────────────────────────────────────────────
var visible = ref(false)
var running = ref(false)
var activeStepLabel = ref('')
var stepDetail = ref('')
var totalPercent = ref(0)
var downloadPercent = ref(0)
var downloadBytes = ref(0)
var totalBytes = ref(0)
var speedText = ref('')
var showStats = ref(false)
var showSubProgress = ref(false)
var logEntries = ref([])
var logRef = ref(null)
var es = null

// ─── 格式化工具 ────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  var units = ['B', 'KB', 'MB', 'GB']
  var i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

// ─── 启动 ──────────────────────────────────────────────────
function start(url) {
  logEntries.value = []
  activeStepLabel.value = '准备连接...'
  stepDetail.value = ''
  totalPercent.value = 0; downloadPercent.value = 0
  downloadBytes.value = 0; totalBytes.value = 0
  speedText.value = ''; showStats.value = false
  showSubProgress.value = false
  running.value = true; visible.value = true

  es = new EventSource(url)

  // ── progress 事件：步骤 + 进度 + 字节数 ──
  es.addEventListener('progress', function (e) {
    var data
    try { data = JSON.parse(e.data) } catch (_) { return }
    if (data.stage) {
      var label = STAGE_MAP[data.stage] || data.stage
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
    activeStepLabel.value = '安装完成'
    stepDetail.value = ''; totalPercent.value = 100
    downloadPercent.value = 100; running.value = false
    showSubProgress.value = false
    nextTick(function () { scrollLog() })
    emit('complete', true)
  })

  // ── error ──
  es.addEventListener('error', function (e) {
    es.close(); running.value = false
    showSubProgress.value = false
    var msg = '安装失败'
    try {
      var data = JSON.parse(e.data)
      if (data && data.message) msg = data.message
    } catch (_) { /* ignore */ }
    logEntries.value.push({ level: 'error', message: msg })
    nextTick(function () { scrollLog() })
    emit('complete', false)
  })

  // ── log：download.js 的 _log() 回调，已格式化为 [时间戳] [LEVEL] message ──
  es.addEventListener('log', function (e) {
    var data
    try { data = JSON.parse(e.data) } catch (_) { return }
    logEntries.value.push({ level: data.level || 'info', message: data.message })
    nextTick(function () { scrollLog() })
  })
}

// ─── 自动滚底 ──────────────────────────────────────────────
function scrollLog() {
  if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight
}

// ─── 关闭 ──────────────────────────────────────────────────
function closeDialog() { if (es) { es.close(); es = null }; visible.value = false }
function close() { closeDialog() }

defineExpose({ start, close })
</script>

<style scoped>
/* 第一行：步骤标签 */
.ip-step-row { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; margin-bottom: 10px; padding: 8px 12px; background: #ecf5ff; border-radius: 6px; color: #409eff; height: 40px; }
.ip-step-icon { font-size: 16px; }
.ip-step-label-active { color: #409eff; }
.ip-step-detail { font-size: 12px; font-weight: 400; color: #909399; margin-left: auto; }

/* 第二行：进度块（固定高度防抖动） */
.ip-progress-block { min-height: 68px; margin-bottom: 4px; }
.ip-progress-row { display: flex; align-items: center; gap: 12px; height: 32px; }
.ip-progress-bar { flex: 1; }
.ip-progress-stats { font-size: 12px; color: #606266; white-space: nowrap; min-width: 160px; }
.ip-sub-progress-row { display: flex; align-items: center; gap: 8px; overflow: hidden; transition: opacity 0.2s, height 0.2s; }
.ip-sub-progress-bar { flex: 1; }
.ip-sub-label { font-size: 11px; color: #67C23A; white-space: nowrap; }

/* 第三行：格式化日志（VSCode 暗色风格） */
.ip-log { height: 350px; overflow-y: auto; background: #1e1e1e; color: #d4d4d4; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: 12px; line-height: 1.65; padding: 8px 12px; border-radius: 4px; }
.ip-log-empty { color: #808080; text-align: center; padding-top: 140px; }
.ip-log-line { white-space: pre-wrap; word-break: break-all; }
.ip-log--info { color: #d4d4d4; }
.ip-log--warn { color: #dcdcaa; }
.ip-log--error { color: #f44747; }
.ip-log--debug { color: #808080; }
</style>
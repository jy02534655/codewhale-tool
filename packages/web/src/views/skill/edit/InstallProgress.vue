<!--
  InstallProgress.vue — 安装进度浮层组件
  接收安装 SSE URL，自动管理 EventSource 生命周期
  从上到下：步骤列表 → 进度条 → 日志面板
-->
<template>
  <el-dialog v-model="visible" title="安装进度" width="640px" top="5vh" :close-on-click-modal="false" :close-on-press-escape="!running" :show-close="!running" :destroy-on-close="true" class="install-progress-dialog">
    <!-- 步骤列表 -->
    <div class="ip-steps">
      <div
        v-for="step in stepDefs"
        :key="step.name"
        class="ip-step"
        :class="{ 'ip-step--done': doneSteps.includes(step.name), 'ip-step--active': activeStep === step.name, 'ip-step--pending': activeStep !== step.name && !doneSteps.includes(step.name) }"
      >
        <span class="ip-step-icon">{{ doneSteps.includes(step.name) ? '✅' : activeStep === step.name ? '⏳' : '○' }}</span>
        <span class="ip-step-label">{{ step.label }}</span>
      </div>
    </div>

    <!-- 当前步骤进度 -->
    <div v-if="showProgress" class="ip-progress">
      <el-progress :percentage="progressPercent" :status="progressPercent >= 100 ? 'success' : ''" :stroke-width="8" />
    </div>

    <el-divider />

    <!-- 执行日志 -->
    <div class="ip-log" ref="logRef">
      <div v-for="(entry, i) in logEntries" :key="i" class="ip-log-line" :class="'ip-log--' + entry.level">
        <span class="ip-log-time">{{ entry.time }}</span>
        <span class="ip-log-msg">{{ entry.msg }}</span>
      </div>
    </div>

    <template #footer>
      <!-- 安装中：仅显示"关闭"按钮（完成后可关闭） -->
      <el-button v-if="!running" type="primary" @click="closeDialog">关闭</el-button>
      <el-button v-else disabled type="info">安装中...</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['complete'])

// ─── 步骤定义 ──────────────────────────────────────────────

const stepDefs = [
  { name: 'connecting', label: '连接仓库' },
  { name: 'downloading', label: '下载文件' },
  { name: 'extracting', label: '解压文件' },
  { name: 'installing', label: '注册 Skill' },
]

// ─── 状态 ──────────────────────────────────────────────────

const visible = ref(false)
const running = ref(false)
const activeStep = ref('')
const doneSteps = ref([])
const progressPercent = ref(0)
const showProgress = ref(false)
const logEntries = ref([])
const logRef = ref(null)
let es = null

// ─── 时间格式化 ────────────────────────────────────────────

function fmtTime() {
  var d = new Date()
  var h = String(d.getHours()).padStart(2, '0')
  var m = String(d.getMinutes()).padStart(2, '0')
  var s = String(d.getSeconds()).padStart(2, '0')
  return h + ':' + m + ':' + s
}

// ─── 打开浮层并开始安装 ──────────────────────────────────

function start(url) {
  logEntries.value = []
  doneSteps.value = []
  activeStep.value = ''
  progressPercent.value = 0
  showProgress.value = false
  running.value = true
  visible.value = true

  es = new EventSource(url)

  // progress 事件：追踪步骤变化和进度
  es.addEventListener('progress', function (e) {
    var data
    try { data = JSON.parse(e.data) } catch (_) { return }

    var stage = data.stage
    if (stage && activeStep.value !== stage) {
      // 上一步完成
      if (activeStep.value && !doneSteps.value.includes(activeStep.value)) {
        doneSteps.value.push(activeStep.value)
      }
      activeStep.value = stage
    }

    if (data.percent != null) {
      progressPercent.value = data.percent
      showProgress.value = data.percent > 0 && data.percent < 100
    }
  })

  // complete 事件
  es.addEventListener('complete', function () {
    es.close()
    // 标记最后一步完成
    if (activeStep.value && !doneSteps.value.includes(activeStep.value)) {
      doneSteps.value.push(activeStep.value)
    }
    // 添加完成日志
    logEntries.value.push({ time: fmtTime(), msg: '✅ 安装完成', level: 'info' })
    running.value = false
    showProgress.value = false
    progressPercent.value = 100

    nextTick(function () { scrollLog() })
    emit('complete', true)
  })

  // error 事件
  es.addEventListener('error', function (e) {
    es.close()
    running.value = false
    showProgress.value = false

    // 尝试解析错误数据
    var msg = '安装失败'
    try {
      var data = JSON.parse(e.data)
      if (data && data.message) msg = data.message
    } catch (_) { /* ignore */ }

    logEntries.value.push({ time: fmtTime(), msg: '❌ ' + msg, level: 'error' })
    nextTick(function () { scrollLog() })
    emit('complete', false)
  })

  // log 事件（纯日志，不含进度）
  es.addEventListener('log', function (e) {
    var data
    try { data = JSON.parse(e.data) } catch (_) { return }
    logEntries.value.push({ time: data.time || fmtTime(), msg: data.message, level: data.level || 'info' })
    nextTick(function () { scrollLog() })
  })
}

// ─── 日志自动滚动 ──────────────────────────────────────────

function scrollLog() {
  if (logRef.value) {
    logRef.value.scrollTop = logRef.value.scrollHeight
  }
}

// ─── 关闭 ──────────────────────────────────────────────────

function closeDialog() {
  if (es) { es.close(); es = null }
  visible.value = false
}

function close() {
  closeDialog()
}

// ─── expose ────────────────────────────────────────────────

defineExpose({ start, close })
</script>

<style scoped>
.install-progress-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
}

.ip-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.ip-step {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  background: #f5f7fa;
  color: #909399;
}

.ip-step--active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}

.ip-step--done {
  background: #f0f9eb;
  color: #67c23a;
}

.ip-step-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.ip-step-label {
  white-space: nowrap;
}

.ip-progress {
  margin-bottom: 4px;
}

.ip-log {
  max-height: 240px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 8px 12px;
  border-radius: 4px;
}

.ip-log-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.ip-log-time {
  color: #6a9955;
  margin-right: 8px;
  user-select: none;
}

.ip-log--error .ip-log-msg {
  color: #f44747;
}

.ip-log--warn .ip-log-msg {
  color: #dcdcaa;
}

.ip-log--info .ip-log-msg {
  color: #d4d4d4;
}
</style>
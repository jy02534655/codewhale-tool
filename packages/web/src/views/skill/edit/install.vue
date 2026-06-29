<!--
  install.vue — Skill 安装弹窗（左右布局）
  左侧：三种安装方式切换（GitHub 仓库 / 上传 ZIP / GitHub Tree 路径）
  右侧：安装级别 + 项目目录 + 代理 + Token
  确认后弹出现有的 InstallProgress 组件（progress.vue）展示 SSE 进度
-->
<template>
  <el-dialog v-model="isShow" :title="$t('common.install')" width="800px" top="8vh" :close-on-click-modal="false" @close="resetForm">
    <div class="install-layout">
      <!-- 左侧：安装方式 -->
      <div class="install-left">
        <el-radio-group v-model="installMode" class="install-mode-tabs">
          <el-radio-button value="github">{{ $t('skill.installMode.github') }}</el-radio-button>
          <el-radio-button value="zip">{{ $t('skill.installMode.zip') }}</el-radio-button>
          <el-radio-button value="githubPath">{{ $t('skill.installMode.githubPath') }}</el-radio-button>
        </el-radio-group>

        <!-- GitHub 仓库安装 -->
        <div v-if="installMode === 'github'" class="install-config">
          <div class="config-section">
            <label class="config-label">{{ $t('skill.repoUrl') }}</label>
            <el-input v-model="repoUrl" :placeholder="$t('skill.repoUrlPlaceholder')" />
          </div>
          <div class="config-section">
            <label class="config-label">{{ $t('skill.skillPath') }}</label>
            <el-input v-model="skillPath" :placeholder="$t('skill.skillPathPlaceholder')" />
          </div>
          <!-- 智能识别 -->
          <el-alert :title="$t('skill.quickPasteTitle')" :description="$t('skill.quickPasteDesc')" type="info" show-icon :closable="false" class="mode-tip" />
          <div class="smart-paste">
            <el-input v-model="smartInput" :placeholder="$t('skill.smartInputPlaceholder')" size="small">
              <template #append>
                <el-button :disabled="!smartInput.trim()" @click="parseSmartInput">{{ $t('skill.parse') }}</el-button>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 上传 ZIP 安装 -->
        <div v-if="installMode === 'zip'" class="install-config">
          <div class="config-section">
            <label class="config-label">{{ $t('skill.zipFile') }}</label>
            <div class="file-selector">
              <el-button size="small" @click="triggerFileInput">{{ $t('skill.chooseFile') }}</el-button>
              <span v-if="selectedFileName" class="file-name">{{ selectedFileName }}</span>
              <el-button v-if="selectedFileName" size="small" type="danger" text @click="clearSelectedFile">{{ $t('skill.clearFile') }}</el-button>
              <input ref="fileInputRef" type="file" accept=".zip" style="display:none" @change="onFileSelected" />
            </div>
          </div>
          <div class="config-section">
            <label class="config-label">{{ $t('skill.name') }}</label>
            <el-input v-model="zipSkillName" :placeholder="$t('skill.skillId')" />
          </div>
        </div>

        <!-- GitHub Tree 路径安装 -->
        <div v-if="installMode === 'githubPath'" class="install-config">
          <div class="config-section">
            <label class="config-label">{{ $t('skill.githubPathUrl') }}</label>
            <el-input v-model="githubTreeUrl" :placeholder="$t('skill.githubPathPlaceholder')" />
          </div>
        </div>
      </div>

      <!-- 右侧：安装级别 + 代理/Token -->
      <div class="install-right">
        <el-form label-position="top">
          <el-form-item :label="$t('skill.level')">
            <el-radio-group v-model="level" @change="onLevelChange">
              <el-radio value="global">{{ $t('skill.global') }}</el-radio>
              <el-radio value="project">{{ $t('skill.project') }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="level === 'project'" :label="$t('skill.projectPath')">
            <el-input v-model="projectPath" :placeholder="$t('skill.projectPathPlaceholder')" />
          </el-form-item>

          <el-form-item :label="$t('skill.proxy_select')">
            <el-select v-model="selectedProxyId" :placeholder="$t('skill.proxy_select_placeholder')" clearable style="width:100%">
              <el-option v-for="p in proxyList" :key="p.id" :label="p.alias + ' (' + p.type + '://' + p.host + ':' + p.port + ')'" :value="p.id" />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('skill.token_select')">
            <el-select v-model="selectedTokenId" :placeholder="$t('skill.token_select_placeholder')" clearable style="width:100%">
              <el-option v-for="t in tokenList" :key="t.id" :label="t.alias + ' (' + t.token + ')'" :value="t.id" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button :disabled="installing" @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="installing" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 安装进度浮层 -->
  <InstallProgress ref="progressRef" @complete="onInstallComplete" />
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getProxyList } from '@/api/proxy'
import { getTokenList } from '@/api/token'
import { getCurrentProjectDir } from '@/api/skill'
import { compositionDialogBase } from '@/composition/dialog/Base'
import InstallProgress from './progress.vue'

const emit = defineEmits(['submitSuccess'])
const { t } = useI18n({ useScope: 'global' })

// ─── 弹窗生命周期 ──────────────────────────────────────────
const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function () { _initForm() }
})

// ─── 输入字段 ──────────────────────────────────────────────
const installMode = ref('github')
const smartInput = ref('')
const repoUrl = ref('')
const skillPath = ref('')
const level = ref('global')
const projectPath = ref('')
const selectedProxyId = ref('')
const selectedTokenId = ref('')
const installing = ref(false)

// ZIP 安装字段
const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFileName = ref('')
const zipSkillName = ref('')

// GitHub Tree 路径字段
const githubTreeUrl = ref('')

// ─── 下拉列表 ──────────────────────────────────────────────
const proxyList = ref([])
const tokenList = ref([])

// ─── 进度浮层 ──────────────────────────────────────────────
const progressRef = ref(null)

// ─── 智能识别 ──────────────────────────────────────────────
function parseSmartInput() {
  const text = smartInput.value.trim()
  if (!text) return

  // 匹配 npx skills add <url> --skill <path> 格式
  let match = text.match(/npx\s+skills\s+add\s+(\S+)(?:\s+--skill\s+(\S+))?/)
  if (!match) {
    // 匹配直接粘贴 URL 格式
    match = text.match(/^(https?:\/\/[^\s]+)/)
    if (!match) {
      ElMessage.warning(t('skill.parseFailed'))
      return
    }
    repoUrl.value = match[1]
  } else {
    repoUrl.value = match[1]
    if (match[2]) {
      skillPath.value = match[2]
    }
  }
}

// ─── 文件选择 ──────────────────────────────────────────────
function triggerFileInput() {
  if (fileInputRef.value) fileInputRef.value.click()
}

function onFileSelected(event) {
  const file = event.target.files && event.target.files[0]
  if (!file) return
  selectedFile.value = file
  selectedFileName.value = file.name
  // 自动填充 skill 名称（去掉 .zip 后缀）
  if (!zipSkillName.value) {
    zipSkillName.value = file.name.replace(/\.zip$/i, '')
  }
}

function clearSelectedFile() {
  selectedFile.value = null
  selectedFileName.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
  // 不自动清除 zipSkillName，让用户决定
}

// ─── 级别切换 ──────────────────────────────────────────────
function onLevelChange() {
  if (level.value === 'global') {
    projectPath.value = ''
  }
}

// ─── 表单初始化 ────────────────────────────────────────────
function _initForm() {
  _resetForm()
  getProxyList().then(function (data) {
    proxyList.value = data || []
    const def = (data || []).find(function (p) { return p.default })
    if (def) selectedProxyId.value = def.id
  }).catch(function () {
    proxyList.value = []
  })
  getTokenList().then(function (data) {
    tokenList.value = data || []
    const def = (data || []).find(function (t) { return t.default })
    if (def) selectedTokenId.value = def.id
  }).catch(function () {
    tokenList.value = []
  })
  getCurrentProjectDir().then(function (res) {
    if (res && res.data) projectPath.value = res.data
  }).catch(function () { /* ignore */ })
}

function _resetForm() {
  installMode.value = 'github'
  smartInput.value = ''
  repoUrl.value = ''
  skillPath.value = ''
  level.value = 'global'
  projectPath.value = ''
  selectedProxyId.value = ''
  selectedTokenId.value = ''
  installing.value = false
  selectedFile.value = null
  selectedFileName.value = ''
  zipSkillName.value = ''
  githubTreeUrl.value = ''
}

function resetForm() {
  _resetForm()
}

// ─── 提交 ──────────────────────────────────────────────────
function onSubmit() {
  if (installMode.value === 'github') {
    _submitGithub()
  } else if (installMode.value === 'zip') {
    _submitZipStream()
  } else if (installMode.value === 'githubPath') {
    _submitGithubPath()
  }
}

function _submitGithub() {
  if (!repoUrl.value.trim()) {
    ElMessage.warning(t('skill.repoUrlPlaceholder'))
    return
  }
  installing.value = true

  const params = new URLSearchParams({
    repoUrl: repoUrl.value.trim(),
    skillPath: skillPath.value.trim() || '',
    level: level.value,
  })
  if (selectedProxyId.value) params.append('proxyId', selectedProxyId.value)
  if (selectedTokenId.value) params.append('tokenId', selectedTokenId.value)
  if (level.value === 'project' && projectPath.value.trim()) {
    params.append('projectPath', projectPath.value.trim())
  }

  const url = '/api/skill/install-github-stream?' + params.toString()
  if (progressRef.value) progressRef.value.start(url)
}

function _submitZipStream() {
  if (!selectedFile.value) {
    ElMessage.warning(t('skill.chooseFile'))
    return
  }
  installing.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('skillName', zipSkillName.value || '')
  formData.append('level', level.value)

  fetch('/api/skill/install-zip-stream', { method: 'POST', body: formData })
    .then(function (r) { return r.json() })
    .then(function (data) {
      if (data.success && data.streamId) {
        if (progressRef.value) {
          progressRef.value.start('/api/skill/install-zip-stream/sse/' + data.streamId)
        }
      } else {
        installing.value = false
        ElMessage.error(data.message || t('skill.installFailed'))
      }
    })
    .catch(function (err) {
      installing.value = false
      ElMessage.error(t('skill.installFailed') + ': ' + err.message)
    })
}

function _submitGithubPath() {
  if (!githubTreeUrl.value.trim()) {
    ElMessage.warning(t('skill.githubPathPlaceholder'))
    return
  }
  installing.value = true

  const params = new URLSearchParams({
    githubUrl: githubTreeUrl.value.trim(),
    level: level.value,
  })
  if (selectedProxyId.value) params.append('proxyId', selectedProxyId.value)
  if (selectedTokenId.value) params.append('tokenId', selectedTokenId.value)

  const url = '/api/skill/install-github-path-stream?' + params.toString()
  if (progressRef.value) progressRef.value.start(url)
}

function onInstallComplete(success) {
  installing.value = false
  hideDialog()
  if (success) {
    emit('submitSuccess')
  }
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>

<style scoped>
.install-layout {
  display: flex;
  gap: 24px;
  min-height: 320px;
}
.install-left {
  flex: 1;
  min-width: 0;
}
.install-right {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-light, #e4e7ed);
  padding-left: 20px;
}
.install-mode-tabs {
  margin-bottom: 16px;
  width: 100%;
}
.install-mode-tabs .el-radio-button {
  flex: 1;
}
.install-config {
  padding: 4px 0;
}
.config-section {
  margin-bottom: 14px;
}
.config-section .config-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  font-weight: 500;
}
.mode-tip {
  margin-bottom: 10px;
}
.mode-tip :deep(.el-alert__description) {
  font-size: 12px;
}
.smart-paste {
  margin-bottom: 4px;
}
.file-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}
.file-name {
  font-size: 13px;
  color: var(--el-text-color-primary, #303133);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.install-right .el-form-item {
  margin-bottom: 16px;
}
.install-right :deep(.el-form-item__label) {
  font-size: 13px;
  padding-bottom: 4px;
}
</style>
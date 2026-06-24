<!--
  install.vue — Skill 安装弹窗（三种安装模式）
  模式：github（GitHub仓库）/ zip（ZIP包）/ skillhub（Skillhub搜索）
  使用 compositionDialogBase
-->
<template>
  <el-dialog v-model="isShow" :title="$t('skill.install')" width="560px" :close-on-click-modal="false" @close="resetForm">

    <!-- 安装模式选择（单选框） -->
    <el-radio-group v-model="mode" class="install-mode-group" @change="onModeChange">
      <el-radio value="github">{{ $t('skill.installMode.github') }}</el-radio>
      <el-radio value="zip">{{ $t('skill.installMode.zip') }}</el-radio>
      <el-radio value="skillhub">{{ $t('skill.installMode.skillhub') }}</el-radio>
    </el-radio-group>

    <!-- 各模式使用说明 -->
    <el-alert :title="modeTipTitle" :description="modeTipDesc" type="info" show-icon :closable="false" class="mode-tip" />

    <el-form label-position="top" class="install-form">
      <!-- GitHub 模式 -->
      <template v-if="mode === 'github'">
        <el-form-item :label="$t('skill.repoUrl')">
          <el-input v-model="repoUrl" placeholder="https://github.com/user/repo" />
        </el-form-item>
        <el-form-item :label="$t('skill.skillPath')">
          <el-input v-model="skillPath" placeholder="如 skills/find-skills（可选）" />
        </el-form-item>
      </template>

      <!-- ZIP 模式 -->
      <template v-else-if="mode === 'zip'">
        <el-form-item :label="$t('skill.zipUrl')">
          <el-input v-model="zipUrl" placeholder="https://example.com/skill.zip" :disabled="hasLocalFile" />
        </el-form-item>
        <div class="zip-divider">
          <span>{{ $t('skill.zipOr') }}</span>
        </div>
        <el-form-item :label="$t('skill.zipFile')">
          <div class="zip-file-row">
            <el-button size="small" @click="triggerFileInput" :disabled="!!zipUrl.trim()">
              {{ $t('skill.chooseFile') }}
            </el-button>
            <span v-if="zipFileName" class="zip-file-name">{{ zipFileName }}</span>
            <el-button v-if="zipFileName" size="small" type="danger" plain @click="clearFile">
              {{ $t('skill.clearFile') }}
            </el-button>
          </div>
          <input ref="fileInput" type="file" accept=".zip" style="display:none" @change="onFileChange" />
        </el-form-item>
      </template>

      <!-- Skillhub 模式 -->
      <template v-else-if="mode === 'skillhub'">
        <!-- 未安装时：显示安装引导 -->
        <template v-if="skillHubLoaded && !skillHubInstalled">
          <el-alert :title="$t('skill.skillhub.notInstalled')" type="warning" show-icon :closable="false" class="sh-notice" />
          <div class="sh-install-row">
            <el-button type="primary" :loading="installingSkillHub" @click="onInstallSkillhub">
              {{ installingSkillHub ? $t('skill.skillhub.installing') : $t('skill.skillhub.installNow') }}
            </el-button>
          </div>
        </template>
        <!-- 已安装时：显示搜索框 + 结果列表 -->
        <template v-else-if="skillHubInstalled">
          <el-form-item :label="$t('skill.skillhub.searchPlaceholder')">
            <el-input v-model="shKeyword" :placeholder="$t('skill.skillhub.searchPlaceholder')"
              @keyup.enter="onSearch" clearable class="sh-search-input">
              <template #append>
                <el-button :loading="shSearching" @click="onSearch">{{ $t('common.search') || '搜索' }}</el-button>
              </template>
            </el-input>
          </el-form-item>
          <!-- 搜索结果 -->
          <div v-if="shResults.length > 0" class="sh-results">
            <div v-for="item in shResults" :key="item.name" class="sh-result-item">
              <div class="sh-result-info">
                <span class="sh-result-name">{{ item.name }}</span>
                <span v-if="item.description" class="sh-result-desc">{{ item.description }}</span>
              </div>
              <el-button size="small" type="primary"
                :loading="shInstallingName === item.name"
                @click="onInstallSkill(item.name)">
                {{ shInstallingName === item.name ? $t('skill.skillhub.installingSkill') : $t('skill.skillhub.installSkill') }}
              </el-button>
            </div>
          </div>
          <el-empty v-if="shSearched && shResults.length === 0" :description="$t('skill.skillhub.noResults')" />
        </template>
        <!-- 加载中 -->
        <div v-else class="sh-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
      </template>

      <!-- 代理设置（GitHub / ZIP 模式通用） -->
      <template v-if="mode !== 'skillhub'">
        <el-divider />
        <el-form-item :label="$t('skill.proxyUrl')">
          <el-input v-model="proxyUrl" placeholder="socks5://127.0.0.1:1080 或 http://127.0.0.1:7890（可选）" />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :disabled="!canSubmit" :loading="maskingStore.isLoading" @click="onSubmit" v-if="mode !== 'skillhub'">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { installFromGithub, installFromZip, uploadZip, skillhubStatus, skillhubInstall, skillhubSearch, skillhubInstallSkill } from '@/api/skill'
import { useMaskingStore } from '@/stores/masking'
import { compositionDialogBase } from '@/composition/dialog/Base'

const emit = defineEmits(['submitSuccess'])
const maskingStore = useMaskingStore()

// 安装模式
const mode = ref('github')

// 各模式输入字段 (github / zip)
const repoUrl = ref('')
const skillPath = ref('')
const zipUrl = ref('')
const fileInput = ref(null)
const zipFileName = ref('')
var zipBase64 = ''
const proxyUrl = ref('')

// 是否有本地文件已选择
const hasLocalFile = computed(function () { return !!zipBase64 })

// ─── Skillhub ─────────────────────────────────────────────────

/** 状态 */
const skillHubLoaded = ref(false)
const skillHubInstalled = ref(false)
const installingSkillHub = ref(false)
const shKeyword = ref('')
const shSearching = ref(false)
const shSearched = ref(false)
const shResults = ref([])
const shInstallingName = ref('')

// 检查 Skillhub 安装状态
function checkSkillhubStatus() {
  skillHubLoaded.value = false
  skillhubStatus().then(function (data) {
    skillHubInstalled.value = data && data.installed === true
    skillHubLoaded.value = true
  }).catch(function () {
    skillHubInstalled.value = false
    skillHubLoaded.value = true
  })
}

// 安装 Skillhub CLI
function onInstallSkillhub() {
  installingSkillHub.value = true
  skillhubInstall().finally(function () {
    installingSkillHub.value = false
    // 重新检查状态
    checkSkillhubStatus()
  })
}

// 搜索技能
function onSearch() {
  var keyword = shKeyword.value.trim()
  if (!keyword) return
  shSearching.value = true
  shSearched.value = true
  skillhubSearch(keyword).then(function (data) {
    shResults.value = Array.isArray(data) ? data : []
  }).catch(function () {
    shResults.value = []
    ElMessage.warning(shKeyword.value ? '搜索失败' : '请输入关键词')
  }).finally(function () {
    shSearching.value = false
  })
}

// 安装技能
function onInstallSkill(name) {
  shInstallingName.value = name
  skillhubInstallSkill(name).then(function () {
    emit('submitSuccess')
    hideDialog()
  }).catch(function () {
    // 错误消息已由 request.js 自动显示
  }).finally(function () {
    shInstallingName.value = ''
  })
}

// ─── 各模式提示 ──────────────────────────────────────────────

var modeTips = {
  github: {
    title: '从任意 GitHub 仓库安装',
    desc: '输入包含 SKILL.md 的 GitHub 仓库地址。如果仓库内含多个 Skill，请在「Skill 路径」指定子目录（如 skills/find-skills）。'
  },
  zip: {
    title: '从 ZIP 压缩包安装',
    desc: '输入 ZIP 文件的下载链接，或点击下方按钮选择本地 .zip 文件。支持任意包含 SKILL.md 的压缩包。'
  },
  skillhub: {
    title: '通过 Skillhub 搜索安装',
    desc: 'Skillhub 提供国内加速的 skill 搜索与安装服务。输入关键词搜索社区开放的 skill，点击「安装」即可。'
  }
}

const modeTipTitle = computed(function () { return modeTips[mode.value].title })
const modeTipDesc = computed(function () { return modeTips[mode.value].desc })

// ─── 提交按钮启用条件 ──────────────────────────────────────────

const canSubmit = computed(function () {
  switch (mode.value) {
    case 'github':    return repoUrl.value.trim() !== ''
    case 'zip':       return zipUrl.value.trim() !== '' || !!zipBase64
    case 'skillhub':  return false // skillhub 模式不使用底部提交按钮
    default: return false
  }
})

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function () { resetForm() }
})

function resetForm() {
  repoUrl.value = ''
  skillPath.value = ''
  zipUrl.value = ''
  zipFileName.value = ''
  zipBase64 = ''
  proxyUrl.value = ''
  if (fileInput.value) { fileInput.value.value = '' }
  // 重置 skillhub 状态
  shKeyword.value = ''
  shResults.value = []
  shSearched.value = false
  shInstallingName.value = ''
}

// 切换模式时重置
function onModeChange() {
  resetForm()
  if (mode.value === 'skillhub') {
    checkSkillhubStatus()
  }
}

// ─── ZIP 文件选择 ──────────────────────────────────────────────

function triggerFileInput() { fileInput.value.click() }

function onFileChange(e) {
  var file = e.target.files[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.zip')) {
    ElMessage.error('请选择 .zip 文件')
    return
  }
  zipFileName.value = file.name
  // 读取为 base64
  var reader = new FileReader()
  reader.onload = function () {
    // 去掉 data:application/zip;base64, 前缀
    zipBase64 = reader.result.split(',')[1] || reader.result
  }
  reader.readAsDataURL(file)
}

function clearFile() {
  zipFileName.value = ''
  zipBase64 = ''
  fileInput.value.value = ''
}

// ─── 提交 ─────────────────────────────────────────────────────

function onSubmit() {
  var promise
  var pUrl = proxyUrl.value.trim() || undefined
  switch (mode.value) {
    case 'github':
      promise = installFromGithub(repoUrl.value.trim(), skillPath.value.trim() || undefined, undefined, pUrl)
      break
    case 'zip':
      if (zipBase64) {
        promise = uploadZip(zipBase64, zipFileName.value)
      } else {
        promise = installFromZip(zipUrl.value.trim(), undefined, pUrl)
      }
      break
    default:
      return
  }
  promise.then(function () { hideDialog(); emit('submitSuccess') })
}

defineExpose({ showDialog, hideDialog, showDialogByData })
</script>
<style scoped>
.install-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border, #e4e7ed);
}
.mode-tip {
  margin-bottom: 12px;
}
.install-form {
  margin-top: 12px;
}
.zip-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.zip-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zip-file-name {
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* ── Skillhub ── */
.sh-notice {
  margin-bottom: 12px;
}
.sh-install-row {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
.sh-search-input {
  width: 100%;
}
.sh-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  font-size: 24px;
}
.sh-results {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color, #e4e7ed);
  border-radius: 4px;
}
.sh-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-light, #ebeef5);
}
.sh-result-item:last-child {
  border-bottom: none;
}
.sh-result-info {
  flex: 1;
  min-width: 0;
  margin-right: 8px;
}
.sh-result-name {
  display: block;
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary, #303133);
}
.sh-result-desc {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
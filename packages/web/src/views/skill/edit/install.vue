<!--
  install.vue — Skill 安装弹窗（仅 GitHub 仓库安装）
  代理和 Token 从管理页面配置的下拉列表中选择（按别名）
  支持智能识别 npx 命令格式，自动填充仓库 URL 和 Skill 路径
  支持项目级别时选择安装目录
  打开时自动选中默认代理和 Token
  确认后弹出 InstallProgress 浮层展示步骤/进度/日志
-->
<template>
  <el-dialog v-model="isShow" :title="$t('skill.install')" width="560px" :close-on-click-modal="false" @close="resetForm">

    <!-- 快速粘贴提示 -->
    <el-alert :title="$t('skill.quickPasteTitle')" :description="$t('skill.quickPasteDesc')" type="info" show-icon :closable="false" class="mode-tip" />

    <!-- 智能识别输入框 — 始终显示 -->
    <div class="smart-paste">
      <el-input v-model="smartInput" :placeholder="$t('skill.smartInputPlaceholder')" size="small" @input="onSmartInput">
        <template #append>
          <el-button @click="parseSmartInput" :disabled="!smartInput.trim()">{{ $t('skill.parse') }}</el-button>
        </template>
      </el-input>
    </div>

    <el-form label-position="top" class="install-form">
      <el-form-item :label="$t('skill.repoUrl')">
        <el-input v-model="repoUrl" :placeholder="$t('skill.repoUrlPlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('skill.skillPath')">
        <el-input v-model="skillPath" :placeholder="$t('skill.skillPathPlaceholder')" />
      </el-form-item>

      <el-divider />

      <!-- 安装级别 -->
      <el-form-item :label="$t('skill.level')">
        <el-radio-group v-model="level" @change="onLevelChange">
          <el-radio value="global">{{ $t('skill.global') }}</el-radio>
          <el-radio value="project">{{ $t('skill.project') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 项目目录（仅项目级别显示）—— 后端获取默认目录 -->
      <el-form-item v-if="level === 'project'" :label="$t('skill.projectPath')">
        <el-input v-model="projectPath" :placeholder="$t('skill.projectPathPlaceholder')" />
      </el-form-item>

      <!-- 代理选择下拉 — 不标注默认 -->
      <el-form-item :label="$t('skill.proxy_select')">
        <el-select v-model="selectedProxyId" :placeholder="$t('skill.proxy_select_placeholder')" clearable style="width:100%">
          <el-option
            v-for="p in proxyList"
            :key="p.id"
            :label="p.alias + ' (' + p.type + '://' + p.host + ':' + p.port + ')'"
            :value="p.id"
          />
        </el-select>
      </el-form-item>

      <!-- Token 选择下拉 — 不标注默认 -->
      <el-form-item :label="$t('skill.token_select')">
        <el-select v-model="selectedTokenId" :placeholder="$t('skill.token_select_placeholder')" clearable style="width:100%">
          <el-option
            v-for="t in tokenList"
            :key="t.id"
            :label="t.alias + ' (' + t.token + ')'"
            :value="t.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="installing" @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :disabled="!canSubmit" :loading="installing" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 安装进度浮层 -->
  <InstallProgress ref="progressRef" @complete="onInstallComplete" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getProxyList } from '@/api/proxy'
import { getTokenList } from '@/api/token'
import { getCurrentProjectDir } from '@/api/skill'
import { compositionDialogBase } from '@/composition/dialog/Base'
import InstallProgress from './progress.vue'

const emit = defineEmits(['submitSuccess'])
const { t } = useI18n({ useScope: 'global' })

// ─── 输入字段 ──────────────────────────────────────────────

const smartInput = ref('')
const repoUrl = ref('')
const skillPath = ref('')
const level = ref('global')
const projectPath = ref('')
const selectedProxyId = ref('')
const selectedTokenId = ref('')
const installing = ref(false)

// ─── 下拉列表 ──────────────────────────────────────────────

const proxyList = ref([])
const tokenList = ref([])

// ─── 进度浮层 ──────────────────────────────────────────────

const progressRef = ref(null)

// ─── 提交按钮启用条件 ──────────────────────────────────────

const canSubmit = computed(function () {
  return repoUrl.value.trim() !== '' && !installing.value
})

// ─── 智能识别 ──────────────────────────────────────────────

function parseSmartInput() {
  var text = smartInput.value.trim()
  if (!text) return

  // 匹配 npx skills add <url> --skill <path> 格式
  var match = text.match(/npx\s+skills\s+add\s+(\S+)(?:\s+--skill\s+(\S+))?/)
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

function onSmartInput() {
  // 无需重置状态，输入框始终可见
}

// ─── 级别切换 ──────────────────────────────────────────────

function onLevelChange() {
  if (level.value === 'global') {
    projectPath.value = ''
  }
}

// ─── 弹窗生命周期 ──────────────────────────────────────────

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function () {
    resetForm()
    getProxyList().then(function (data) {
      proxyList.value = data || []
      // 自动选中默认代理
      var def = (data || []).find(function (p) { return p.default })
      if (def) selectedProxyId.value = def.id
    }).catch(function () {
      proxyList.value = []
    })
    getTokenList().then(function (data) {
      tokenList.value = data || []
      // 自动选中默认 Token
      var def = (data || []).find(function (t) { return t.default })
      if (def) selectedTokenId.value = def.id
    }).catch(function () {
      tokenList.value = []
    })
    // 从后端获取当前项目目录作为默认值
    getCurrentProjectDir().then(function (res) {
      if (res && res.data) projectPath.value = res.data
    }).catch(function () { /* ignore */ })
  }
})

function resetForm() {
  smartInput.value = ''
  repoUrl.value = ''
  skillPath.value = ''
  level.value = 'global'
  projectPath.value = ''
  selectedProxyId.value = ''
  selectedTokenId.value = ''
  installing.value = false
}

// ─── 提交 ──────────────────────────────────────────────────

function onSubmit() {
  installing.value = true

  // 构建 SSE URL 参数
  var params = new URLSearchParams({
    repoUrl: repoUrl.value.trim(),
    skillPath: skillPath.value.trim() || '',
    level: level.value,
  })
  if (selectedProxyId.value) {
    params.append('proxyId', selectedProxyId.value)
  }
  if (selectedTokenId.value) {
    params.append('tokenId', selectedTokenId.value)
  }
  if (level.value === 'project' && projectPath.value.trim()) {
    params.append('projectPath', projectPath.value.trim())
  }

  var url = '/api/skill/install-github-stream?' + params.toString()

  // 打开进度浮层
  if (progressRef.value) {
    progressRef.value.start(url)
  }
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
.mode-tip {
  margin-bottom: 12px;
}
.install-form {
  margin-top: 12px;
}
.smart-paste {
  margin-bottom: 8px;
}
</style>
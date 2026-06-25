<!--
  install.vue — Skill 安装弹窗（仅 GitHub 仓库安装）
  代理和 Token 从管理页面配置的下拉列表中选择（按别名）
  使用 SSE 实时显示安装进度
-->
<template>
  <el-dialog v-model="isShow" :title="$t('skill.install')" width="560px" :close-on-click-modal="false" @close="resetForm">

    <!-- 安装提示 -->
    <el-alert :title="modeTipTitle" :description="modeTipDesc" type="info" show-icon :closable="false" class="mode-tip" />

    <el-form label-position="top" class="install-form">
      <el-form-item :label="$t('skill.repoUrl')">
        <el-input v-model="repoUrl" placeholder="https://github.com/anthropics/skills" />
      </el-form-item>
      <el-form-item :label="$t('skill.skillPath')">
        <el-input v-model="skillPath" placeholder="如 frontend-design（可选）" />
      </el-form-item>

      <el-divider />

      <!-- 安装级别 -->
      <el-form-item :label="$t('skill.level')">
        <el-radio-group v-model="level">
          <el-radio value="global">{{ $t('skill.global') }}</el-radio>
          <el-radio value="project">{{ $t('skill.project') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 代理选择下拉 -->
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

      <!-- Token 选择下拉 -->
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
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :disabled="!canSubmit" :loading="installing" @click="onSubmit">
        {{ installing ? installingText : $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getProxyList } from '@/api/proxy'
import { getTokenList } from '@/api/token'
import { compositionDialogBase } from '@/composition/dialog/Base'

const emit = defineEmits(['submitSuccess'])
const { t } = useI18n({ useScope: 'global' })

// ─── 输入字段 ──────────────────────────────────────────────

const repoUrl = ref('')
const skillPath = ref('')
const level = ref('global')
const selectedProxyId = ref('')
const selectedTokenId = ref('')
const installing = ref(false)

// ─── 下拉列表 ──────────────────────────────────────────────

const proxyList = ref([])
const tokenList = ref([])

// ─── 提示信息 ──────────────────────────────────────────────

const modeTipTitle = '从 GitHub 仓库安装 Skill'
const modeTipDesc = '输入包含 SKILL.md 的 GitHub 仓库地址。如果仓库内含多个 Skill，请在「Skill 路径」指定子目录。可通过「代理管理」和「Token 管理」页面配置代理与 GitHub Token，安装时从下拉列表选择即可。'

// ─── 安装文案 ──────────────────────────────────────────────

const installingText = ref('安装中…')

// ─── 提交按钮启用条件 ──────────────────────────────────────

const canSubmit = computed(function () {
  return repoUrl.value.trim() !== '' && !installing.value
})

// ─── 弹窗生命周期 ──────────────────────────────────────────

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun: function () {
    resetForm()
    getProxyList().then(function (data) {
      proxyList.value = data || []
    }).catch(function () {
      proxyList.value = []
    })
    getTokenList().then(function (data) {
      tokenList.value = data || []
    }).catch(function () {
      tokenList.value = []
    })
  }
})

function resetForm() {
  repoUrl.value = ''
  skillPath.value = ''
  level.value = 'global'
  selectedProxyId.value = ''
  selectedTokenId.value = ''
  installing.value = false
  installingText.value = '安装中…'
}

// ─── 提交（SSE 流式安装）──────────────────────────────────

function onSubmit() {
  installing.value = true
  installingText.value = '连接 GitHub…'

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

  var es = new EventSource('/api/skill/install-github-stream?' + params.toString())

  es.addEventListener('progress', function (e) {
    var data
    try { data = JSON.parse(e.data) } catch (_) { return }
    if (data.message) {
      installingText.value = data.message
    }
  })

  es.addEventListener('complete', function () {
    es.close()
    ElMessage.success('安装完成')
    hideDialog()
    emit('submitSuccess')
    installing.value = false
  })

  es.addEventListener('error', function (e) {
    es.close()
    installing.value = false
    if (e.data) {
      try {
        var data = JSON.parse(e.data)
        ElMessage.error(data.message || '安装失败')
      } catch (_) {
        ElMessage.error('安装失败')
      }
    } else {
      ElMessage.error('连接中断')
    }
  })
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
</style>
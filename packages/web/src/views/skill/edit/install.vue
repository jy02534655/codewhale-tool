<!--
  install.vue — Skill 安装弹窗（左右布局）
  左侧：三种安装方式切换（GitHub 仓库 / 上传 ZIP / GitHub Tree 路径）
  右侧：安装级别 + 项目目录 + 代理 + Token
  确认后弹出现有的 InstallProgress 组件（progress.vue）展示 SSE 进度
-->
<template>
  <el-dialog v-model="isShow" :title="$t('common.install')" width="800px" top="8vh" :close-on-click-modal="false" @close="onDialogClose">
    <!-- el-form 包裹左右两侧，统一管理校验规则 -->
    <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
      <div class="install-layout">
        <!-- 左侧：安装方式 -->
        <div class="install-left">
          <el-tabs v-model="formData.installMode" class="install-mode-tabs">
            <el-tab-pane name="github" :label="$t('skill.installMode.github')" />
            <el-tab-pane name="zip" :label="$t('skill.installMode.zip')" />
            <el-tab-pane name="githubPath" :label="$t('skill.installMode.githubPath')" />
          </el-tabs>

          <!-- GitHub 仓库安装 -->
          <div v-if="formData.installMode === 'github'" class="install-config">
            <el-form-item :label="$t('skill.repoUrl')" prop="repoUrl">
              <el-input v-model="formData.repoUrl" :placeholder="$t('skill.repoUrlPlaceholder')" />
            </el-form-item>
            <el-form-item :label="$t('skill.skillPath')" prop="skillPath">
              <el-input v-model="formData.skillPath" :placeholder="$t('skill.skillPathPlaceholder')" />
            </el-form-item>
            <!-- 智能识别 -->
            <el-alert :title="$t('skill.quickPasteTitle')" :description="$t('skill.quickPasteDesc')" type="info" show-icon :closable="false" class="mode-tip" />
            <el-form-item>
              <el-input v-model="formData.smartInput" :placeholder="$t('skill.smartInputPlaceholder')" size="small">
                <template #append>
                  <el-button :disabled="!formData.smartInput.trim()" @click="parseSmartInput">{{ $t('skill.parse') }}</el-button>
                </template>
              </el-input>
            </el-form-item>
          </div>

          <!-- 上传 ZIP 安装 -->
          <div v-if="formData.installMode === 'zip'" class="install-config">
            <el-form-item :label="$t('skill.zipFile')" prop="selectedFilePath">
              <FilePicker
                v-model="formData.selectedFilePath"
                mode="file"
                accept=".zip"
                :placeholder="$t('skill.chooseFile')"
                @select="onSelectZipFile"
              />
            </el-form-item>
            <el-form-item :label="$t('skill.name')" prop="zipSkillName">
              <el-input v-model="formData.zipSkillName" :placeholder="$t('skill.skillId')" />
            </el-form-item>
          </div>

          <!-- GitHub Tree 路径安装 -->
          <div v-if="formData.installMode === 'githubPath'" class="install-config">
            <el-form-item :label="$t('skill.githubPathUrl')" prop="githubTreeUrl">
              <el-input v-model="formData.githubTreeUrl" :placeholder="$t('skill.githubPathPlaceholder')" />
            </el-form-item>
          </div>
        </div>

        <!-- 右侧：安装级别 + 代理/Token -->
        <div class="install-right">
          <el-form-item :label="$t('skill.level')" prop="level">
            <el-radio-group v-model="formData.level" @change="onLevelChange">
              <el-radio value="global">{{ $t('skill.global') }}</el-radio>
              <el-radio value="project">{{ $t('skill.project') }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="formData.level === 'project'" :label="$t('skill.projectPath')" prop="projectPath">
            <el-select v-model="formData.projectId" :placeholder="$t('skill.projectPathPlaceholder')" clearable style="width:100%" @change="onProjectChange">
              <el-option v-for="p in projectList" :key="p.id || p.path" :label="p.alias || p.path" :value="p.id" />
            </el-select>
            <div v-if="!projectList.length" class="project-hint">{{ $t('skill.noProjects') }}</div>
          </el-form-item>

          <el-form-item :label="$t('skill.sortOrder')" prop="sortOrder">
            <el-input-number
              v-model="formData.sortOrder"
              :min="0"
              :max="99999"
              :step="1"
              size="small"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item :label="$t('skill.proxy_select')" prop="selectedProxyId">
            <el-select v-model="formData.selectedProxyId" :placeholder="$t('skill.proxy_select_placeholder')" clearable style="width:100%">
              <el-option v-for="p in proxyList" :key="p.id" :label="p.alias + ' (' + p.type + '://' + p.host + ':' + p.port + ')'" :value="p.id" />
            </el-select>
          </el-form-item>

          <el-form-item :label="$t('skill.token_select')" prop="selectedTokenId">
            <el-select v-model="formData.selectedTokenId" :placeholder="$t('skill.token_select_placeholder')" clearable style="width:100%">
              <el-option v-for="t in tokenList" :key="t.id" :label="t.alias + ' (' + t.token + ')'" :value="t.id" />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button :disabled="maskingStore.isLoading" @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>

  <!-- 安装进度浮层 -->
  <InstallProgress ref="progressRef" @complete="onInstallComplete" />
</template>

<script setup>
// 引入 Vue 响应式 API
import { reactive, ref } from 'vue'
// 引入 Element Plus 消息组件
import { ElMessage } from 'element-plus'
// 引入 i18n 国际化函数
import { useI18n } from 'vue-i18n'
// 引入后端 API 方法
import { useShareStore } from '@/stores/share'
import { installSkill, updateSkillByOpts } from '@/api/skill/install'
import { getGlobalSkillList, getAllProjectSkillList } from '@/api/skill/routes'
// 引入弹窗表单组合式函数
import { compositionDialogForm } from '@/composition/dialog/Form'

// 引入全局遮罩状态管理
import { useMaskingStore } from '@/stores/masking'
// 引入自定义组件
import FilePicker from '@/components/form/file/picker.vue'
import InstallProgress from './progress.vue'

// 定义组件事件
const emit = defineEmits(['submitSuccess'])
// 获取国际化函数
const { t } = useI18n({ useScope: 'global' })

const maskingStore = useMaskingStore()
const shareStore = useShareStore()

// ─── 表单数据（集中管理所有字段）─────────────────────────────
// 使用 reactive 统一管理表单数据，通过 v-if 控制显示隐藏避免多余校验
const formData = reactive({
  installMode: 'github',
  repoUrl: '',
  skillPath: '',
  smartInput: '',
  selectedFilePath: '',
  zipSkillName: '',
  githubTreeUrl: '',
  sortOrder: 0,
  level: 'global',
  projectId: '',
  projectPath: '',
  selectedProxyId: '',
  selectedTokenId: '',
})

// ─── 表单校验规则 ──────────────────────────────────────────
// el-form 包裹整个弹窗，左侧/右侧所有带 prop 的 el-form-item 统一校验
// 被 v-if 隐藏的表单项不会出现在 DOM 中，因此不会触发校验
const rules = {
  repoUrl: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  selectedFilePath: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  zipSkillName: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  githubTreeUrl: [{ required: true, message: () => t('common.required'), trigger: 'blur' }],
  level: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
  projectPath: [{ required: true, message: () => t('common.required'), trigger: 'change' }],
}

// 新增模式下自动计算排序值：取当前列表最大 sort_order + 1
const _initSortOrder = () => {
  Promise.all([getGlobalSkillList(), getAllProjectSkillList()]).then((results) => {
    const all = (results[0] || []).concat(results[1] || [])
    const maxSort = all.reduce((max, s) => {
      const v = typeof s.sort_order === 'number' ? s.sort_order : 0
      return v > max ? v : max
    }, 0)
    formData.sortOrder = maxSort + 1
  }).catch(() => {
    formData.sortOrder = 1
  })
}

// ─── 弹窗生命周期（compositionDialogForm）───────────────────
// 使用 compositionDialogForm 统一管理弹窗显示、隐藏、重置和提交
const { isShow, showDialog, hideDialog, showDialogByData, submitForm, resetForm } = compositionDialogForm({
  addFun: installSkill,
  editFun: updateSkillByOpts,
  initfun: (ctx) => {
    // ctx: { data, state }
    if (ctx && ctx.state === 1) {
      isUpdateMode.value = true
      updateSkillId.value = (ctx.data && ctx.data.skillId) ? ctx.data.skillId : null
      const params = (ctx.data && ctx.data.installParams) ? ctx.data.installParams : null
      if (params) {
        formData.installMode = params.installMode || formData.installMode
        formData.repoUrl = params.repoUrl || ''
        formData.skillPath = params.skillPath || ''
        formData.smartInput = params.smartInput || ''
        formData.selectedFilePath = params.selectedFilePath || ''
        formData.zipSkillName = params.zipSkillName || ''
        formData.githubTreeUrl = params.githubTreeUrl || ''
        formData.level = params.level || formData.level
        formData.projectId = params.projectId || ''
        formData.projectPath = params.projectPath || ''
        formData.selectedProxyId = params.selectedProxyId || ''
        formData.selectedTokenId= [redacted]
        if (ctx.data && typeof ctx.data.sortOrder === 'number') {
          formData.sortOrder = ctx.data.sortOrder
        }
        formData.selectedTokenId = params.selectedTokenId || ''
      } else {
        resetForm()
        // 回填 skill 当前级别与项目，防止更新时因 resetForm 丢失 project 信息
        if (ctx.data && ctx.data.level) {
          formData.level = ctx.data.level
        }
        if (ctx.data && ctx.data.projectId) {
          formData.projectId = ctx.data.projectId
          if (formData.level === 'project') {
            const project = projectList.value.find((p) => { return p.id === ctx.data.projectId })
            if (project) formData.projectPath = project.path
          }
        }
        if (ctx.data && typeof ctx.data.sortOrder === 'number') {
          formData.sortOrder = ctx.data.sortOrder
        }
      }
    } else {
      isUpdateMode.value = false
      updateSkillId.value = null
      resetForm()
      // 新增模式默认排序值
      formData.sortOrder = 0
      _initSortOrder()
    }
    _initDropdowns()
  },
  // 新增模式下自动计算排序值：取当前列表最大 sort_order + 1
  _initSortOrder: () => {
    Promise.all([getGlobalSkillList(), getAllProjectSkillList()]).then((results) => {
      const all = (results[0] || []).concat(results[1] || [])
      const maxSort = all.reduce((max, s) => {
        const v = typeof s.sort_order === 'number' ? s.sort_order : 0
        return v > max ? v : max
      }, 0)
      formData.sortOrder = maxSort + 1
    }).catch(() => {
      formData.sortOrder = 1
    })
  },
})

// ─── 下拉列表数据 ──────────────────────────────────────────
const proxyList = ref([])
const tokenList = ref([])
// 项目下拉列表数据
const projectList = ref([])

// ─── 安装进度浮层引用 ──────────────────────────────────────
const progressRef = ref(null)

// ─── 更新模式标记 ──────────────────────────────────────────
const isUpdateMode = ref(false)
const updateSkillId = ref(null)

// ─── 初始化下拉列表数据 ───────────────────────────────────
const _initDropdowns = () => {
  shareStore.getProxyList().then((result) => {
    proxyList.value = result.data || []
    const def = (result.data || []).find((p) => { return p.default })
    if (def) formData.selectedProxyId = def.id
  }).catch(() => {
    proxyList.value = []
  })
  shareStore.getTokenList().then((result) => {
    tokenList.value = result.data || []
    const def = (result.data || []).find((t) => { return t.default })
    if (def) formData.selectedTokenId = def.id
  }).catch(() => {
    tokenList.value = []
  })
  shareStore.getProjectList().then((result) => {
    projectList.value = result.data || []
    const defaultProject = (result.data || []).find((p) => { return p.default })
    if (formData.level === 'project') {
      if (formData.projectId) {
        const project = (result.data || []).find((p) => { return p.id === formData.projectId })
        if (project) formData.projectPath = project.path
      } else if (defaultProject) {
        formData.projectId = defaultProject.id
        formData.projectPath = defaultProject.path
      }
    }
  }).catch(() => {
    projectList.value = []
  })
}

// ─── 智能识别输入 ──────────────────────────────────────────
const parseSmartInput = () => {
  const text = formData.smartInput.trim()
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
    formData.repoUrl = match[1]
  } else {
    formData.repoUrl = match[1]
    if (match[2]) {
      formData.skillPath = match[2]
    }
  }
}

// ─── ZIP 文件选择后自动填充 skill 名称 ────────────────────────
const onSelectZipFile = (filePath) => {
  if (!filePath) return
  const base = filePath.replace(/\\/g, '/').split('/').pop() || ''
  const name = base.replace(/\.zip$/i, '')
  if (name) {
    formData.zipSkillName = name
  }
}

// ─── 安装级别切换 ──────────────────────────────────────────
const onLevelChange = () => {
  if (formData.level === 'project') {
    // 切换到项目级时若未选择项目，自动选默认项目
    if (projectList.value.length > 0 && !formData.projectId) {
      const defaultProject = projectList.value.find((p) => { return p.default }) || projectList.value[0]
      formData.projectId = defaultProject.id || ''
      formData.projectPath = defaultProject.path || ''
    }
    if (projectList.value.length > 0 && !formData.projectPath) {
      formData.projectId = projectList.value[0].id
      formData.projectPath = projectList.value[0].path
    }
  } else {
    formData.projectId = ''
    formData.projectPath = ''
  }
}

// ─── 项目选择变更 ──────────────────────────────────────────
// 监听 el-select 选择事件，同步更新 projectPath
const onProjectChange = (selectedId) => {
  if (selectedId) {
    const project = projectList.value.find((p) => { return p.id === selectedId })
    if (project) {
      formData.projectPath = project.path
      return
    }
  }
  formData.projectPath = ''
}

// ─── 提交表单 ──────────────────────────────────────────────
const onSubmit = () => {
  maskingStore.loading({ view: 'skill-install' })
  // 确保排序值为数字
  formData.sortOrder = typeof formData.sortOrder === 'number' ? formData.sortOrder : 0
  const payload = isUpdateMode.value
    ? { ...formData, skillId: updateSkillId.value }
    : formData
  submitForm(payload).then((res) => {
    // 提交成功后启动安装进度浮层
    if (res && res.streamId && progressRef.value) {
      // SSE 阶段延续 loading 状态（axios 拦截器会在接口完成后自动释放，
      // 此处手动补一个 loading 计数，确保进度浮层期间按钮仍处于加载态）
      progressRef.value.start('/api/skill/install/sse/' + res.streamId)
    }
  }).catch(() => {
    // axios 拦截器已自动处理接口失败时的遮罩释放
  })
}

// ─── 安装完成回调 ──────────────────────────────────────────
const onInstallComplete = (success) => {
  maskingStore.clear({ view: 'skill-install' })
  hideDialog()
  if (success) {
    emit('submitSuccess')
  }
}

// 暴露弹窗控制方法给父组件
// ─── 弹窗关闭回调 ──────────────────────────────────────────
const onDialogClose = () => {
  isUpdateMode.value = false
  updateSkillId.value = null
  formData.sortOrder = 0
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
  width: 420px;
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-light, #e4e7ed);
  padding-left: 20px;
}
.install-mode-tabs {
  margin-bottom: 16px;
}
.install-config {
  padding: 4px 0;
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
.install-right .el-form-item {
  margin-bottom: 16px;
}
.project-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>

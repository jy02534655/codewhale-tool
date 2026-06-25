<!--
  index.vue — Skill 管理页面
  工具栏含安装日志查看/清除
  左侧列表简化：名称+状态 | 别名+来源标签 | 标签
--><template>
  <div class="skill-view" v-loading="maskingStore.isLoading">

    <!-- 工具栏 -->
    <div class="toolbar">
      <h2>{{ $t('skill.title') }}</h2>
      <div class="toolbar-actions">
        <el-button size="small" type="primary"
          @click="dialogCtrl.showAddDialog(null, 'installDialog')">{{ $t('skill.install') }}</el-button>
        <el-button size="small" text @click="doViewLog">{{ $t('skill.viewLog') || '查看日志' }}</el-button>
        <el-button size="small" text type="danger" @click="doClearLog">{{ $t('skill.clearLog') || '清除日志' }}</el-button>
        <el-button size="small" @click="loadSkills">{{ $t('skill.refresh') }}</el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="search" :placeholder="$t('skill.searchPlaceholder')" clearable size="small" />
    </div>

    <!-- 主从布局 -->
    <div class="master-detail">

      <!-- 左面板 — 简化列表：名称 | 别名+来源 | 标签 -->
      <div class="master-panel">
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <el-tab-pane :label="$t('skill.global')" name="global" />
          <el-tab-pane :label="$t('skill.project')" name="project" />
        </el-tabs>
        <div class="master-list">

          <!-- 全局 Tab -->
          <template v-if="activeTab === 'global'">
            <div v-for="s in filteredGlobal" :key="s.id"
              :class="['master-item', { active: selectedId === s.id }]"
              @click="selectSkill(s)">
              <!-- 第1行：名称 + 状态 + 来源标签（右上） -->
              <div class="master-item-row">
                <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                  {{ s.enabled ? '开' : '关' }}
                </el-tag>
                <span class="master-item-name">{{ displayName(s) }}</span>
                <span class="master-item-source"><el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag></span>
              </div>
              <!-- 第2行：原名（name） -->
              <div v-if="s.name && s.name !== (s.alias || s.id)" class="master-item-field">
                <span class="field-value-text">{{ s.name }}</span>
              </div>
              <!-- 第3行：备注 -->
              <div v-if="s.remark" class="master-item-field">
                <span class="field-value-text remark-text">{{ s.remark }}</span>
              </div>
              <!-- 第4行：标签 -->
              <div v-if="s.tags && s.tags.length" class="master-item-field">
                <el-tag v-for="tag in s.tags" :key="tag" size="small" type="info" effect="plain" class="tag-item">{{ tag }}</el-tag>
              </div>
            </div>
            <el-empty v-if="filteredGlobal.length === 0"
              :description="search ? $t('skill.noMatch') : $t('skill.noSkill')" />
          </template>

          <!-- 项目 Tab：树形展开 -->
          <template v-if="activeTab === 'project'">
            <el-empty v-if="projectTree.length === 0" :description="$t('skill.noProject')" />
            <template v-for="node in filteredProjectTree" :key="node.name">
              <div class="project-group-header">
                <el-tag size="small" type="warning" effect="dark">P</el-tag>
                <span class="project-group-name">{{ node.alias || node.name }}</span>
                <span v-if="node.alias && node.alias !== node.name" class="sub-original">{{ node.name }}</span>
              </div>
              <div v-for="s in node.skills" :key="s.id"
                :class="['master-item', 'project-skill-item', { active: selectedId === s.id }]"
                @click="selectSkill(s)">
                <!-- 第1行：名称 + 状态 + 来源标签（右上） -->
                <div class="master-item-row">
                  <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                    {{ s.enabled ? '开' : '关' }}
                  </el-tag>
                  <span class="master-item-name">{{ displayName(s) }}</span>
                  <span class="master-item-source"><el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag></span>
                </div>
                <!-- 第2行：原名（name） -->
                <div v-if="s.name && s.name !== (s.alias || s.id)" class="master-item-field">
                  <span class="field-value-text">{{ s.name }}</span>
                </div>
                <!-- 第3行：备注 -->
                <div v-if="s.remark" class="master-item-field">
                  <span class="field-value-text remark-text">{{ s.remark }}</span>
                </div>
                <!-- 第4行：标签 -->
                <div v-if="s.tags && s.tags.length" class="master-item-field">
                  <el-tag v-for="tag in s.tags" :key="tag" size="small" type="info" effect="plain" class="tag-item">{{ tag }}</el-tag>
                </div>
              </div>
            </template>
          </template>

        </div>
      </div>

      <!-- 右面板 -->
      <div class="detail-wrapper">
        <detail :skill="selectedSkill"
          @refresh="loadSkills"
          @openEdit="onOpenEdit"
          @openReadme="onOpenReadme" />
      </div>

    </div>

    <!-- 安装日志查看弹窗 -->
    <el-dialog v-model="logVisible" :title="$t('skill.installLog')" width="720px" top="5vh" :destroy-on-close="true">
      <pre class="log-content-dialog">{{ logContent || $t('skill.noLog') }}</pre>
      <template #footer>
        <el-button @click="logVisible = false">{{ $t('common.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗组件 -->
    <install ref="installDialog" @submitSuccess="loadSkills" />
    <info ref="infoDialog" @submitSuccess="loadSkills" />
    <readme ref="readmeDialog" @submitSuccess="loadSkills" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { getGlobalSkillList, getProjectSkillList, getInstallLog, clearInstallLog } from '@/api/skill'
import { useMaskingStore } from '@/stores/masking'
import { compositionDialogContainer } from '@/composition/dialog/Container'
import install from './edit/install.vue'
import detail from './edit/detail.vue'
import info from './edit/info.vue'
import readme from './edit/readme.vue'

const { t } = useI18n({ useScope: 'global' })
const maskingStore = useMaskingStore()

/** 弹窗容器 */
const dialogCtrl = compositionDialogContainer()

/** 响应式数据 */
const globalSkills = ref([])
const projectSkills = ref([])
const search = ref('')
const activeTab = ref('global')
const selectedId = ref(null)
const logVisible = ref(false)
const logContent = ref('')

/** 显示名称：别名优先 */
function displayName(s) {
  return s.alias || s.name || s.id
}

/** 来源本地化文本 */
function sourceName(source) {
  var key = 'skill.source.' + (source || 'local')
  return t(key) || source
}

/** 选中 skill */
function selectSkill(s) {
  selectedId.value = s.id
}

/** Tab 切换时重置选中 */
function onTabChange() {
  selectedId.value = null
}

/** 当前选中技能对象 */
const selectedSkill = computed(function () {
  if (!selectedId.value) return null
  var all = globalSkills.value.concat(projectSkills.value)
  return all.find(function (s) { return s.id === selectedId.value }) || null
})

/** 全局 skill 列表过滤 */
const filteredGlobal = computed(function () {
  var q = search.value.toLowerCase().trim()
  if (!q) return globalSkills.value
  return globalSkills.value.filter(function (s) {
    var name = (s.alias || s.name || s.id).toLowerCase()
    var tags = (s.tags || []).join(' ').toLowerCase()
    return name.indexOf(q) !== -1 || tags.indexOf(q) !== -1
  })
})

/** 项目树：按项目名分组 */
const projectTree = computed(function () {
  var map = {}
  projectSkills.value.forEach(function (s) {
    var pn = s.path && s.path.indexOf('.codewhale') !== -1 ? 'codewhale-tool' : 'unknown'
    if (!map[pn]) map[pn] = { name: pn, alias: pn, skills: [] }
    map[pn].skills.push(s)
  })
  return Object.values(map)
})

/** 项目树过滤 */
const filteredProjectTree = computed(function () {
  var q = search.value.toLowerCase().trim()
  if (!q) return projectTree.value
  return projectTree.value
    .map(function (node) {
      return {
        name: node.name,
        alias: node.alias,
        skills: node.skills.filter(function (s) {
          var name = (s.alias || s.name || s.id).toLowerCase()
          var tags = (s.tags || []).join(' ').toLowerCase()
          return name.indexOf(q) !== -1 || tags.indexOf(q) !== -1
        })
      }
    })
    .filter(function (node) { return node.skills.length > 0 })
})

/** 加载全局 + 项目 skill 列表 */
function loadSkills() {
  Promise.all([getGlobalSkillList(), getProjectSkillList()])
    .then(function (results) {
      globalSkills.value = results[0] || []
      projectSkills.value = (results[1] || []).map(function (s) { s.level = 'project'; return s })
      if (selectedId.value) {
        var all = globalSkills.value.concat(projectSkills.value)
        if (!all.find(function (s) { return s.id === selectedId.value })) {
          selectedId.value = null
        }
      }
    })
}

/** 打开编辑信息弹窗 */
function onOpenEdit() {
  if (selectedSkill.value) {
    dialogCtrl.showEditDialog(selectedSkill.value, 'infoDialog')
  }
}

/** 打开 SKILL.md 编辑弹窗 */
function onOpenReadme() {
  if (selectedSkill.value) {
    dialogCtrl.showEditDialog(selectedSkill.value, 'readmeDialog')
  }
}

// ─── 日志查看 / 清除 ──────────────────────────────────────

function doViewLog() {
  getInstallLog().then(function (res) {
    logContent.value = (res && res.data) ? res.data : ''
    logVisible.value = true
  })
}

function doClearLog() {
  ElMessageBox.confirm('确认清除所有安装日志？', '提示', {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(function () {
    return clearInstallLog()
  }).then(function () {
    logContent.value = ''
  })
}

onMounted(loadSkills)
</script>

<style scoped>
.skill-view { display: flex; flex-direction: column; height: 100%; gap: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 18px; margin: 0; }
.toolbar-actions { display: flex; gap: 6px; align-items: center; }
.search-bar { display: flex; gap: 8px; }
.search-bar :deep(.el-input) { flex: 1; }
.master-detail { display: flex; gap: 16px; flex: 1; min-height: 0; }
.master-panel { width: 320px; min-width: 260px; display: flex; flex-direction: column; border-right: 1px solid var(--border); padding-right: 12px; flex-shrink: 0; }
.master-panel :deep(.el-tabs__item) { padding: 0 8px; font-size: 13px; }
.master-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.master-item { position: relative; padding: 6px 10px; border-radius: 4px; cursor: pointer; border-left: 3px solid transparent; }
.master-item:hover { background: var(--bg-secondary, #f5f5f5); }
.master-item.active { background: var(--el-color-primary-light-9); border-left-color: var(--el-color-primary); }
.project-skill-item { padding-left: 24px; }
.master-item-row { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; padding-right: 60px; }
.master-item-name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.master-item-field { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); margin-top: 2px; margin-left: 26px; flex-wrap: wrap; }
.master-item-source { position: absolute; top: 6px; right: 10px; }
.field-value-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tag-item { margin-left: 2px; }
.project-group-header { display: flex; align-items: center; gap: 6px; padding: 8px 4px 4px; font-weight: 600; font-size: 13px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
.project-group-name { font-weight: 500; }
.sub-original { color: var(--text-secondary); font-size: 11px; }
.detail-wrapper { flex: 1; min-width: 0; overflow-y: auto; contain: layout style; }
.log-content-dialog { max-height: 400px; overflow: auto; background: #1e1e1e; color: #d4d4d4; font-family: monospace; font-size: 12px; padding: 12px; border-radius: 4px; white-space: pre-wrap; margin: 0; }
</style>
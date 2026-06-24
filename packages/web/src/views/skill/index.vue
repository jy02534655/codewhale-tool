<!--
  index.vue — Skill 管理页面（skill 模块入口）
  compositionDialogContainer 管理弹窗
  使用 .then() 链，没有 await/try-catch
-->
<template>
  <div class="skill-view" v-loading="maskingStore.isLoading">

    <!-- 工具栏 -->
    <div class="toolbar">
      <h2>{{ $t('skill.title') }}</h2>
      <div class="toolbar-actions">
        <el-button size="small" type="primary"
          @click="dialogCtrl.showAddDialog(null, 'installDialog')">{{ $t('skill.install') }}</el-button>
        <el-button size="small" @click="loadSkills">{{ $t('skill.refresh') }}</el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="search" :placeholder="$t('skill.searchPlaceholder')" clearable size="small" />
    </div>

    <!-- 主从布局 -->
    <div class="master-detail">

      <!-- 左面板 -->
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
              <div class="master-item-title">
                <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                  {{ s.enabled ? '开' : '关' }}
                </el-tag>
                <span class="master-item-name">{{ displayName(s) }}</span>
              </div>
              <div class="master-item-sub">
                <span class="sub-original">{{ s.name || s.id }}</span>
                <el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag>
                <span v-if="s.remark" class="sub-remark">· {{ truncate(s.remark, 20) }}</span>
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
                <div class="master-item-title">
                  <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                    {{ s.enabled ? '开' : '关' }}
                  </el-tag>
                  <span class="master-item-name">{{ displayName(s) }}</span>
                </div>
                <div class="master-item-sub">
                  <span class="sub-original">{{ s.name || s.id }}</span>
                  <el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag>
                  <span v-if="s.remark" class="sub-remark">· {{ truncate(s.remark, 20) }}</span>
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

    <!-- 弹窗组件 -->
    <install ref="installDialog" @submitSuccess="loadSkills" />
    <info ref="infoDialog" @submitSuccess="loadSkills" />
    <readme ref="readmeDialog" @submitSuccess="loadSkills" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { getGlobalSkillList, getProjectSkillList } from '@/api/skill'
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

/** 显示名称：别名优先 */
function displayName(s) {
  return s.alias || s.name || s.id
}

/** 来源本地化文本 */
function sourceName(source) {
  var key = 'skill.source.' + (source || 'local')
  return t(key) || source
}

/** 字符串截断 */
function truncate(str, max) {
  return str && str.length > max ? str.slice(0, max) + '…' : str
}

/** 选中 skill */
function selectSkill(s) {
  selectedId.value = s.id
}

/** Tab 切换时重置选中 */
function onTabChange() {
  selectedId.value = null
}

/** 当前选中技能对象（全局 + 项目合并搜索） */
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
    var remark = (s.remark || '').toLowerCase()
    var tags = (s.tags || []).join(' ').toLowerCase()
    return name.indexOf(q) !== -1 || remark.indexOf(q) !== -1 || tags.indexOf(q) !== -1
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
          var remark = (s.remark || '').toLowerCase()
          var tags = (s.tags || []).join(' ').toLowerCase()
          return name.indexOf(q) !== -1 || remark.indexOf(q) !== -1 || tags.indexOf(q) !== -1
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

onMounted(loadSkills)
</script>

<style scoped>
.skill-view { display: flex; flex-direction: column; height: 100%; gap: 8px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 18px; margin: 0; }
.toolbar-actions { display: flex; gap: 6px; }
.search-bar { display: flex; gap: 8px; }
.search-bar :deep(.el-input) { flex: 1; }
/* 主从布局 */
.master-detail { display: flex; gap: 16px; flex: 1; min-height: 0; }
.master-panel { width: 280px; min-width: 220px; display: flex; flex-direction: column; border-right: 1px solid var(--border); padding-right: 12px; }
.master-panel :deep(.el-tabs__item) { padding: 0 8px; font-size: 13px; }
.master-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
/* 列表项 */
.master-item { padding: 6px 10px; border-radius: 4px; cursor: pointer; border-left: 3px solid transparent; transition: background 0.15s; }
.master-item:hover { background: var(--bg-secondary, #f5f5f5); }
.master-item.active { background: var(--el-color-primary-light-9); border-left-color: var(--el-color-primary); }
.project-skill-item { padding-left: 24px; }
.master-item-title { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.master-item-name { font-weight: 500; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.master-item-sub { font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin-left: 28px; }
.sub-original { color: var(--text-secondary); }
.sub-remark { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 项目分组头 */
.project-group-header { display: flex; align-items: center; gap: 6px; padding: 8px 4px 4px; font-weight: 600; font-size: 13px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
.project-group-name { font-weight: 500; }
/* 右面板容器 */
.detail-wrapper { flex: 1; min-width: 0; overflow-y: auto; }
</style>
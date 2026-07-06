<!--
  index.vue — Skill 管理页面（重构）
  使用 SplitLayout 统一分栏，保持全局/项目 Tab 切换
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <SplitLayout leftWidth="385px">
      <template #left>
        <div class="panel-left">
          <!-- 顶部操作栏 -->
          <div class="left-toolbar">
            <el-button size="small" type="primary"
              @click="dialogCtrl.showAddDialog(null, 'installDialog')">
              <el-icon><Plus /></el-icon>
              {{ $t('common.install') }}</el-button>
            <el-button size="small" plain @click="doViewLog">
              <el-icon><List /></el-icon>
              {{ $t('skill.viewLog') }}
            </el-button>
            <el-button size="small" plain type="danger" @click="doClearLog">
              <el-icon><Delete /></el-icon>
              {{ $t('skill.clearLog') }}
            </el-button>
          </div>

          <!-- Tab 切换 -->
          <el-tabs v-model="activeTab" @tab-change="onTabChange">
            <el-tab-pane :label="$t('skill.global')" name="global" />
            <el-tab-pane :label="$t('skill.project')" name="project" />
          </el-tabs>

          <!-- 搜索栏 -->
          <el-input
            v-model="search"
            :placeholder="$t('skill.searchPlaceholder')"
            clearable
            size="small"
            prefix-icon="Search"
          />

          <!-- 列表 -->
          <div class="list-scroll">
            <!-- 全局 Tab -->
            <template v-if="activeTab === 'global'">
<div
                  v-for="s in filteredGlobal"
                  :key="s.id"
                  :class="['list-item', { active: selectedId === s.id }]"
                  @click="selectSkill(s)"
                >
                  <div class="item-main">
                    <span class="item-name">{{ displayName(s) }}</span>
                    <el-tag v-for="tag in (s.tags || [])" :key="tag" size="small" type="warning" effect="plain">{{ tag }}</el-tag>
                    <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                      {{ s.enabled ? $t('skill.enabled') : $t('skill.disabled') }}
                    </el-tag>
                    <el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag>
                  </div>
                  <div v-if="s.name && s.name !== (s.alias || s.id)" class="item-field">
                    <span class="field-value-text">{{ s.name }}</span>
                  </div>
                  <div v-if="s.remark" class="item-field">
                    <span class="field-value-text remark-text">{{ s.remark }}</span>
                  </div>
                </div>
                <el-empty v-if="filteredGlobal.length === 0"
                :description="search ? $t('skill.noMatch') : $t('skill.noSkill')" />
            </template>

            <!-- 项目 Tab -->
            <template v-if="activeTab === 'project'">
              <el-empty v-if="projectTree.length === 0" :description="$t('skill.noProject')" />
              <template v-for="node in filteredProjectTree" :key="node.name">
                <div class="project-group-header">
                  <span class="project-group-name">{{ node.alias || node.name }}</span>
                </div>
                <div
                  v-for="s in node.skills" :key="s.id"
                  :class="['list-item', 'project-skill', { active: selectedId === s.id }]"
                  @click="selectSkill(s)"
                >
                  <div class="item-main">
                    <span class="item-name">{{ displayName(s) }}</span>
                    <el-tag v-for="tag in (s.tags || [])" :key="tag" size="small" type="warning" effect="plain">{{ tag }}</el-tag>
                    <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                      {{ s.enabled ? $t('skill.enabled') : $t('skill.disabled') }}
                    </el-tag>
                    <el-tag size="small" type="info" effect="plain">{{ sourceName(s.source) }}</el-tag>
                  </div>
                  <div v-if="s.name && s.name !== (s.alias || s.id)" class="item-field">
                    <span class="field-value-text">{{ s.name }}</span>
                  </div>
                  <div v-if="s.remark" class="item-field">
                    <span class="field-value-text remark-text">{{ s.remark }}</span>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>
      </template>

      <template #right>
        <!-- 右侧详情 -->
        <detail
          :skill="selectedSkill"
          @refresh="loadSkills"
          @openUpdate="onOpenUpdate"
          @openEdit="onOpenEdit"
          @openReadme="onOpenReadme"
        />
      </template>
    </SplitLayout>

    <!-- 弹窗 -->
    <install ref="installDialog" @submitSuccess="loadSkills" />
    <info ref="infoDialog" @submitSuccess="loadSkills" />
    <readme ref="readmeDialog" @submitSuccess="loadSkills" />
    <install-log ref="installLogDialog" />
  </div>
</template>

<script setup>
 import { ref, computed, onMounted } from 'vue'
 import { useI18n } from 'vue-i18n'
 import { ElMessageBox } from 'element-plus'
 import { getGlobalSkillList, getProjectSkillList } from '@/api/skill/routes'
 import { useMaskingStore } from '@/stores/masking'
 import { compositionDialogContainer } from '@/composition/dialog/Container'
 import SplitLayout from '@/composition/layout/SplitLayout.vue'
 import install from './edit/install.vue'
 import detail from './edit/detail.vue'
 import info from './edit/info.vue'
 import readme from './edit/readme.vue'
 import installLog from './edit/install-log.vue'

const { t } = useI18n({ useScope: 'global' })
const maskingStore = useMaskingStore()
const dialogCtrl = compositionDialogContainer()
const installDialog = ref(null)

const globalSkills = ref([])
const projectSkills = ref([])
const search = ref('')
const activeTab = ref('global')
 const selectedId = ref(null)
 const installLogDialog = ref(null)

function displayName(s) {
  return s.alias || s.name || s.id
}

function sourceName(source) {
  const key = 'skill.source.' + (source || 'local')
  return t(key) || source
}

function selectSkill(s) {
  selectedId.value = s.id
}

function onTabChange() {
  selectedId.value = null
}

const selectedSkill = computed(function () {
  if (!selectedId.value) return null
  const all = globalSkills.value.concat(projectSkills.value)
  return all.find(function (s) { return s.id === selectedId.value }) || null
})

const filteredGlobal = computed(function () {
  const q = search.value.toLowerCase().trim()
  if (!q) return globalSkills.value
  return globalSkills.value.filter(function (s) {
    const name = (s.alias || s.name || s.id).toLowerCase()
    const tags = (s.tags || []).join(' ').toLowerCase()
    return name.indexOf(q) !== -1 || tags.indexOf(q) !== -1
  })
})

const projectTree = computed(function () {
  const map = {}
  projectSkills.value.forEach(function (s) {
    const pn = s.project || (s.path && s.path.indexOf('.codewhale') !== -1 ? 'codewhale-tool' : 'unknown')
    if (!map[pn]) map[pn] = { name: pn, alias: pn, skills: [] }
    map[pn].skills.push(s)
  })
  return Object.values(map)
})

const filteredProjectTree = computed(function () {
  const q = search.value.toLowerCase().trim()
  if (!q) return projectTree.value
  return projectTree.value
    .map(function (node) {
      return {
        name: node.name,
        alias: node.alias,
        skills: node.skills.filter(function (s) {
          const name = (s.alias || s.name || s.id).toLowerCase()
          const tags = (s.tags || []).join(' ').toLowerCase()
          return name.indexOf(q) !== -1 || tags.indexOf(q) !== -1
        })
      }
    })
    .filter(function (node) { return node.skills.length > 0 })
})

function loadSkills() {
  Promise.all([getGlobalSkillList(), getProjectSkillList()])
    .then(function (results) {
      globalSkills.value = (results[0] || []).map(function (s) { s.level = 'global'; return s })
      projectSkills.value = (results[1] || []).map(function (s) { s.level = 'project'; return s })
      // 如果当前 Tab 有数据且未选中任何项，自动选中第一个
      if (!selectedId.value) {
        const list = activeTab.value === 'global' ? globalSkills.value : projectSkills.value
        if (list && list.length > 0) selectedId.value = list[0].id
      }
    })
}

function onOpenEdit() {
  if (selectedSkill.value) {
    dialogCtrl.showEditDialog(selectedSkill.value, 'infoDialog')
  }
}

function onOpenUpdate(payload) {
  if (!payload) return
  const { skillId, installParams } = payload
  // 使用更新模式（state=1）打开安装弹窗
  // 如果有 installParams 则回填，没有则让用户手动填写
  const dialog = installDialog.value
  if (dialog) {
    dialog.showDialogByData(1, { skillId, installParams })
  }
}

function onOpenReadme() {
  if (selectedSkill.value) {
    dialogCtrl.showEditDialog(selectedSkill.value, 'readmeDialog')
  }
}

function doViewLog() {
  const dialog = installLogDialog.value
  if (dialog) {
    dialog.open()
  }
}

function doClearLog() {
  ElMessageBox.confirm(t('skill.confirmClearLog'), t('skill.confirmClearLogTitle'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(function () {
    const dialog = installLogDialog.value
    if (dialog) {
      dialog.doClearLog()
    }
  })
}

onMounted(loadSkills)
</script>

<style scoped>
.page-view {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
.left-toolbar { display: flex; gap: 6px; align-items: center; }
.panel-left :deep(.el-tabs__header) { margin-bottom: 0; }
.panel-left :deep(.el-tabs__item) { padding: 0 8px; font-size: 13px; }

.list-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.project-skill { padding-left: 20px; }

.item-field { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); margin-top: 2px; flex-wrap: wrap; }
</style>
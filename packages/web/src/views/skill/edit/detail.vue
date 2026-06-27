<!--
  detail.vue — 右侧详情展示面板
  纯展示组件，SKILL.md 默认展开
--><template>
  <div class="detail-panel">
    <el-empty v-if="!skill" :description="$t('skill.selectHint')" />
    <template v-else>
      <!-- 基本信息 -->
      <div class="detail-header">
        <el-tag :type="skill.enabled ? 'success' : 'danger'" size="small" effect="dark">
          {{ skill.enabled ? $t('skill.enabled') : $t('skill.disabled') }}
        </el-tag>
        <span class="detail-title">{{ displayTitle }}</span>
        <el-tag size="small" type="info" effect="plain">{{ sourceText }}</el-tag>
        <el-tag v-if="skill.level" size="small"
          :type="skill.level === 'global' ? '' : 'warning'" effect="plain">
          {{ skill.level === 'global' ? $t('skill.global') : $t('skill.project') }}
        </el-tag>
      </div>
      <!-- 名称 -->
      <div class="detail-section">
        <div class="section-header"><span>{{ $t('common.alias') }}</span></div>
        <p class="field-value">{{ skill.alias || skill.name || skill.id }}</p>
      </div>
      <!-- 原始名称 -->
      <div v-if="skill.alias" class="detail-section">
        <div class="section-header"><span>{{ $t('skill.originalName') }}</span></div>
        <p class="field-value">{{ skill.name || skill.id }}</p>
      </div>
      <!-- 备注 -->
      <div class="detail-section">
        <div class="section-header"><span>{{ $t('skill.remark') }}</span></div>
        <p v-if="skill.remark" class="field-value">{{ skill.remark }}</p>
        <p v-else class="field-empty">（{{ $t('skill.noRemark') }}）</p>
      </div>
      <!-- 标签 -->
      <div class="detail-section">
        <div class="section-header"><span>{{ $t('skill.tags') }}</span></div>
        <div v-if="skill.tags && skill.tags.length" class="tags-row">
          <el-tag v-for="tag in skill.tags" :key="tag" size="small" type="info" effect="plain">{{ tag }}</el-tag>
        </div>
        <p v-else class="field-empty">（{{ $t('skill.noTags') }}）</p>
      </div>
      <!-- 操作 -->
      <div class="detail-actions">
        <el-button size="small" @click="emit('openEdit')">{{ $t('skill.editInfo') }}</el-button>
        <el-button size="small" @click="emit('openReadme')">{{ $t('skill.editReadme') }}</el-button>
        <el-button :type="skill.enabled ? 'default' : 'success'" size="small" @click="doToggle">
          {{ skill.enabled ? $t('skill.disable') : $t('skill.enable') }}
        </el-button>
        <el-button size="small" type="danger" @click="doRemove">{{ $t('common.delete') }}</el-button>
        <el-button v-if="skill.source === 'community'" size="small" :loading="updating" @click="doUpdate">
          {{ $t('skill.gitUpdate') }}
        </el-button>
      </div>
      <!-- SKILL.md 预览（默认展开） -->
      <div class="detail-section readme-section">
        <div class="section-header">
          <span>SKILL.md</span>
          <el-button size="small" text @click="showReadme = !showReadme">
            {{ showReadme ? $t('skill.collapseReadme') : $t('skill.viewReadme') }}
          </el-button>
        </div>
        <div v-show="showReadme">
          <div v-if="readmeLoading" v-loading="true" class="readme-loading" />
          <pre v-else-if="readmeContent" class="readme-content">{{ readmeContent }}</pre>
          <p v-else class="field-empty">（{{ $t('skill.noReadme') }}）</p>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getSkillDetail, enableSkill, disableSkill, removeSkill, updateSkill } from '@/api/skill'

const { t } = useI18n({ useScope: 'global' })
const props = defineProps({ skill: { type: Object, default: null } })
const emit = defineEmits(['refresh', 'openEdit', 'openReadme'])

const showReadme = ref(true)
const readmeContent = ref('')
const readmeLoading = ref(false)
const updating = ref(false)

const displayTitle = computed(function () {
  if (!props.skill) return ''
  return props.skill.alias || props.skill.name || props.skill.id
})

const sourceText = computed(function () {
  if (!props.skill) return ''
  return t('skill.source.' + (props.skill.source || 'local')) || props.skill.source
})

function doToggle() {
  if (!props.skill) return
  const fn = props.skill.enabled ? disableSkill : enableSkill
  fn(props.skill.id).then(function () { emit('refresh') })
}

function doRemove() {
  if (!props.skill) return
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + props.skill.id + '"?',
    t('common.confirm'),
    { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
  )
    .then(function () { return removeSkill(props.skill.id) })
    .then(function () { emit('refresh') })
}

function doUpdate() {
  if (!props.skill) return
  updating.value = true
  updateSkill(props.skill.id)
    .then(function () { emit('refresh') })
    .finally(function () { updating.value = false })
}

// 加载 SKILL.md
function loadReadme() {
  if (!props.skill) return
  readmeLoading.value = true
  getSkillDetail(props.skill.id)
    .then(function (res) {
      readmeContent.value = (res && res.readme) ? res.readme : ''
    })
    .catch(function () { readmeContent.value = '' })
    .finally(function () {
      readmeLoading.value = false
    })
}

// 初始加载
watch(function () { return props.skill }, function (neu) {
  showReadme.value = true
  readmeContent.value = ''
  if (neu) loadReadme()
}, { immediate: true })
</script>
<style scoped>
.detail-panel { height: 100%; display: flex; flex-direction: column; gap: 12px; }
.detail-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.detail-title { font-size: 18px; font-weight: 600; }
.detail-section { background: var(--bg-primary); border-radius: var(--radius); padding: 12px; border: 1px solid var(--border-secondary, #eee); }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
.field-value { font-size: 14px; line-height: 1.6; margin: 0; }
.field-empty { color: var(--text-secondary); font-size: 12px; margin: 0; }
.tags-row { display: flex; flex-wrap: wrap; gap: 6px; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
.readme-section { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.readme-section .section-header { flex-shrink: 0; }
.readme-loading { min-height: 100px; }
.readme-content { flex: 1; background: var(--bg-secondary, #f6f6f6); border-radius: var(--radius); padding: 12px; font-size: 12px; white-space: pre-wrap; overflow: auto; margin: 0; }
</style>
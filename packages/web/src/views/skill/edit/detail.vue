<!--
  detail.vue — 右侧详情展示面板（简化版）
  顶部只显示别名作为标题，备注直接展示，操作按钮无缩进
--><template>
  <div class="detail-panel">
    <el-empty v-if="!skill" :description="$t('skill.selectHint')" />
    <template v-else>
      <!-- 顶部：仅显示别名 -->
      <div class="detail-header">
        <h3 class="detail-title">{{ displayTitle }}</h3>
      </div>
      <!-- 备注：无 section-header -->
      <div class="detail-remark">
        <p v-if="skill.remark" class="remark-text">{{ skill.remark }}</p>
        <p v-else class="field-empty">（{{ $t('skill.noRemark') }}）</p>
      </div>
      <!-- 操作按钮（无缩进） -->
      <div class="detail-actions">
        <el-button size="small" type="primary" plain @click="emit('openEdit')">
          <el-icon><Edit /></el-icon>
          {{ $t('skill.editInfo') }}
        </el-button>
        <el-button size="small" type="primary" plain @click="emit('openReadme')">
          <el-icon><Document /></el-icon>
          {{ $t('skill.editReadme') }}
        </el-button>
        <el-button :type="skill.enabled ? 'warning' : 'success'" size="small" @click="doToggle">
          <el-icon><Switch /></el-icon>
          {{ skill.enabled ? $t('skill.disable') : $t('skill.enable') }}
        </el-button>
        <el-button size="small" type="danger" @click="doRemove">
          <el-icon><Delete /></el-icon>
          {{ $t('common.delete') }}
        </el-button>
        <el-button v-if="skill.source === 'community'" size="small" :loading="updating" @click="doUpdate">
          <el-icon><Refresh /></el-icon>
          {{ $t('skill.gitUpdate') }}
        </el-button>
      </div>
      <!-- SKILL.md 预览 -->
      <div class="detail-section readme-section">
        <div class="section-header">
          <span>SKILL.md</span>
          <el-button size="small" circle @click="showReadme = !showReadme">
            <el-icon><ArrowUp v-if="showReadme" /><ArrowDown v-else /></el-icon>
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

watch(function () { return props.skill }, function (neu) {
  showReadme.value = true
  readmeContent.value = ''
  if (neu) loadReadme()
}, { immediate: true })
</script>
<style scoped>
.detail-panel { height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.detail-header { padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.detail-title { font-size: 20px; font-weight: 600; margin: 0; }
.detail-remark { padding: 4px 0; }
.remark-text { font-size: 14px; line-height: 1.6; margin: 0; color: var(--text-primary); }
.field-empty { color: var(--text-secondary); font-size: 12px; margin: 0; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0; }
.detail-section { background: var(--bg-primary); border-radius: var(--radius); padding: 12px; border: 1px solid var(--border); }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
.readme-section { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.readme-section .section-header { flex-shrink: 0; }
.readme-loading { min-height: 100px; }
.readme-content { flex: 1; background: var(--bg-secondary, #f6f6f6); border-radius: var(--radius); padding: 12px; font-size: 12px; white-space: pre-wrap; overflow: auto; margin: 0; }
</style>
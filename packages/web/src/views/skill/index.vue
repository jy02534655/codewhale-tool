<!--
  index.vue — Skill 管理页面（skill 模块入口）
  统一使用 maskingStore.isLoading 控制全局加载状态
  安装弹窗提取到 ./edit/install.vue
-->
<template>
  <div class="skill-view" v-loading="maskingStore.isLoading">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <h2>Skill 管理</h2>
      <div class="actions">
        <el-button type="primary" @click="dialogCtrl.showDialog('install')">+ 安装 Skill</el-button>
        <el-button @click="refresh">刷新</el-button>
      </div>
    </div>

    <!-- 搜索社区 Skill -->
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索社区 skill..."
        @keyup.enter="searchCommunity"
        clearable
      />
      <el-button @click="searchCommunity">搜索</el-button>
    </div>

    <!-- 社区搜索结果 -->
    <el-card v-if="communityResults.length > 0" class="community-block" shadow="hover">
      <template #header>
        <span>社区可用 Skill（{{ communityResults.length }} 个）</span>
      </template>
      <div class="community-grid">
        <div v-for="s in communityResults" :key="s.id" class="community-card">
          <div class="community-info">
            <span class="skill-id">{{ s.id }}</span>
            <span v-if="s.description" class="skill-desc">{{ s.description }}</span>
          </div>
          <el-button
            size="small"
            :type="installedIds.includes(s.id) ? 'info' : 'primary'"
            :disabled="installedIds.includes(s.id)"
            @click="doInstall(s.id)"
          >
            {{ installedIds.includes(s.id) ? '已安装' : '安装' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 已安装列表 -->
    <el-empty v-if="skills.length === 0" description="没有安装任何 Skill">
      <template #extra>
        <el-button type="primary" @click="dialogCtrl.showDialog('install')">安装 Skill</el-button>
      </template>
    </el-empty>
    <div v-else class="skill-list">
      <el-card
        v-for="s in skills"
        :key="s.id"
        :class="['skill-card', { disabled: !s.enabled }]"
        shadow="hover"
      >
        <template #header>
          <div class="skill-header">
            <div class="skill-info">
              <el-tag :type="s.enabled ? 'success' : 'danger'" size="small" effect="dark">
                {{ s.enabled ? '启用' : '禁用' }}
              </el-tag>
              <span class="skill-id">{{ s.id }}</span>
              <el-tag size="small" type="info" effect="plain">{{ s.source }}</el-tag>
              <span v-if="s.version" class="skill-version">v{{ s.version }}</span>
            </div>
            <div class="skill-actions">
              <el-button size="small" @click="toggleDetail(s)">
                {{ s.showDetail ? '收起' : '详情' }}
              </el-button>
              <el-button
                v-if="s.enabled"
                size="small"
                @click="doDisable(s.id)"
              >
                禁用
              </el-button>
              <el-button
                v-else
                size="small"
                type="success"
                @click="doEnable(s.id)"
              >
                启用
              </el-button>
              <el-button size="small" type="danger" @click="doRemove(s.id)">删除</el-button>
            </div>
          </div>
        </template>

        <!-- 展开的详情（SKILL.md 内容） -->
        <div v-if="s.showDetail" class="skill-detail">
          <div v-if="s.readmeLoading" v-loading="true" element-loading-text="加载详情中..." class="detail-loading"></div>
          <pre v-else-if="s.readme">{{ s.readme }}</pre>
          <p v-else class="no-detail">（无详情）</p>
        </div>
      </el-card>
    </div>

    <!-- 安装弹窗 -->
    <Install ref="install" @submitSuccess="refresh" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getSkillList,
  getSkillDetail,
  installSkill,
  enableSkill,
  disableSkill,
  removeSkill,
  searchSkill,
} from '@/api/skill';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import Install from './edit/install.vue';

const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const skills = ref([]);
const searchQuery = ref('');
const communityResults = ref([]);

// 已安装的 skill ID 列表
const installedIds = computed(() => skills.value.map((s) => s.id));

async function refresh() {
  try {
    const list = await getSkillList();
    skills.value = (list || []).map((s) => ({
      ...s,
      showDetail: false,
      readme: null,
      readmeLoading: false,
    }));
  } catch {
    // 错误已由 request 层处理
  }
}

async function loadReadme(skill) {
  if (skill.readme || skill.readmeLoading) return;
  skill.readmeLoading = true;
  try {
    const res = await getSkillDetail(skill.id);
    skill.readme = res?.readme || '（无 SKILL.md）';
  } catch {
    skill.readme = '加载失败';
  } finally {
    skill.readmeLoading = false;
  }
}

// 切换详情展开/收起
function toggleDetail(skill) {
  skill.showDetail = !skill.showDetail;
  if (skill.showDetail) loadReadme(skill);
}

async function doInstall(id) {
  try {
    await installSkill(id);
    ElMessage.success('安装成功');
    refresh();
  } catch {
    // 错误已由 request 层处理
  }
}

async function doEnable(id) {
  try {
    await enableSkill(id);
    refresh();
  } catch {}
}

async function doDisable(id) {
  try {
    await disableSkill(id);
    refresh();
  } catch {}
}

async function doRemove(id) {
  try {
    await ElMessageBox.confirm(
      `确认删除 skill "${id}"？（将同时删除磁盘文件）`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    );
  } catch {
    return;
  }
  try {
    await removeSkill(id);
    refresh();
  } catch {}
}

async function searchCommunity() {
  try {
    communityResults.value = await searchSkill(searchQuery.value);
  } catch {
    communityResults.value = [];
  }
}

onMounted(refresh);
</script>

<style scoped>
.skill-view { display: flex; flex-direction: column; gap: 16px; }

.toolbar { display: flex; justify-content: space-between; align-items: center; }
.toolbar h2 { font-size: 20px; margin: 0; }
.actions { display: flex; gap: 8px; }

.search-bar { display: flex; gap: 8px; }
.search-bar :deep(.el-input) { flex: 1; }

.community-block { margin-bottom: 4px; }
.community-grid { display: flex; flex-direction: column; gap: 8px; }
.community-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
.community-info { display: flex; align-items: center; gap: 12px; flex: 1; }
.skill-id { font-weight: 500; min-width: 140px; }
.skill-desc { flex: 1; color: var(--text-secondary); font-size: 12px; }

.skill-list { display: flex; flex-direction: column; gap: 8px; }

.skill-card.disabled { opacity: 0.6; }

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.skill-info { display: flex; align-items: center; gap: 10px; }
.skill-version { color: var(--text-secondary); font-size: 12px; }
.skill-actions { display: flex; gap: 4px; }

.skill-detail {
  padding-top: 10px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
.skill-detail pre {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 12px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}
.detail-loading { min-height: 80px; }
.no-detail { color: var(--text-secondary); font-size: 12px; padding: 8px 0; }
</style>

<!--
  index.vue — 通用设置页面（Masonry 瀑布流布局版）
  使用 CSS column-count 实现多列卡片布局，保留批量保存、取消。
 -->
<template>
  <div class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('settings.title') }}</span>
      </div>

      <!-- ========== 表单内容 ========== -->
      <el-form ref="settingsFormRef" :model="formData" :rules="rules" label-width="200px" label-position="left" size="default" require-asterisk-position="right">
        <div class="settings-masonry">
          <groupCard v-for="group in groups" :key="group.titleKey" v-model:formData="formData" :title-key="group.titleKey" :items="group.items" />
        </div>
      </el-form>

      <!-- ========== 操作按钮（浮动在底部） ========== -->
      <div class="action-bar action-bar--floating">
        <el-button type="primary" @click="onSave">{{ $t('settings.actions_save') }}</el-button>
        <el-button @click="onCancel">{{ $t('settings.actions_cancel') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import { getSettings, updateSettings } from '@/api/settings';
  import { clearObject } from '@/utils';
  import { assign, cloneDeep } from 'lodash-es';

  import groupCard from './cards/groupCard.vue';
  import { groups } from './cards/index.js';

  const { t } = useI18n({ useScope: 'global' });

  // ========== 表单引用 ==========
  const settingsFormRef = ref(null);

  // ========== 表单数据 ==========
  const formData = reactive({});

  // 用于取消重置的原始数据快照
  const originalForm = {};

  // ========== 表单校验规则 ==========
  const rules = {};

  // ========== 获取设置 ==========
  const fetchSettings = () => {
    getSettings().then((settingsResult) => {
      if (settingsResult) {
        const settingsData = settingsResult;
        assign(formData, clearObject(settingsData));
        // 同步原始快照
        assign(originalForm, cloneDeep(formData));
      }
    });
  }

  // ========== 保存 ==========
  const onSave = () => {
    settingsFormRef.value.validate((valid) => {
      if (!valid) {
        return;
      }
      // 计算 diff：只提交修改过的字段
      const payload = {};
      for (const key of Object.keys(formData)) {
        const current = formData[key];
        const original = originalForm[key];
        // 跳过未变更的字段
        if (current === original) continue;
        payload[key] = current;
      }
      updateSettings(payload)
        .then(() => {
          // 保存成功后更新原始快照
          assign(originalForm, cloneDeep(formData));
        })
        .catch(() => {
          // 失败不更新快照，保留上次成功状态
        });
    });
  }

  // ========== 取消 ==========
  const onCancel = () => {
    // 将 formData 重置为原始快照
    assign(formData, cloneDeep(originalForm));
    // 清除校验状态
    settingsFormRef.value.clearValidate();
    ElMessage.info(t('settings.cancel_reset'));
  }

  onMounted(fetchSettings);
</script>

<style scoped>
  /* ========== 操作按钮栏 ========== */
  .action-bar {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-bar--floating {
    position: sticky;
    bottom: 16px;
    z-index: 100;
    display: flex;
    justify-content: center;
    gap: 16px;
    margin: 24px 0;
    padding: 12px 24px;
    width: 100%;
    /* 提高不透明度，贴近 Element Plus 背景色，避免与卡片区混色 */
    background: rgba(255, 255, 255, 0.92);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(16px);
  }

  /* 暗色模式毛玻璃 */
  html[data-theme="dark"] .action-bar--floating {
    background: rgba(30, 30, 40, 0.92);
    border-top-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  }

  /* 主按钮悬停上浮 */
  .action-bar--floating :deep(.el-button--primary) {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .action-bar--floating :deep(.el-button--primary:hover) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
  }
  html[data-theme="dark"] .action-bar--floating :deep(.el-button--primary:hover) {
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.25);
  }

  /* 次要按钮：贴近 Element Plus 默认变量，提升对比度 */
  .action-bar--floating :deep(.el-button:not(.el-button--primary)) {
    background: var(--el-fill-color-blank, rgba(255, 255, 255, 0.6)) !important;
    border-color: var(--el-border-color, rgba(0, 0, 0, 0.08)) !important;
    color: var(--el-text-color-regular, #444) !important;
    box-shadow: none !important;
    border-radius: 6px !important;
    padding: 8px 16px !important;
  }
  .action-bar--floating :deep(.el-button:not(.el-button--primary):hover) {
    background: var(--el-fill-color-blank, rgba(255, 255, 255, 0.85)) !important;
    border-color: var(--el-border-color, rgba(0, 0, 0, 0.14)) !important;
    color: var(--el-text-color-primary, #333) !important;
  }
  html[data-theme="dark"] .action-bar--floating :deep(.el-button:not(.el-button--primary)) {
    background: var(--el-fill-color-blank, rgba(255, 255, 255, 0.08)) !important;
    border-color: var(--el-border-color, rgba(255, 255, 255, 0.12)) !important;
    color: var(--el-text-color-regular, #ccc) !important;
  }
  html[data-theme="dark"] .action-bar--floating :deep(.el-button:not(.el-button--primary):hover) {
    background: var(--el-fill-color-blank, rgba(255, 255, 255, 0.14)) !important;
    border-color: var(--el-border-color, rgba(255, 255, 255, 0.22)) !important;
    color: var(--el-text-color-primary, #ddd) !important;
  }

  .page-section {
  }

  /* ========== 卡片样式 ========== */
  .settings-card {
    border-radius: 8px;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
    margin-bottom: 24px;
    break-inside: avoid;
  }
  .settings-card:hover {
    /* hover 浮动效果已移除，保持界面稳定 */
  }

  /* ========== 瀑布流布局 ========== */
  .settings-masonry {
    column-count: 3;
    column-gap: 16px;
  }

  /* ========== 卡片头部 ========== */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .card-header .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 彩色标识条 */
  .card-header .section-title::before {
    content: '';
    width: 4px;
    height: 18px;
    border-radius: 2px;
    background: linear-gradient(180deg, #409eff, #79bbff);
  }

  /* ========== 表单网格 ========== */
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px 20px;
  }
  .settings-grid :deep(.el-form-item) {
    margin-bottom: 0;
  }
  .settings-masonry :deep(.el-form-item__content) {
    display: flex;
    justify-content: flex-end;
  }

  /* ========== 页面基础 ========== */
  .page-view {
    padding: 16px;
  }
  .section-header {
    margin-bottom: 16px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 600;
  }

  /* ========== 响应式 ========== */
  @media (max-width: 768px) {
    .settings-masonry {
      column-count: 1;
    }
    .settings-grid {
      grid-template-columns: 1fr;
    }
    .action-bar {
      flex-direction: column;
      align-items: stretch;
    }
    .action-bar .el-button {
      width: 100%;
    }
    .action-bar--floating :deep(.el-button:not(.el-button--primary)) {
      text-align: right;
    }
  }
</style>

<!--
  index.vue — 通用设置页面（Masonry 瀑布流布局版）
  使用 CSS column-count 实现多列卡片布局，保留批量保存、取消、恢复默认。
 -->
<template>
  <div class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('settings.title') }}</span>
      </div>

      <!-- ========== 操作按钮 ========== -->
      <div class="action-bar">
        <el-button type="primary" @click="onSave">{{ $t('settings.actions_save') }}</el-button>
        <el-button @click="onCancel">{{ $t('settings.actions_cancel') }}</el-button>
        <el-button @click="onRestoreDefaults">{{ $t('settings.actions_restore_defaults') }}</el-button>
      </div>

      <el-form ref="settingsFormRef" :model="formData" :rules="rules" label-width="200px" label-position="left" size="default" require-asterisk-position="right">
        <div class="settings-masonry">
          <groupCard v-for="group in groups" :key="group.titleKey" v-model:formData="formData" :title-key="group.titleKey" :items="group.items" />
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getSettings, updateSettings, postSettingsDefaults, getSettingsDefaults } from '@/api/settings';
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

  // 默认值数据，用于 diff 时判断是否恢复默认
  const defaultSettings = reactive({});

  // ========== 表单校验规则 ==========
  const rules = {};

  // ========== 获取设置 ==========
  const fetchSettings = () => {
    Promise.allSettled([
      getSettings(),
      getSettingsDefaults()
    ]).then(([settingsResult, defaultsResult]) => {
      if (settingsResult.status === 'fulfilled' && settingsResult.value) {
        const settingsData = settingsResult.value;
        assign(formData, clearObject(settingsData));
        // 同步原始快照
        assign(originalForm, cloneDeep(formData));
      }
      if (defaultsResult.status === 'fulfilled' && defaultsResult.value) {
        assign(defaultSettings, defaultsResult.value);
      }
    });
  }

  // ========== 保存 ==========
  const onSave = () => {
    settingsFormRef.value.validate((valid) => {
      if (!valid) {
        return;
      }
      // 计算 diff：只提交修改过的字段，改回默认值的字段传 null
      const payload = {};
      for (const key of Object.keys(formData)) {
        const current = formData[key];
        const original = originalForm[key];
        // 跳过未变更的字段
        if (current === original) continue;
        // 改回默认值时传 null，让后端删除该字段以恢复默认
        if (defaultSettings[key] !== undefined && current === defaultSettings[key]) {
          payload[key] = null;
        } else {
          payload[key] = current;
        }
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

  // ========== 恢复默认 ==========
  const onRestoreDefaults = () => {
    ElMessageBox.confirm(t('settings.reset_confirm_message'), t('settings.reset_confirm_title'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
      .then(() => {
        return postSettingsDefaults();
      })
      .then(() => {
        // 恢复成功后重新拉取最新数据
        return fetchSettings();
      })
      .catch(() => {
        // 用户取消恢复
      });
  }

  onMounted(fetchSettings);
</script>

<style scoped>
  /* ========== 操作按钮栏 ========== */
  .action-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  /* ========== 卡片样式 ========== */
  .settings-card {
    border-radius: 4px;
    transition:
      box-shadow 0.2s,
      transform 0.2s;
    margin-bottom: 20px;
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
    }
    .action-bar .el-button {
      width: 100%;
    }
  }
</style>

# Web 编码风格示例 — 页面组件

本文件汇总 `packages/web/src/views/` 下的页面组件写法。

---

## 1. 页面容器（仅布局）

```vue
<!--
  index.vue — Provider 管理页面容器
  仅负责布局，业务逻辑已拆分到 officialKey.vue 和 thirdParty.vue
-->
<template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <official-key />
    <third-party />
  </div>
</template>

<script setup>
// 引入全局遮罩状态管理
import { useMaskingStore } from '@/stores/masking';
// 引入官方 API Key 管理子组件
import OfficialKey from './officialKey.vue';
// 引入第三方供应商管理子组件
import ThirdParty from './thirdParty.vue';

// 获取全局遮罩状态
const maskingStore = useMaskingStore();
</script>
```

### 要点
- 根模板统一加 `v-loading="maskingStore.isLoading"`。
- 容器组件只负责布局和引入子组件，不写业务逻辑。
- `<script setup>` 中 import 分组：Vue / 第三方库 / 内部路径。

---

## 2. 完整列表页（带弹窗）

```vue
<!--
  index.vue — 代理管理页面（卡片布局）
  侧边栏导航替换了页面标题，内容区用卡片网格展示
-->
<template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <div class="page-section">
      <div class="section-header">
        <span class="section-title">{{ $t('proxy.title') }}</span>
      </div>
      <div class="section-actions">
        <el-button type="primary" size="small" @click="dialogCtrl.showAddDialog(null)">
          <el-icon><Plus /></el-icon>
          {{ $t('proxy.add') }}
        </el-button>
      </div>
      <el-card shadow="never">
        <el-empty v-if="list.length === 0" :description="$t('proxy.empty')" />
        <div v-else class="card-grid">
          <el-card v-for="p in list" :key="p.id" :class="['proxy-card', { 'card-active': p.default }]" shadow="hover">
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <span class="card-alias">{{ p.alias }}</span>
                  <el-tag v-if="p.default" size="small" type="success" effect="dark">{{ $t('proxy.default') }}</el-tag>
                </div>
                <div class="card-actions">
                  <el-button v-if="!p.default" size="small" type="primary" @click="onSetDefault(p)">
                    <el-icon><Top /></el-icon>
                    {{ $t('proxy.setDefault') }}
                  </el-button>
                  <el-button size="small" type="primary" plain @click="dialogCtrl.showEditDialog(p)">
                    <el-icon><Edit /></el-icon>
                    {{ $t('common.edit') }}
                  </el-button>
                  <el-button size="small" type="danger" @click="onRemove(p)">
                    <el-icon><Delete /></el-icon>
                    {{ $t('common.delete') }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="card-fields">
              <div class="field-row">
                <span class="field-label">{{ $t('proxy.type') }}</span>
                <el-tag size="small" type="info" effect="plain">{{ p.type }}</el-tag>
              </div>
              <div class="field-row">
                <span class="field-label">{{ $t('proxy.host') }}</span>
                <span class="field-value mono">{{ p.host }}:{{ p.port }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ProxyEdit ref="dialogRef" @submitSuccess="() => loadList(true)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessageBox } from 'element-plus';
import { removeProxy, setDefaultProxy } from '@/api/proxy';
import { useShareStore } from '@/stores/share';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import ProxyEdit from './edit.vue';

const { t } = useI18n({ useScope: 'global' });
const maskingStore = useMaskingStore();
const shareStore = useShareStore();
const dialogCtrl = compositionDialogContainer();

const list = ref([]);

function loadList(isReLoad) {
  shareStore.getProxyList(isReLoad).then(function (result) {
    list.value = result.data || [];
  });
}

function onRemove(row) {
  ElMessageBox.confirm(
    t('common.confirm_delete') + ' "' + row.alias + '"?',
    t('common.confirm'),
    { type: 'warning' }
  ).then(function () {
    removeProxy({ id: row.id }).then(function () { loadList(true); });
  });
}

function onSetDefault(row) {
  setDefaultProxy({ id: row.id }).then(function () { loadList(true); });
}

onMounted(loadList);
</script>

<style scoped>
</style>
```

### 要点
- 页面根节点统一 `v-loading="maskingStore.isLoading"`。
- 业务函数在 `<script setup>` 内定义，用 `function` 关键字。
- API 调用通过 `.then()` 链式处理，避免 `async/await`。
- 确认框用 `ElMessageBox.confirm`，成功后链式刷新列表。
- 弹窗通过 `compositionDialogContainer` 管理，子组件通过 `ref` 暴露。

---

## 3. 组件结构约定

| 层级 | 目录 | 说明 |
|------|------|------|
| 页面 | `views/{module}/index.vue` | 容器页，引入子组件 |
| 子页面 | `views/{module}/{name}.vue` | 实际业务组件 |
| 编辑弹窗 | `views/{module}/edit.vue` | 表单弹窗 |

### 组件命名
- 页面容器：`index.vue`
- 子组件：PascalCase，如 `OfficialKey.vue`、`ThirdParty.vue`
- 编辑弹窗：`edit.vue`

---

## 4. 表单模式

```vue
<template>
  <el-dialog v-model="isShow" :title="formTitle" @close="close">
    <el-form :model="formData" label-width="100px">
      <el-form-item :label="$t('provider.label')">
        <el-input v-model="formData.label" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="submitting" @click="submit(apiCall)">
        {{ $t('common.save') }}
      </el-button>
    </template>
  </el-dialog>
</template>
```

### 要点
- `el-dialog` 绑定 `v-model="isShow"`。
- `@close="close"` 在弹窗关闭时重置表单。
- 提交按钮绑定 `:loading="submitting"` 防止重复提交。
- 文本全部走 `$t()` 国际化。

## 5. 表格模式

```vue
<el-table :data="list" v-loading="loading">
  <el-table-column prop="label" :label="$t('provider.label')" />
  <el-table-column :label="$t('provider.apiKey')">
    <template #default="{ row }">
      <span>{{ masking(row.api_key) }}</span>
    </template>
  </el-table-column>
  <el-table-column :label="$t('common.actions')" width="200">
    <template #default="{ row }">
      <el-button size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row.id)">
        {{ $t('common.delete') }}
      </el-button>
    </template>
  </el-table-column>
</el-table>
```

### 要点
- `v-loading="loading"` 绑定全局 loading。
- 敏感字段通过 `masking()` 掩码显示。
- 操作列宽度固定 `width="200"`，按钮尺寸 `size="small"`。
- 文本全部走 `$t()` 国际化。

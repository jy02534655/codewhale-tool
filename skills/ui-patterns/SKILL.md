---
name: ui-patterns
description: Use when building or modifying Vue 3/Element Plus UI components. Covers dialog composables (Base/Form/Container), API request layer, masking, i18n, forms, and tables.
---

# UI 交互模式 Skill

Vue 3 + Element Plus 前端 UI 交互规范和可复用模式。

## 概述

当需要修改或新增前端 UI 组件时使用本技能。

- **弹窗模式**: 三层组合函数（Base / Form / Container）
- **API 请求层**: 统一请求工具 + 掩码显示
- **加载状态**: Pinia 全局 loading store
- **国际化**: vue-i18n 4 语言同步
- **表单/表格模式**: Element Plus 最佳实践

## 弹窗组合函数（三层架构）

### Base.js — `composition/dialog/Base.js`

弹窗状态管理，最简单的一层：

```javascript
import { compositionDialogBase } from '@/composition/dialog/Base'

const {
  isShow,      // ref(false) — 弹窗显隐
  formData,    // ref({})  — 表单数据
  open,        // (data?) → void — 打开弹窗（可选初始数据）
  close,       // () → void — 关闭弹窗 + 重置数据
} = compositionDialogBase({ /* 默认表单数据 */ });
```

**使用场景**: 仅需新增操作的弹窗（如 model.vue —— 只需新增模型名称）。

### Form.js — `composition/dialog/Form.js`

在 Base 基础上增加表单提交 + 新增/编辑模式：

```javascript
import { compositionDialogForm } from '@/composition/dialog/Form'

const {
  // 继承 Base 的所有属性
  isShow, formData, open, close,
  // Form 新增
  isAdd,        // ref(true) — 新增模式
  formTitle,    // computed — 弹窗标题（新增/编辑自动切换）
  submitting,   // ref(false) — 提交中状态
  submit,       // (apiCall) → Promise — 提交（自动 loading + ElMessage）
} = compositionDialogForm({ /* 默认表单数据 */ });
```

**使用场景**: 同时支持新增和编辑的弹窗（如 provider.vue、proxy.vue）。

### Container.js — `composition/dialog/Container.js`

父组件管理多个子弹窗：

```javascript
import { compositionDialogContainer } from '@/composition/dialog/Container'

const dialogCtrl = compositionDialogContainer();

// 在模板中注册弹窗 ref
// <ProviderDialog ref="providerDialog" @saved="loadData" />
// <ModelDialog ref="modelDialog" @saved="loadData" />

// 打开弹窗
dialogCtrl.showAddDialog(initialData, 'providerDialog');    // 新增模式
dialogCtrl.showEditDialog(rowData, 'providerDialog');       // 编辑模式
```

**使用场景**: 列表页面（index.vue），包含多个弹窗。

### 典型 index.vue 结构

```vue
<template>
  <div v-loading="maskingStore.isLoading">
    <!-- 操作按钮栏 -->
    <el-button @click="dialogCtrl.showAddDialog(null, 'providerDialog')">新增</el-button>

    <!-- 数据表格 -->
    <el-table :data="list">
      <el-table-column prop="label" label="名称" />
      <el-table-column label="操作">
        <el-button @click="dialogCtrl.showEditDialog(row, 'providerDialog')">编辑</el-button>
        <el-button @click="handleDelete(row.id)">删除</el-button>
      </el-table-column>
    </el-table>

    <!-- 弹窗容器 -->
    <ProviderDialog ref="providerDialog" @saved="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { compositionDialogContainer } from '@/composition/dialog/Container'
import { useMaskingStore } from '@/stores/masking'

const list = ref([])
const maskingStore = useMaskingStore()
const dialogCtrl = compositionDialogContainer()

async function loadData() { /* API 调用 */ }
async function handleDelete(id) { /* API 调用 + ElMessage */ }

onMounted(() => loadData())
</script>
```

## API 请求层

### 统一请求方法 (`utils/request.js`)

```javascript
import { ajaxGet, ajaxPost, ajaxPut, ajaxDelete } from '@/utils/request'

// 返回 { success: boolean, data?: any, message?: string }
const r = await ajaxGet('/api/provider/list')
const r = await ajaxPost('/api/provider/add', { provider: 'siliconflow' })
const r = await ajaxPut('/api/provider/sk-xxx', { label: '新标签' })
const r = await ajaxDelete('/api/provider/sk-xxx')
```

**自动处理**: 网络错误 → `ElMessage.error` + 返回 `{ success: false, message: '请求失败' }`

### 每个 API 文件对应一个路由前缀

```
packages/web/src/api/
├── provider.js   → /api/provider/*
├── officialKey.js → /api/official-key/*
├── proxy.js      → /api/proxy/*
├── token.js      → /api/token/*
├── skill.js      → /api/skill/*
└── lang.js       → /api/lang
```

```javascript
// packages/web/src/api/provider.js
export const getProviderList = () => ajaxGet('/api/provider/list')
export const addProvider = (data) => ajaxPost('/api/provider/add', data)
export const deleteProvider = (id) => ajaxDelete('/api/provider/' + id)
```

## 掩码显示 (`utils/Masking.js`)

敏感字段（API key、Token）的掩码显示：

```javascript
import { masking } from '@/utils/Masking'

// masking('sk-xxxxxxxxxxxxxxxx1234') → 'sk-xx****1234'
// 格式: 前 5 位 + **** + 后 4 位
```

在表格中使用：
```vue
<el-table-column label="API Key">
  <template #default="{ row }">
    <span>{{ masking(row.api_key) }}</span>
  </template>
</el-table-column>
```

## 全局加载状态 (`stores/masking.js`)

```javascript
import { useMaskingStore } from '@/stores/masking'

const maskingStore = useMaskingStore()
maskingStore.loading()    // 显示全局 loading
// 异步操作...
maskingStore.unloading()  // 隐藏全局 loading
maskingStore.isLoading    // ref，用于 v-loading 指令
```

**注意**: 弹窗提交由 `compositionDialogForm.submit()` 自动管理 loading，无需手动调用。

## 国际化

### 语言包结构

每个语言文件在 `locales/{zh-Hans,en,ja,pt-BR}.json`，按域名分组：

```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑"
  },
  "provider": {
    "title": "供应商管理",
    "addProvider": "新增供应商",
    "providerType": "供应商类型",
    "apiKey": "API Key",
    "baseUrl": "Base URL",
    "modelName": "模型名称"
  }
}
```

### 在组件中使用

```vue
<template>
  <el-button>{{ $t('common.save') }}</el-button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
ElMessage.success(t('provider.providerAdded'))
</script>
```

### 语言切换

`App.vue` 中通过 `/api/lang` POST 持久化：
```javascript
const switchLang = async (locale) => {
  await ajaxPost('/api/lang', { locale })
  // 前端 i18n 同步切换 + Element Plus locale 联动
}
```

## 表单模式

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

## 表格模式

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

---

**版本**: 1.0  
**最后更新**: 2026-06-28  
**基于项目**: codewhale-tool v0.3.0
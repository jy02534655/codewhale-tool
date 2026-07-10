# Web 编码风格示例 — Dialog 三层组合函数

本文件汇总 `packages/web/src/composition/dialog/` 下的三层弹窗组合函数写法。

目录结构：

```
composition/dialog/
├── Base.js      — 弹窗显隐 + 状态切换
├── Form.js      — 新增/编辑表单提交
└── Container.js — 父组件管理多个子弹窗
```

---

## Base.js — 最底层弹窗状态

```javascript
import { ref } from 'vue';

/**
 * 弹窗基础操作
 * @param {object} [opts] 配置
 * @param {import('vue').Ref} [opts.state] 状态 ref（0新增/1编辑）
 * @param {Function} [opts.initfun] 弹窗显示时的初始化函数
 * @returns {{ isShow, showDialog, hideDialog, showDialogByData }}
 */
export function compositionDialogBase({ state, initfun } = {}) {
  const isShow = ref(false);

  function showDialog() {
    isShow.value = true;
  }

  function hideDialog() {
    isShow.value = false;
  }

  /**
   * 显示弹窗并设置状态和数据
   * @param {number} v 0 新增 / 1 编辑
   * @param {*} data 初始化数据
   */
  function showDialogByData(v, data) {
    showDialog();
    if (state) state.value = v;
    setTimeout(() => {
      initfun && initfun({ data, state: v });
    });
  }

  return { isShow, showDialog, hideDialog, showDialogByData };
}
```

### 要点
- 只管理 `isShow` 和 `state`，不涉及表单验证。
- 通过 `showDialogByData(v, data)` 统一处理新增/编辑入口。
- `initfun` 用 `setTimeout` 延迟执行，确保 DOM 已渲染。

---

## Form.js — 表单 + 提交

```javascript
import { getCurrentInstance } from 'vue';
import { compositionViewForm } from '@/composition/view/Form';
import { compositionDialogBase } from '@/composition/dialog/Base';
import { cloneDeep } from 'lodash';

/**
 * compositionDialogForm — 弹窗表单操作
 *
 * 组合 compositionDialogBase 和 compositionViewForm，
 * 用于新增/编辑弹窗场景。
 * 在 el-dialog 上使用 @close="resetForm" 即可在弹窗关闭时自动重置表单，
 * 无需手动调用 closeDialog。
 *
 * @param {object} [opts] 配置
 * @param {string} [opts.formName='form'] 表单 ref 名称
 * @param {Function} opts.addFun 新增方法
 * @param {Function} opts.editFun 编辑方法
 * @param {Function} [opts.initfun] 弹窗显示时的初始化回调
 * @returns {{ state, isEdit, isShow, showDialog, hideDialog, showDialogByData, submitForm, submitDialogForm, validateForm, validateFieldForm, resetForm }}
 */
export function compositionDialogForm({ formName = 'formRef', addFun, editFun, initfun } = {}) {
  const vm = getCurrentInstance();

  const {
    state,
    isEdit,
    submitForm,
    validateForm,
    validateFieldForm,
    resetForm,
  } = compositionViewForm({ formName, addFun, editFun });

  const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({ state, initfun });

  /**
   * 提交表单数据，成功后关闭弹窗并发出 submitSuccess 事件
   * 弹窗关闭时由 el-dialog 的 @close="resetForm" 自动重置表单
   * @param {*} params 表单参数
   * @returns {Promise}
   */
  const submitDialogForm = (params) => {
    const data = cloneDeep(params);
    return submitForm(params)
      .then(() => {
        hideDialog();
        vm.emit('submitSuccess', { data, state: state.value });
      })
      .catch(() => {});
  };

  return {
    state,
    isEdit,
    isShow,
    showDialog,
    hideDialog,
    showDialogByData,
    submitForm,
    submitDialogForm,
    validateForm,
    validateFieldForm,
    resetForm,
  };
}
```

### 要点
- 组合 Base + ViewForm，职责分层清晰。
- 返回对象包含所有下层能力，上层可直接解构使用。
- 提交成功后关闭弹窗并 `emit` 事件，由父组件刷新列表。

---

## Container.js — 父组件弹窗容器

```javascript
import { getCurrentInstance } from 'vue';

/**
 * 弹窗容器 - 父组件管理弹窗
 *
 * 在父组件中引入，通过 ref 控制子组件弹窗的显隐。
 *
 * @param {object} [opts] 配置
 * @returns {{ showAddDialog, showEditDialog }}
 */
export function compositionDialogContainer({ } = {}) {
  const vm = getCurrentInstance();

  function showDialog(dialogName = 'dialogRef') {
    vm.refs[dialogName].showDialog();
  }

  function hideDialog(dialogName = 'dialogRef') {
    vm.refs[dialogName].hideDialog();
  }

  function showDialogByData(state, data, dialogName = 'dialogRef') {
    vm.refs[dialogName].showDialogByData(state, data);
  }

  function showAddDialog(data, dialogName = 'dialogRef') {
    showDialogByData(0, data, dialogName);
  }

  function showEditDialog(data, dialogName = 'dialogRef') {
    showDialogByData(1, data, dialogName);
  }

  return { showDialog, hideDialog, showAddDialog, showEditDialog };
}
```

### 要点
- 通过 `getCurrentInstance().refs` 调用子组件方法。
- 默认 `dialogRef` 作为 ref 名称，保持与 Element Plus 默认 ref 一致。
- 新增/编辑通过 `showAddDialog` / `showEditDialog` 语义化入口。

---

## 典型用法

```vue
<template>
  <div v-loading="maskingStore.isLoading">
    <el-button @click="dialogCtrl.showAddDialog(null, 'providerDialog')">新增</el-button>

    <el-table :data="list">
      <el-table-column prop="label" label="名称" />
      <el-table-column label="操作">
        <el-button @click="dialogCtrl.showEditDialog(row, 'providerDialog')">编辑</el-button>
        <el-button @click="handleDelete(row.id)">删除</el-button>
      </el-table-column>
    </el-table>

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

### 要点
- 父组件通过 `compositionDialogContainer` 管理多个子弹窗。
- 子组件通过 `ref="providerDialog"` 暴露方法。
- 事件名统一用 `submitSuccess` / `saved`，由业务自行约定但保持语义化。

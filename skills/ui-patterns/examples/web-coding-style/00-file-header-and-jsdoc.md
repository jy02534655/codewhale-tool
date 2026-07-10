# Web 编码风格示例 — 文件头部与 JSDoc

本文件汇总 `packages/web` 中常见的文件头部注释和 JSDoc 写法，
用于统一新增/修改前端文件时的风格。

---

## 1. 工具函数文件头部

```javascript
/**
 * 通用工具函数
 *
 * 提供 isEmpty、getValueByData、nameIncreasePrefix 等辅助方法。
 */

import {
  isNumber,
  isEmpty as lodashIsEmpty,
  isBoolean,
  isDate,
  isFunction,
  get,
} from 'lodash';

/**
 * 判断是否为空对象、空字符串、null
 * {}、[]、''、null 会返回 true
 * 数字、布尔、时间、方法不算空
 *
 * @param {*} v 要判断的值
 * @returns {boolean}
 */
export function isEmpty(v) {
  if (isNumber(v) || isBoolean(v) || isDate(v) || isFunction(v)) {
    return false;
  }
  return lodashIsEmpty(v);
}

/**
 * 返回数据对象中给定名称属性的值
 * 如果未提供名称，则返回数据对象本身
 *
 * @param {object} data 数据对象
 * @param {string} [name] 属性名，支持点号路径
 * @returns {*} 属性值或整个数据对象
 */
export function getValueByData(data, name) {
  return name ? get(data, name) : data;
}
```

### 要点
- 文件顶部用 `/** ... */` 说明整体用途。
- 每个导出函数都用 JSDoc 描述入参、返回值。
- 技术术语保持英文，说明文字用中文。

---

## 2. 组合函数文件头部

```javascript
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
- 组合函数统一用 `composition` 前缀命名。
- 返回值直接在 JSDoc 中列出字段名和含义。
- 内部辅助函数也加简要注释。

---

## 3. Store 文件头部

```javascript
/**
 * masking store — 全局请求遮罩状态管理
 *
 * 按视图维度管理 loading 计数，
 * 确保多个并发请求共享同一个遮罩。
 */

import { defineStore } from 'pinia';
import { find } from 'lodash';
import { nameIncreasePrefix } from '@/utils';

export const useMaskingStore = defineStore('masking', {
  getters: {
    /**
     * 是否显示遮罩提示
     *
     * @param {*} state
     * @param {object} state.views 视图集合
     * @param {string} state.activateView 当前激活视图
     * @returns {boolean}
     */
    isLoading: ({ views, activateView }) => {
      // ...
    },
  },
  state: () => ({
    views: [],
    loadingText: '',
    activateView: '',
  }),
  actions: {
    /**
     * 显示遮罩提示
     *
     * @param {object} opts
     * @param {string} opts.loadingText 提示文字
     * @param {string} opts.view 视图名称
     */
    loading({ loadingText, view }) {
      // ...
    },
  },
});
```

### 要点
- Store 顶部说明职责和设计意图。
- getter / action 的参数和返回值都写 JSDoc。
- state 字段名用 camelCase。

---

## 4. Vue 单文件组件头部

```vue
<!--
  index.vue — Provider 管理页面容器
  仅负责布局，业务逻辑已拆分到 officialKey.vue 和 thirdParty.vue
--><template>
  <div v-loading="maskingStore.isLoading" class="page-view">
    <!-- ... -->
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
- SFC 顶部用 HTML 注释说明页面职责。
- import 分组：Vue / 第三方库 / 内部路径，组内空行分隔。
- `<script setup>` 优先于 `<script>`。

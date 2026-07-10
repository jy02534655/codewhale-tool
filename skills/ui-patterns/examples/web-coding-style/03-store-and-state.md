# Web 编码风格示例 — Store 与全局状态

本文件汇总 `packages/web/src/stores/` 和 `packages/web/src/utils/Masking.js` 的状态管理写法。

---

## 1. Pinia Store 定义

```javascript
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
      const viewList = [activateView];
      const item = find(views, function (item) {
        return viewList.includes(item.view) && item.loadingCount > 0;
      });
      return !!item;
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
      this.loadingText = loadingText;
      this.countChange({ view });
    },
    /**
     * 隐藏遮罩提示
     *
     * @param {object} opts
     * @param {string} opts.view 视图名称
     * @param {number} [opts.nextTime] 延时关闭毫秒数，默认 100
     */
    clear({ view, nextTime }) {
      setTimeout(() => {
        this.countChange({ view, count: -1 });
      }, nextTime);
    },
    /**
     * 改变指定视图请求总数
     *
     * @param {object} opts
     * @param {number} [opts.count=1] 变化值
     * @param {string} opts.view 视图名称
     */
    countChange({ count = 1, view }) {
      if (!view) return;
      view = nameIncreasePrefix(view);
      const list = this.views;
      let item = find(list, { view });
      if (!item) {
        item = { view, loadingCount: 0 };
        list.push(item);
      }
      item.loadingCount += count;
    },
    /**
     * 设置当前激活视图名称
     *
     * @param {string} view 视图名称
     */
    changeActivate(view) {
      this.activateView = nameIncreasePrefix(view);
    },
    /**
     * 清空所有数据，关闭所有遮罩
     */
    init() {
      this.views = [];
    },
  },
});
```

### 要点
- Store 命名为 `useXxxStore`，导出命名常量。
- state 用工厂函数 `() => ({ ... })`。
- getter / action 的参数都写 JSDoc。
- 复杂逻辑内联注释说明意图。

---

## 2. Masking 工具封装

```javascript
/**
 * Masking 遮罩控制
 *
 * 封装 useMaskingStore，提供 loading / clear / clearAll 便捷方法。
 * store 延迟获取，确保 Pinia 已初始化。
 */

import { useMaskingStore } from '@/stores/masking';

function getStore() {
  return useMaskingStore();
}

export default {
  /**
   * 显示遮罩
   */
  loading(loading) {
    if (loading) {
      getStore().loading(loading);
    }
  },
  /**
   * 关闭遮罩
   */
  clear(loading) {
    if (loading) {
      getStore().clear(loading);
    }
  },
  /**
   * 关闭所有遮罩
   */
  clearAll() {
    getStore().init();
  },
};
```

### 要点
- 工具函数用默认导出，返回一个对象。
- `getStore()` 延迟获取，避免 Pinia 未初始化时报错。
- 方法内部先判断参数再调用 store，减少无效调用。

---

## 3. 在组件中使用 Store

```javascript
import { useMaskingStore } from '@/stores/masking'

const maskingStore = useMaskingStore()
maskingStore.loading()    // 显示全局 loading
maskingStore.unloading()  // 隐藏全局 loading
maskingStore.isLoading    // ref，用于 v-loading 指令
```

### 要点
- Store 在 `<script setup>` 顶部引入并实例化。
- 通过 `v-loading="maskingStore.isLoading"` 绑定全局 loading。

---

## 4. 状态命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| ref | camelCase | `list`、`isShow`、`submitting` |
| computed | camelCase | `formTitle`、`elLocale` |
| store 实例 | camelCase + Store | `maskingStore`、`shareStore` |
| Pinia state | camelCase | `views`、`activateView` |
| Pinia getter | camelCase | `isLoading` |

---

## 5. Masking 函数使用

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

### 要点
- `masking()` 是纯函数，直接传入敏感字符串即可。
- 默认展示前 5 位 + 掩码 + 后 4 位。
- 在 `el-table-column` 的 `#default` 插槽中使用。

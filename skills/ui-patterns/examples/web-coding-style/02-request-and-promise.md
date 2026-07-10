# Web 编码风格示例 — 请求层与 Promise

本文件汇总 `packages/web/src/utils/request.js` 的请求封装风格和 Promise 写法。

---

## 1. axios 实例与拦截器

```javascript
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { isString, isNumber, get } from 'lodash';
import masking from '@/utils/Masking';
import { isEmpty, getValueByData } from '@/utils';
import { t } from '@/i18n';

/**
 * 创建 axios 实例（标准超时 15s）
 */
const service = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

/**
 * 全局请求拦截：设置缓存控制
 */
service.interceptors.request.use((config) => {
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
    config.headers['Cache-Control'] = 'no-cache';
  }
  return config;
});
```

### 要点
- 实例命名为 `service`，避免与 `axios` 全局变量冲突。
- GET 请求自动追加 `_t` 时间戳防缓存。
- 统一超时 15s。

---

## 2. 核心请求函数

```javascript
/**
 * 核心请求函数
 *
 * @param {object} config axios 配置 { url, method, params, data }
 * @param {object} [opts] 选项
 * @param {string} [opts.rootProperty='data'] 数据根节点名称
 * @param {string} [opts.successProperty='success'] 成功标识字段
 * @param {string|number} [opts.successCode=true] 成功值
 * @param {string} [opts.messageProperty='message'] 提示消息字段
 * @param {boolean|string} [opts.successMessage=false] 成功消息
 * @param {boolean|string} [opts.errorMessage=true] 失败消息
 * @param {boolean|number} [opts.loading=true] 是否显示 loading 遮罩
 * @param {string} [opts.loadingText='加载中...'] loading 提示文字
 * @returns {Promise}
 */
function axiosRequest(
  config,
  {
    rootProperty = 'data',
    successProperty = 'success',
    successCode = true,
    messageProperty = 'message',
    successMessage = false,
    errorMessage = true,
    errorProperty = 'message',
    loading = true,
    loadingText = '加载中...',
  } = {}
) {
  let loadingData;
  if (loading) {
    let nextTime = 100;
    if (isNumber(loading) && loading > 0) {
      nextTime = loading;
    }
    loadingData = {
      loadingText,
      nextTime,
      view: DEFAULT_VIEW,
    };
    masking.loading(loadingData);
  }
  return service(config)
    .then((res) => {
      const data = res.data || {};
      const code = getValueByData(data, successProperty);
      let success = !isEmpty(code);
      if (success && !isEmpty(successCode)) {
        success = code.toString() === successCode.toString();
      }
      data.success = success;
      if (success) {
        processMessage(data, success, { messageProperty, successMessage, errorMessage, errorProperty });
        return getValueByData(data, rootProperty);
      }
      return Promise.reject(data);
    })
    .catch((error) => {
      const errData = error?.response?.data || error || {};
      if (!errData.message) errData.message = t('message.networkError');
      processMessage(errData, false, { messageProperty, successMessage, errorMessage, errorProperty });
      return Promise.reject(error);
    })
    .finally(() => {
      if (loadingData) {
        masking.clear(loadingData);
      }
    });
}
```

### 要点
- 使用 `.then().catch().finally()` 链式写法，不用 `async/await`。
- 成功时返回 `getValueByData(data, rootProperty)`，失败时 `Promise.reject(data)`。
- loading 由 masking store 统一管理，finally 中统一清理。
- `processMessage` 根据后端返回自动弹出 ElMessage。

---

## 3. 便捷导出

```javascript
/**
 * GET 方式提交数据（带错误处理）
 */
export function ajaxBack(url, params = {}, opts = {}) {
  return axiosRequest({ url, method: 'get', params }, opts);
}

/**
 * GET 方式提交数据（忽略 catch）
 */
export function ajax(url, params = {}, opts = {}) {
  return new Promise((resolve) => {
    ajaxBack(url, params, opts)
      .then((res) => resolve(res))
      .catch(() => {});
  });
}

/**
 * POST 方式提交数据（带错误处理）
 */
export function ajaxPostBack(url, params = {}, opts = {}) {
  return axiosRequest({ url, method: 'post', data: params }, opts);
}

/**
 * POST 方式提交数据（忽略 catch）
 */
export function ajaxPost(url, params = {}, opts = {}) {
  return new Promise((resolve) => {
    ajaxPostBack(url, params, opts)
      .then((res) => resolve(res))
      .catch(() => {});
  });
}
```

### 要点
- 每类请求都提供带错误处理和不带错误处理两个版本。
- 命名规则：`ajaxBack` / `ajaxPostBack` / `ajaxDeleteBack` / `ajaxPutBack` 带错误处理；`ajax` / `ajaxPost` / `ajaxDelete` / `ajaxPut` 忽略 catch。
- 参数默认值用 `= {}`，避免 `undefined` 判断。

---

## 4. API 文件对应路由前缀

```javascript
// packages/web/src/api/provider.js
export const getProviderList = () => ajaxGet('/api/provider/list')
export const addProvider = (data) => ajaxPost('/api/provider/add', data)
export const deleteProvider = (id) => ajaxDelete('/api/provider/' + id)
```

### 要点
- API 文件按路由前缀分组，一个文件对应一个路由前缀。
- 每个接口是一个命名导出函数，参数尽量扁平。
- URL 用字符串拼接，不用模板字符串，避免 `/` 转义问题。

---

## 5. Promise 调用风格

```javascript
// 链式调用
removeProxy(row.id).then(function () {
  loadList(true);
});

// 或
shareStore.getProxyList(isReLoad).then(function (result) {
  list.value = result.data || [];
});
```

### 要点
- 优先 `.then()` / `.catch()` 链式写法。
- 回调函数用 `function () {}` 而非箭头函数，保持 this 语义清晰。
- 简单场景可省略 catch，复杂错误处理显式 catch。

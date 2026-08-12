/**
 * axios 请求封装
 *
 * 参考 codewhale 标准封装模式，提供 ajax/ajaxBack/ajaxPost 等方法。
 * 自动判断成功/失败、提取数据根节点、处理 loading 遮罩和消息提示。
 * 全局注入 lang 参数用于服务端多语言。
 */

import axios from 'axios';
import { ElMessage } from 'element-plus';
import { isString, isNumber, get } from 'lodash-es';
import masking from '@/utils/Masking';
import { isEmpty, getValueByData } from '@/utils';
import { t } from '@/i18n';

/**
 * 创建 axios 实例（标准超时 15s）
 */
const service = axios.create({
  baseURL: '/api',
  timeout: 15000
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

/**
 * 处理接口返回的提示消息
 */
const processMessage = (data, success, { messageProperty, successMessage, errorMessage, errorProperty }) => {
  let mes = get(data, messageProperty);
  if (successMessage && success) {
    mes = isString(successMessage) ? t('message.' + successMessage) : mes;
  } else if (errorMessage && !success) {
    if (!mes) {
      mes = get(data, errorProperty);
    }
    mes = isString(errorMessage) ? t('message.' + errorMessage) : mes;
  } else {
    mes = '';
  }
  if (mes) {
    const type = success ? 'success' : 'warning';
    ElMessage({
      type,
      message: mes
    });
  }
};

const DEFAULT_VIEW = 'provider';

/**
 * 核心请求函数
 *
 * @param {object} config axios 配置 { url, method, params, data }
 * @param {object} [opts] 选项
 * @param {string} [opts.rootProperty='data'] 数据根节点名称
 * @param {string} [opts.messageProperty='message'] 提示消息字段
 * @param {boolean|string} [opts.successMessage=false] 成功消息
 * @param {boolean|string} [opts.errorMessage=true] 失败消息
 * @param {boolean|number} [opts.loading=true] 是否显示 loading 遮罩
 * @param {string} [opts.loadingText='加载中...'] loading 提示文字
 * @returns {Promise}
 */
const axiosRequest = (config, { rootProperty = 'data', successProperty = 'success', successCode = true, messageProperty = 'message', successMessage = false, strictSuccessCode = false, errorMessage = true, errorProperty = 'message', loading = true, loadingText = '加载中...' } = {}) => {
  let loadingData;
  if (loading) {
    let nextTime = 100;
    if (isNumber(loading) && loading > 0) {
      nextTime = loading;
    }
    loadingData = {
      loadingText,
      nextTime,
      view: DEFAULT_VIEW
    };
    masking.loading(loadingData);
  }
  return service(config)
    .then((res) => {
      const data = res.data || {};
      const code = getValueByData(data, successProperty);
      // eslint-disable-next-line no-useless-assignment
      let success = false;
      if (strictSuccessCode) {
        success = code === successCode;
      } else if (isEmpty(successCode)) {
        success = !isEmpty(code);
      } else {
        success = code === successCode;
        if (!success && !isEmpty(code)) {
          success = code.toString() == successCode.toString();
        }
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
};

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

/**
 * DELETE 方式提交数据（带错误处理）
 */
export function ajaxDeleteBack(url, params = {}, opts = {}) {
  return axiosRequest({ url, method: 'delete', data: params }, opts);
}

/**
 * DELETE 方式提交数据（忽略 catch）
 */
export function ajaxDelete(url, params = {}, opts = {}) {
  return new Promise((resolve) => {
    ajaxDeleteBack(url, params, opts)
      .then((res) => resolve(res))
      .catch(() => {});
  });
}

/**
 * PUT 方式提交数据（带错误处理）
 */
export function ajaxPutBack(url, params = {}, opts = {}) {
  return axiosRequest({ url, method: 'put', data: params }, opts);
}

/**
 * PUT 方式提交数据（忽略 catch）
 */
export function ajaxPut(url, params = {}, opts = {}) {
  return new Promise((resolve) => {
    ajaxPutBack(url, params, opts)
      .then((res) => resolve(res))
      .catch(() => {});
  });
}

/**
 * dataSession — 轻量级运行时状态存储
 *
 * 基于 sessionStorage 的键值存储，用于跨页面/组件传递临时数据。
 */

const STORAGE_KEY = 'codewhale-session';

/**
 * 获取当前存储对象
 * @returns {object}
 */
function _getStore() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function _setStore(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default {
  /**
   * 获取值
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return _getStore()[key];
  },

  /**
   * 设置值
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const store = _getStore();
    store[key] = value;
    _setStore(store);
  },

  /**
   * 删除值
   * @param {string} key
   */
  remove(key) {
    const store = _getStore();
    delete store[key];
    _setStore(store);
  },

  /**
   * 清空全部
   */
  clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

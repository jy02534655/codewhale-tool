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
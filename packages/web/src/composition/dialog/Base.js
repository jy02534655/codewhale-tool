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
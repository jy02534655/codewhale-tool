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
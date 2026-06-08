import { getCurrentInstance } from 'vue';
import { compositionViewForm } from '@/composition/view/Form';
import { compositionDialogBase } from '@/composition/dialog/Base';
import { cloneDeep } from 'lodash';

/**
 * compositionDialogForm — 弹窗表单操作
 *
 * 组合 compositionDialogBase 和 compositionViewForm，
 * 用于新增/编辑弹窗场景。
 * 弹窗关闭时自动调用 resetForm 重置表单。
 *
 * @param {object} [opts] 配置
 * @param {string} [opts.formName='form'] 表单 ref 名称
 * @param {Function} opts.addFun 新增方法
 * @param {Function} opts.editFun 编辑方法
 * @param {Function} [opts.initfun] 弹窗显示时的初始化回调
 * @returns {{ state, isEdit, isShow, showDialog, hideDialog, closeDialog, showDialogByData, submitForm, submitDialogForm, validateForm, validateFieldForm, resetForm }}
 */
export function compositionDialogForm({ formName = 'form', addFun, editFun, initfun } = {}) {
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
   * 关闭弹窗并重置表单
   */
  const closeDialog = () => {
    hideDialog();
    resetForm(formName);
  };

  /**
   * 提交表单数据，成功后关闭弹窗并发出 submitSuccess 事件
   * @param {*} params 表单参数
   * @returns {Promise}
   */
  const submitDialogForm = (params) => {
    const data = cloneDeep(params);
    return submitForm(params)
      .then(() => {
        closeDialog();
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
    closeDialog,
    showDialogByData,
    submitForm,
    submitDialogForm,
    validateForm,
    validateFieldForm,
    resetForm,
  };
}

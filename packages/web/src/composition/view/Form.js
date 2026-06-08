/**
 * compositionViewForm — 表单新增/编辑统一管理
 *
 * 组合 compositionFormBase 的表单验证方法，
 * 自动根据 state（0 新增 / 1 编辑）调用 addFun 或 editFun。
 */

import { ref, computed } from 'vue';
import { compositionFormBase } from '@/composition/form/Base';

/**
 * @param {object} opts
 * @param {string} [opts.formName='form'] 表单 ref 名称
 * @param {Function} opts.addFun 新增方法，接收 data 返回 Promise
 * @param {Function} opts.editFun 编辑方法，接收 data 返回 Promise
 * @returns {{ state, isEdit, validateForm, validateFieldForm, submitForm, resetForm }}
 */
export function compositionViewForm({ formName = 'form', addFun, editFun } = {}) {
  const { validateForm, validateFieldForm, resetForm } = compositionFormBase();

  // 状态：0 新增 / 1 编辑
  const state = ref(0);
  // 是否编辑状态
  const isEdit = computed(() => state.value === 1);

  /**
   * 校验并提交表单（根据编辑状态自动选择 addFun / editFun）
   * @param {*} params 提交的数据
   * @returns {Promise}
   */
  const submitForm = (params) => {
    const submitFun = isEdit.value ? editFun : addFun;
    return validateForm(formName).then(() => submitFun(params));
  };

  return {
    state,
    isEdit,
    validateForm,
    validateFieldForm,
    submitForm,
    resetForm,
  };
}

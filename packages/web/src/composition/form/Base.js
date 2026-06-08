import { getCurrentInstance } from 'vue';

/**
 * compositionFormBase — 表单基础操作
 *
 * 提供 validateForm / validateFieldForm / resetForm / clearValidate
 * 通过 ref 名称（默认 'form'）定位 el-form 组件实例。
 *
 * @returns {{ validateForm, validateFieldForm, resetForm, clearValidate }}
 */
export function compositionFormBase() {
  const vm = getCurrentInstance();

  /**
   * 验证整个表单
   * @param {string} [formName='form'] 表单 ref 名称
   * @returns {Promise<boolean>}
   */
  const validateForm = (formName = 'form') => {
    const form = vm.refs[formName];
    if (form) {
      return form.validate();
    }
    return Promise.reject(new Error('表单实例未找到'));
  };

  /**
   * 验证表单指定字段
   * @param {string|string[]} fields 字段名
   * @param {string} [formName='form'] 表单 ref 名称
   * @returns {Promise<boolean>}
   */
  const validateFieldForm = (fields, formName = 'form') => {
    return new Promise((resolve) => {
      const form = vm.refs[formName];
      let isValid = true;
      if (form) {
        form.validateField(fields, (v) => {
          if (v) isValid = false;
        });
      }
      resolve(isValid);
    });
  };

  /**
   * 重置表单
   * @param {string} [formName='form'] 表单 ref 名称
   */
  const resetForm = (formName = 'form') => {
    const form = vm.refs[formName];
    form && form.resetFields();
  };

  /**
   * 清除指定字段的验证状态
   * @param {string} [formName='form'] 表单 ref 名称
   * @param {string|string[]} [props] 字段名
   */
  const clearValidate = (formName = 'form', props) => {
    const form = vm.refs[formName];
    form && form.clearValidate(props);
  };

  return {
    validateForm,
    validateFieldForm,
    resetForm,
    clearValidate,
  };
}

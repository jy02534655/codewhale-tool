import { getCurrentInstance } from 'vue';

/**
 * 弹窗容器 - 父组件管理弹窗
 *
 * 在父组件中引入，通过 ref 控制子组件弹窗的显隐。
 *
 * @param {object} [opts] 配置
 * @returns {{ showAddDialog, showEditDialog }}
 */
export function compositionDialogContainer({ } = {}) {
  const vm = getCurrentInstance();

  const showDialog = (dialogName = 'dialogRef') => {
    vm.refs[dialogName].showDialog();
  };

  const hideDialog = (dialogName = 'dialogRef') => {
    vm.refs[dialogName].hideDialog();
  };

  const showDialogByData = (state, data, dialogName = 'dialogRef') => {
    vm.refs[dialogName].showDialogByData(state, data);
  };

  const showAddDialog = (data, dialogName = 'dialogRef') => {
    showDialogByData(0, data, dialogName);
  };

  const showEditDialog = (data, dialogName = 'dialogRef') => {
    showDialogByData(1, data, dialogName);
  };

  return { showDialog, hideDialog, showAddDialog, showEditDialog };
}
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

  function showDialog(dialogName = 'dialog') {
    vm.refs[dialogName].showDialog();
  }

  function hideDialog(dialogName = 'dialog') {
    vm.refs[dialogName].hideDialog();
  }

  function showDialogByData(state, data, dialogName = 'dialog') {
    vm.refs[dialogName].showDialogByData(state, data);
  }

  function showAddDialog(data, dialogName = 'dialog') {
    showDialogByData(0, data, dialogName);
  }

  function showEditDialog(data, dialogName = 'dialog') {
    showDialogByData(1, data, dialogName);
  }

  return { showDialog, hideDialog, showAddDialog, showEditDialog };
}
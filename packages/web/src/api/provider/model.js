// 模型相关 API 接口
import { ajaxPostBack } from '@/utils/request';

// 添加模型
export function addModel(data) {
  return ajaxPostBack('/provider/models/add', data, { successMessage: true });
}

// 删除模型
export function removeModel(data) {
  return ajaxPostBack('/provider/models/delete', data, { successMessage: true });
}

// 激活模型
export function setActiveModel(data) {
  return ajaxPostBack('/provider/models/activate', data, { successMessage: true });
}

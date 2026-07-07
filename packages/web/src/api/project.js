/**
 * 项目管理相关 API
 *
 * 每个项目有 id / alias / path / default。
 * 列表返回全部项目，默认项目优先。
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/** 获取所有项目列表 */
export function getProjectList() { return ajaxBack('/project/list'); }

/** 新增项目 */
export function addProject(data) {
  return ajaxPostBack('/project/add', data, { successMessage: true });
}

/** 更新项目 */
export function editProject(data) {
  return ajaxPutBack('/project/' + data.id, data, { successMessage: true });
}

/** 删除项目 */
export function removeProject(id) {
  return ajaxDeleteBack('/project/' + id, {}, { successMessage: true });
}

/** 设为默认项目 */
export function setDefaultProject(id) {
  return ajaxPutBack('/project/' + id + '/default', {}, { successMessage: true });
}

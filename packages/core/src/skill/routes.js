/**
 * Skill 路由查询模块
 * 提供列表、项目信息等只读查询能力
 */

import { ok } from '../utils/result.js';

/**
 * 获取全局已安装 skill 列表
 * @param {SkillStore} store
 */
export function listGlobal(store) {
  return ok(store.getGlobalInstalled());
}

/**
 * 获取项目已安装 skill 列表
 * @param {SkillStore} store
 */
export function listProject(store) {
  const list = store.getProjectInstalled();
  if (store.projectEngine) {
    const info = store.projectEngine.getProjectInfo();
    return ok(list.map(function (s) { return { ...s, project: info.name }; }));
  }
  return ok(list);
}

/**
 * 获取当前项目信息
 * @param {SkillStore} store
 */
export function getCurrentProject(store) {
  if (!store.projectEngine) {
    return ok({
      name: 'codewhale-tool',
      path: process.cwd(),
      installed: store.getProjectInstalled(),
    });
  }
  const info = store.projectEngine.getProjectInfo();
  return ok({
    name: info.name,
    path: info.path,
    installed: store.getProjectInstalled(),
  });
}
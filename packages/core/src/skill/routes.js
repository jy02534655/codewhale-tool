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
  return ok(store.getProjectInstalled());
}

/**
 * 获取当前项目信息
 * @param {SkillStore} store
 */
export function getCurrentProject(store) {
  const projectManager = store.engine.projectManager;
  if (!projectManager) {
    return ok({
      name: 'codewhale-tool',
      path: process.cwd(),
      installed: store.getProjectInstalled(),
    });
  }
  const projectResult = projectManager.list();
  const projects = projectResult.success ? projectResult.data : [];
  const project = projects.find(function (p) { return p.default; }) || projects[0];
  return ok({
    name: project?.alias || 'codewhale-tool',
    path: project?.path || process.cwd(),
    installed: store.getProjectInstalled(),
  });
}
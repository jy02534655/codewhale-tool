/**
 * Skill 路由查询模块
 * 提供列表、搜索、发现、项目信息等只读查询能力
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getServerMessage } from '../utils/i18n.js';
import { ok, fail } from '../utils/result.js';
import { _extractMeta } from './shared.js';

/**
 * 获取全局已安装 skill 列表
 * @param {SkillManager} self
 */
export function listGlobal(self) {
  return ok(self._getGlobalInstalled());
}

/**
 * 获取项目已安装 skill 列表
 * @param {SkillManager} self
 */
export function listProject(self) {
  const list = self._getProjectInstalled();
  if (self._projectEngine) {
    const info = self._projectEngine.getProjectInfo();
    return ok(list.map(function (s) { return { ...s, project: info.name }; }));
  }
  return ok(list);
}

/**
 * 获取当前项目信息
 * @param {SkillManager} self
 */
export function getCurrentProject(self) {
  if (!self._projectEngine) {
    return fail(getServerMessage('PROJECT_NOT_OPEN'));
  }
  const info = self._projectEngine.getProjectInfo();
  return ok({
    name: info.name,
    path: info.path,
    installed: self._getProjectInstalled(),
  });
}

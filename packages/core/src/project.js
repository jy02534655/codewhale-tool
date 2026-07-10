/**
 * @codewhale/core — ProjectManager
 *
 * 管理项目目录列表，每个项目有 id / alias / path / default。
 */

import { randomUUID } from 'node:crypto';
import { failMsg } from './utils/result.js';
import { Store } from './utils/store.js';

export class ProjectManager extends Store {
  /**
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    super(engine, engine.getProjects.bind(engine), engine.setProjects.bind(engine), 'project:');
  }

  /** @returns {{ success: boolean, data: import('../types.js').ProjectEntry[], message: string }} */
  list() {
    return super.list();
  }

  /**
   * 新增项目
   * @param {Partial<import('../types.js').ProjectEntry>} data
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  add(data) {
    return super.add(data, {
      validate: (input) => (!input.path ? failMsg('VALIDATION_ERROR') : null),
      build: (input) => ({
        id: this.makeId(randomUUID()),
        alias: input.alias || '',
        path: input.path || '',
        default: !!input.default,
      }),
    });
  }

  /**
   * 更新项目
   * @param {string} id
   * @param {Partial<import('../types.js').ProjectEntry>} data
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  update(id, data) {
    return super.update(id, data, 'PROJECT_NOT_FOUND');
  }

  /**
   * 删除项目
   * @param {string} id
   * @returns {{ success: boolean, data: { removed: boolean }, message: string }}
   */
  remove(id) {
    return super.remove(id, 'PROJECT_NOT_FOUND');
  }

  /**
   * 设为默认项目
   * @param {string} id
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  setDefault(id) {
    return super.setDefault(id, 'PROJECT_NOT_FOUND');
  }

  /** @returns {string|null} */
  getDefaultProjectId() {
    const projects = this._getter();
    if (!Array.isArray(projects) || projects.length === 0) return null;
    const defaultProject = projects.find((p) => p.default) || projects[0];
    return defaultProject.id || null;
  }

  /**
   * @param {string} path
   * @returns {string|null}
   */
  findProjectByPath(path) {
    const projects = this._getter();
    if (!Array.isArray(projects)) return null;
    return projects.find((p) => p.path && p.path.toLowerCase() === path.toLowerCase())?.id || null;
  }
}

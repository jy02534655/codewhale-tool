/**
 * @codewhale/core — ProjectManager
 *
 * 管理项目目录列表，每个项目有 id / alias / path / default。
 */

import { randomUUID } from 'node:crypto';
import { ok, failMsg } from './utils/result.js';

/**
 * @param {import('./utils/config.js').ConfigEngine} engine
 */
export class ProjectManager {
  /**
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  /** @returns {{ success: boolean, data: import('../types.js').ProjectEntry[], message: string }} */
  list() {
    return ok(this._engine.getProjects());
  }

  /**
   * @param {Partial<import('../types.js').ProjectEntry>} data
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  add(data) {
    if (!data.path) {
      return failMsg('VALIDATION_ERROR');
    }
    const projects = this._engine.getProjects();
    const entry = {
      id: 'project:' + randomUUID(),
      alias: data.alias || '',
      path: data.path || '',
      default: !!data.default,
    };
    projects.push(entry);
    this._engine.setProjects(projects);
    return ok(entry);
  }

  /**
   * @param {string} id
   * @param {Partial<import('../types.js').ProjectEntry>} data
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  update(id, data) {
    const projects = this._engine.getProjects();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return failMsg('PROJECT_NOT_FOUND');
    projects[idx] = Object.assign(projects[idx], data, { id });
    this._engine.setProjects(projects);
    return ok(projects[idx]);
  }

  /**
   * @param {string} id
   * @returns {{ success: boolean, data: { removed: boolean }, message: string }}
   */
  remove(id) {
    const projects = this._engine.getProjects();
    const next = projects.filter((p) => p.id !== id);
    if (next.length === projects.length) {
      return failMsg('PROJECT_NOT_FOUND');
    }
    this._engine.setProjects(next);
    return ok({ removed: true });
  }

  /**
   * @param {string} id
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  setDefault(id) {
    const projects = this._engine.getProjects();
    projects.forEach((p) => {
      p.default = p.id === id;
    });
    this._engine.setProjects(projects);
    const target = projects.find((p) => p.id === id);
    return ok(target || null);
  }
}

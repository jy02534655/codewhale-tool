/**
 * @codewhale/core — ProjectManager
 *
 * 管理项目目录列表，每个项目有 id / alias / path / default。
 *
 * 通俗理解：
 * 这里管理的“项目”，指的是你在 CodeWhale 中配置的工作目录。
 * 一个项目对应一个本地文件夹，你可以给它起个别名（alias），
 * 也可以把某个项目设为“默认项目”。这样在需要选择项目时，
 * 系统可以自动帮你选中常用项目，不用每次都手动挑选。
 *
 * ProjectManager 继承自 Store 基类，所以它直接拥有了
 * 新增、更新、删除、设为默认、列表这些通用能力，
 * 这里只需要告诉它“数据怎么存、id 怎么生成、怎么校验”。
 */

import { randomUUID } from 'node:crypto';
import { failMsg } from './utils/result.js';
import { Store } from './utils/store.js';

export class ProjectManager extends Store {
  /**
   * 创建项目管理器实例
   *
   * 通过继承 Store，把底层存储细节封装起来。
   * 这里只需要传入 4 个东西：
   * - engine：配置引擎，负责读写 store.json
   * - getter：读取项目列表的函数
   * - setter：写入项目列表的函数
   * - idPrefix：项目 id 的前缀，保证 id 唯一且易识别
   *
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    super(engine, engine.getProjects.bind(engine), engine.setProjects.bind(engine), 'project:');
  }

  /**
   * 列出所有项目
   *
   * 直接复用 Store 基类的 list 方法，返回全部项目列表。
   * 目前不需要脱敏，所以不传 maskFn。
   *
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry[], message: string }}
   */
  list() {
    return super.list();
  }

  /**
   * 新增项目
   *
   * 把用户输入的项目信息保存到 store.json 中。
   * 每个项目会自动生成一个带前缀的唯一 id。
   *
   * 校验规则：
   * - path（项目路径）为必填项，否则返回校验错误
   *
   * 默认值处理：
   * - alias 默认为空字符串
   * - path 默认为空字符串（虽然校验要求必填，但 build 里保留兜底）
   * - default 默认为 false
   *
   * @param {Partial<import('../types.js').ProjectEntry>} data 用户输入的项目信息
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  add(data) {
    return super.add(data, {
      validate: (input) => (!input.path ? failMsg('validationError') : null),
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
   *
   * 根据项目 id 更新其属性。可以修改 alias、path、default 等字段。
   *
   * @param {string} id 要更新的项目 id
   * @param {Partial<import('../types.js').ProjectEntry>} data 要更新的字段
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  update(id, data) {
    return super.update(id, data, 'projectNotFound');
  }

  /**
   * 删除项目
   *
   * 根据项目 id 从列表中移除该项目。
   *
   * @param {string} id 要删除的项目 id
   * @returns {{ success: boolean, data: { removed: boolean }, message: string }}
   */
  remove(id) {
    return super.remove(id, 'projectNotFound');
  }

  /**
   * 设为默认项目
   *
   * 将指定项目标记为默认项目。同一时间只能有一个默认项目。
   * 设为默认后，其他项目的 default 会被自动取消。
   *
   * @param {string} id 要设为默认的项目 id
   * @returns {{ success: boolean, data: import('../types.js').ProjectEntry, message: string }}
   */
  setDefault(id) {
    return super.setDefault(id, 'projectNotFound');
  }

  /**
   * 获取默认项目的 id
   *
   * 查找逻辑：
   * 1. 优先查找 default = true 的项目
   * 2. 如果没有标记为默认的项目，则返回第一个项目
   * 3. 如果项目列表为空，返回 null
   *
   * @returns {string|null} 默认项目 id，没有则返回 null
   */
  getDefaultProjectId() {
    const projects = this._getter();
    if (!Array.isArray(projects) || projects.length === 0) return null;
    const defaultProject = projects.find((p) => p.default) || projects[0];
    return defaultProject.id || null;
  }

  /**
   * 根据路径查找项目 id
   *
   * 给定一个本地路径，查找是否已有项目配置了该路径。
   * 比较时不区分大小写，避免 Windows 路径大小写问题。
   *
   * @param {string} path 要查找的项目路径
   * @returns {string|null} 匹配的项目 id，没有则返回 null
   */
  findProjectByPath(path) {
    const projects = this._getter();
    if (!Array.isArray(projects)) return null;
    return projects.find((p) => p.path && p.path.toLowerCase() === path.toLowerCase())?.id || null;
  }
}

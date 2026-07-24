/**
 * TokenManager — GitHub Token 配置管理器
 *
 * 管理 store.json 中的 GitHub Token 列表，带 alias 别名。
 * 每个 TokenEntry 有 id / alias / token。
 * 列表返回时 token 已掩码，仅在请求内部查找时获取明文。
 *
 * @module token
 */

import { randomUUID } from 'node:crypto';
import { failMsg } from './utils/result.js';
import { Store } from './utils/store.js';

/**
 * @typedef {import('./types.js').TokenEntry} TokenEntry
 */

export class TokenManager extends Store {
  /**
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    super(engine, () => engine.get('tokens'), (items) => engine.set('tokens', items), 'token:');
  }

  /**
   * 列出所有 token（token 已掩码）
   * @returns {{success: boolean, data: TokenEntry[]}}
   */
  list() {
    return super.list((entry) => ({
      ...entry,
      token: entry.token ? maskToken(entry.token) : '',
    }));
  }

  /**
   * 新增 token
   * @param {{alias: string, token: string}} input
   * @returns {{success: boolean, data: TokenEntry, message?: string}}
   */
  add(input) {
    return super.add(input, {
      validate: (i) => (!i.alias || !i.token ? failMsg('validationError') : null),
      build: (i, items) => ({
        id: this.makeId(randomUUID()),
        alias: i.alias,
        default: items.length === 0,
        token: i.token,
      }),
    });
  }

  /**
   * 更新 token
   * @param {string} id
   * @param {{alias?: string, token?: string}} updates
   * @returns {{success: boolean, data?: TokenEntry, message?: string, errorCode?: string}}
   */
  update(id, updates) {
    return super.update(id, updates, 'tokenNotFound');
  }

  /**
   * 删除 token
   * @param {string} id
   * @returns {{success: boolean, message?: string}}
   */
  remove(id) {
    return super.remove(id, 'tokenNotFound');
  }

  /**
   * 根据 ID 查找 token（明文）
   * @param {string} id
   * @returns {TokenEntry|undefined}
   */
  find(id) {
    return this._engine.find('tokens', t => t.id === id);
  }

  /**
   * 设为默认 Token
   * @param {string} id
   * @returns {{success: boolean, data?: TokenEntry, message?: string, errorCode?: string}}
   */
  setDefault(id) {
    return super.setDefault(id, 'tokenNotFound');
  }

  /**
   * 获取默认 Token
   * @returns {TokenEntry|undefined}
   */
  getDefault() {
    return this._engine.get('tokens').find((t) => t.default);
  }
}

/**
 * 掩码 token — 只显示前 4 位 + ****
 * @param {string} token
 * @returns {string}
 */
function maskToken(token) {
  if (!token || token.length < 8) return '****';
  return token.slice(0, 4) + '****';
}

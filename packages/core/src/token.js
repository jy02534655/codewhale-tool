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
import { ok } from './result.js';
import { failMsg } from './i18n.js';

/**
 * @typedef {import('./types.js').TokenEntry} TokenEntry
 */

export class TokenManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  /**
   * 列出所有 token（token 已掩码）
   * @returns {{success: boolean, data: TokenEntry[]}}
   */
  list() {
    const tokens = this._engine.getTokens();
    return ok(tokens.map((t) => ({
      ...t,
      token: t.token ? maskToken(t.token) : '',
    })));
  }

  /**
   * 新增 token
   * @param {{alias: string, token: string}} input
   * @returns {{success: boolean, data: TokenEntry, message?: string}}
   */
  add(input) {
    if (!input.alias || !input.token) {
      return failMsg('VALIDATION_ERROR');
    }
    const entry = {
      id: `token:${randomUUID()}`,
      alias: input.alias,
      default: this._engine.getTokens().length === 0,
      token: input.token,
    };
    this._engine.setTokens([...this._engine.getTokens(), entry]);
    return ok(entry);
  }

  /**
   * 更新 token
   * @param {string} id
   * @param {{alias?: string, token?: string}} updates
   * @returns {{success: boolean, data?: TokenEntry, message?: string, errorCode?: string}}
   */
  update(id, updates) {
    const tokens = this._engine.getTokens();
    const idx = tokens.findIndex((t) => t.id === id);
    if (idx === -1) return failMsg('TOKEN_NOT_FOUND');

    const { id: _id, ...safe } = updates;
    tokens[idx] = { ...tokens[idx], ...safe };
    this._engine.setTokens(tokens);
    return ok(tokens[idx]);
  }

  /**
   * 删除 token
   * @param {string} id
   * @returns {{success: boolean, message?: string}}
   */
  remove(id) {
    const tokens = this._engine.getTokens();
    const filtered = tokens.filter((t) => t.id !== id);
    if (filtered.length === tokens.length) return failMsg('TOKEN_NOT_FOUND');
    this._engine.setTokens(filtered);
    return ok({ removed: true });
  }

  /**
   * 根据 ID 查找 token（明文）
   * @param {string} id
   * @returns {TokenEntry|undefined}
   */
  find(id) {
    return this._engine.findToken(id);
  }

  /**
   * 设为默认 Token
   * @param {string} id
   * @returns {{success: boolean, data?: TokenEntry, message?: string, errorCode?: string}}
   */
  setDefault(id) {
    const tokens = this._engine.getTokens();
    const idx = tokens.findIndex((t) => t.id === id);
    if (idx === -1) return failMsg('TOKEN_NOT_FOUND');
    tokens.forEach((t) => (t.default = t.id === id));
    this._engine.setTokens(tokens);
    return ok(tokens[idx]);
  }

  /**
   * 获取默认 Token
   * @returns {TokenEntry|undefined}
   */
  getDefault() {
    return this._engine.getTokens().find((t) => t.default);
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
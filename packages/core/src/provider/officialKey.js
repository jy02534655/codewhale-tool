/**
 * @module provider/officialKey
 */

import { ok, okMsg, failMsg } from '../utils/result.js';
import { Store } from '../utils/store.js';

/** 掩码显示 API key（前5位 + ... + 后4位） */
export function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

// ════════════════════════════════════════════════════════════════
// OfficialKeyManager — 官方 API key 管理
// ════════════════════════════════════════════════════════════════

/**
 * 官方 API key 管理
 *
 * @module OfficialKeyManager
 */
export class OfficialKeyManager {
  /**
   * @param {import('../utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
    // 组合通用 Store，复用 add/update 的校验、构建与 message 返回逻辑
    this._store = new Store(
      engine,
      () => this._engine.getOfficialKeys(),
      (keys) => this._engine.setOfficialKeys(keys),
      'official:'
    );
  }

  /** @returns {{success: boolean, data: import('../types.js').OfficialKeyEntry[], message: string}} */
  list() {
    return ok(this._engine.getOfficialKeys().map((k) => ({
      ...k,
      api_key_preview: maskKey(k.api_key),
    })));
  }

  /** @returns {{success: boolean, data: import('../types.js').OfficialKeyEntry|null, message: string}} */
  getActive() {
    return ok(this._engine.getOfficialKeys().find((k) => k.active) || null);
  }

  /**
   * 查找 key 并执行回调，自动处理查找失败和 set
   * @param {string} id
   * @param {(keys: Array, idx: number, k: object, locale: string) => any} fn
   * @private
   */
  _mutateKey(id, fn) {
    const keys = this._engine.getOfficialKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) return failMsg('keyNotFound');
    const result = fn(keys, idx, keys[idx]);
    this._engine.setOfficialKeys(keys);
    return result;
  }

  /**
   * 添加官方 key
   * @param {object} opts
   * @param {string} [opts.alias]
   * @param {string} opts.api_key
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  add({ alias, api_key } = {}) {
    // 委托给通用 Store，复用 validate/build/okMsg 流程
    return this._store.add(
      { alias, api_key },
      {
        validate: (input) => {
          if (!input.api_key) return failMsg('keyRequired');
          const keys = this._engine.getOfficialKeys();
          if (keys.some((k) => k.id === 'official:' + input.api_key)) {
            return failMsg('keyDuplicate');
          }
          return null;
        },
        build: (input, existing) => ({
          id: 'official:' + input.api_key,
          alias: input.alias || '默认',
          api_key: input.api_key,
          active: existing.length === 0,
        }),
      }
    );
  }

  /**
   * 激活指定官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activate(id) {
    return this._mutateKey(id, (keys) => {
      keys.forEach((kk) => (kk.active = kk.id === id));
      return okMsg('activated');
    });
  }

  /**
   * 更新别名
   * @param {{id: string, alias: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias({ id, alias }) {
    // 委托给通用 Store.update，复用 not-found 处理与 okMsg
    return this._store.update(id, { alias }, 'keyNotFound', undefined, 'aliasUpdated');
  }

  /**
   * 删除官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(id) {
    return this._mutateKey(id, (keys, idx, k) => {
      const wasActive = k.active;
      keys.splice(idx, 1);
      if (wasActive && keys.length > 0) keys[0].active = true;
      return okMsg('deleted');
    });
  }
}

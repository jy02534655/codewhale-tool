/**
 * proxy-manager.js — 代理配置管理器
 *
 * 管理 store.json 中的 proxy 配置列表，带 alias 别名。
 * 每个 ProxyEntry 有 id / alias / type(http|socks5) / host / port / [auth]。
 *
 * @module proxy-manager
 */

import { randomUUID } from 'node:crypto';
import { ok, fail } from './result.js';

/**
 * @typedef {import('./types.js').ProxyEntry} ProxyEntry
 */

export class ProxyManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  /**
   * 列出所有代理（密码已掩码）
   * @returns {{success: boolean, data: ProxyEntry[]}}
   */
  list() {
    const proxies = this._engine.getProxies();
    return ok(proxies.map((p) => ({
      ...p,
      auth: p.auth ? { ...p.auth, password: p.auth.password ? '******' : '' } : undefined,
    })));
  }

  /**
   * 新增代理
   * @param {{alias: string, type: 'http'|'socks5', host: string, port: number, auth?: {username?: string, password?: string}}} input
   * @returns {{success: boolean, data: ProxyEntry, message?: string}}
   */
  add(input) {
    if (!input.alias || !input.type || !input.host || !input.port) {
      return fail('alias/type/host/port 为必填项', 'VALIDATION_ERROR');
    }
    const entry = {
      id: `proxy:${randomUUID()}`,
      alias: input.alias,
      type: input.type,
      host: input.host,
      port: input.port,
      auth: input.auth && (input.auth.username || input.auth.password) ? input.auth : undefined,
    };
    this._engine.setProxies([...this._engine.getProxies(), entry]);
    return ok(entry);
  }

  /**
   * 更新代理
   * @param {string} id
   * @param {Partial<ProxyEntry>} updates
   * @returns {{success: boolean, data?: ProxyEntry, message?: string, errorCode?: string}}
   */
  update(id, updates) {
    const proxies = this._engine.getProxies();
    const idx = proxies.findIndex((p) => p.id === id);
    if (idx === -1) return fail('代理未找到', 'NOT_FOUND');

    // 不允许修改 id
    const { id: _id, ...safe } = updates;
    proxies[idx] = { ...proxies[idx], ...safe };
    if (proxies[idx].auth && !proxies[idx].auth.username && !proxies[idx].auth.password) {
      delete proxies[idx].auth;
    }
    this._engine.setProxies(proxies);
    return ok(proxies[idx]);
  }

  /**
   * 删除代理
   * @param {string} id
   * @returns {{success: boolean, message?: string}}
   */
  remove(id) {
    const proxies = this._engine.getProxies();
    const filtered = proxies.filter((p) => p.id !== id);
    if (filtered.length === proxies.length) return fail('代理未找到', 'NOT_FOUND');
    this._engine.setProxies(filtered);
    return ok({ removed: true });
  }

  /**
   * 根据 ID 查找代理（原始数据，含密码明文）
   * @param {string} id
   * @returns {ProxyEntry|undefined}
   */
  find(id) {
    return this._engine.findProxy(id);
  }

  /**
   * 设为默认代理
   * @param {string} id
   * @returns {{success: boolean, data?: ProxyEntry, message?: string, errorCode?: string}}
   */
  setDefault(id) {
    const proxies = this._engine.getProxies();
    const idx = proxies.findIndex((p) => p.id === id);
    if (idx === -1) return fail('代理未找到', 'NOT_FOUND');
    proxies.forEach((p) => (p.default = p.id === id));
    this._engine.setProxies(proxies);
    return ok(proxies[idx]);
  }

  /**
   * 获取默认代理
   * @returns {ProxyEntry|undefined}
   */
  getDefault() {
    return this._engine.getProxies().find((p) => p.default);
  }
}
/**
 * ProxyManager — 代理配置管理器
 *
 * 管理 store.json 中的 proxy 配置列表，带 alias 别名。
 * 每个 ProxyEntry 有 id / alias / type(http|socks5) / host / port / [auth]。
 *
 * @module proxy
 */

import { randomUUID } from 'node:crypto';
import { failMsg } from './utils/result.js';
import { Store } from './utils/store.js';

/**
 * @typedef {import('./types.js').ProxyEntry} ProxyEntry
 */

export class ProxyManager extends Store {
  /**
   * @param {import('./utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    super(engine, engine.getProxies.bind(engine), engine.setProxies.bind(engine), 'proxy:');
  }

  /**
   * 列出所有代理（密码已掩码）
   * @returns {{success: boolean, data: ProxyEntry[]}}
   */
  list() {
    return super.list((p) => ({
      ...p,
      auth: p.auth ? { ...p.auth, password: p.auth.password ? '******' : '' } : undefined,
    }));
  }

  /**
   * 新增代理
   * @param {{alias: string, type: 'http'|'socks5', host: string, port: number, auth?: {username?: string, password?: string}}} input
   * @returns {{success: boolean, data: ProxyEntry, message?: string}}
   */
  add(input) {
    return super.add(input, {
      validate: (i) => (!i.alias || !i.type || !i.host || !i.port ? failMsg('validationError') : null),
      build: (i, items) => ({
        id: this.makeId(randomUUID()),
        alias: i.alias,
        default: items.length === 0,
        type: i.type,
        host: i.host,
        port: i.port,
        auth: i.auth && (i.auth.username || i.auth.password) ? i.auth : undefined,
      }),
    });
  }

  /**
   * 更新代理
   * @param {string} id
   * @param {Partial<ProxyEntry>} updates
   * @returns {{success: boolean, data?: ProxyEntry, message?: string, errorCode?: string}}
   */
  update(id, updates) {
    return super.update(id, updates, 'proxyNotFound', (entry) => {
      if (entry.auth && !entry.auth.username && !entry.auth.password) {
        delete entry.auth;
      }
    });
  }

  /**
   * 删除代理
   * @param {string} id
   * @returns {{success: boolean, message?: string}}
   */
  remove(id) {
    return super.remove(id, 'proxyNotFound');
  }

  /**
   * 设为默认代理
   * @param {string} id
   * @returns {{success: boolean, data?: ProxyEntry, message?: string, errorCode?: string}}
   */
  setDefault(id) {
    return super.setDefault(id, 'proxyNotFound');
  }
}

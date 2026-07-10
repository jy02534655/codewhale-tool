/**
 * 通用列表管理器基类
 *
 * 抽取 project / proxy / token 等模块的增删改查 + 设为默认共性逻辑。
 * 子类只需提供：存储访问器、id 前缀、校验/构建/掩码等差异片段。
 */

import { ok, okMsg, failMsg } from './result.js';

export class Store {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   * @param {() => any[]} getter
   * @param {(list: any[]) => void} setter
   * @param {string} idPrefix
   */
  constructor(engine, getter, setter, idPrefix) {
    this._engine = engine;
    this._getter = getter;
    this._setter = setter;
    this._idPrefix = idPrefix;
  }

  /**
   * 列出所有条目
   * @param {(item: any) => any} [maskFn]
   */
  list(maskFn) {
    const items = this._getter();
    if (!maskFn) return ok(items);
    return ok(items.map(maskFn));
  }

  /**
   * 新增条目
   * @param {any} input
   * @param {{
   *   validate?: (input: any) => { success: boolean; message?: string; errorCode?: string } | null,
   *   build: (input: any, existing: any[]) => any
   * }} opts
   * @param {string} [messageKey='added']
   */
  add(input, { validate, build }, messageKey = 'added') {
    if (validate) {
      const err = validate(input);
      if (err && !err.success) return err;
    }
    const items = this._getter();
    const entry = build(input, items);
    this._setter([...items, entry]);
    return okMsg(messageKey, entry);
  }

  /**
   * 更新条目
   * @param {string} id
   * @param {Partial<any>} updates
   * @param {string} [notFoundCode='NOT_FOUND']
   * @param {(entry: any) => void} [sanitize]
   * @param {string} [messageKey='updated']
   */
  update(id, updates, notFoundCode = 'NOT_FOUND', sanitize, messageKey = 'updated') {
    const items = this._getter();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return failMsg(notFoundCode);

    // 不允许修改 id
    // eslint-disable-next-line no-unused-vars
    const { id: _id, ...safe } = updates;
    items[idx] = { ...items[idx], ...safe };
    if (sanitize) sanitize(items[idx]);
    this._setter(items);
    return okMsg(messageKey, items[idx]);
  }

  /**
   * 删除条目
   * @param {string} id
   * @param {string} [notFoundCode='NOT_FOUND']
   * @param {string} [messageKey='deleted']
   */
  remove(id, notFoundCode = 'NOT_FOUND', messageKey = 'deleted') {
    const items = this._getter();
    const next = items.filter((i) => i.id !== id);
    if (next.length === items.length) return failMsg(notFoundCode);
    this._setter(next);
    return okMsg(messageKey, { removed: true });
  }

  /**
   * 设为默认
   * @param {string} id
   * @param {string} [notFoundCode='NOT_FOUND']
   * @param {string} [messageKey='defaultSet']
   */
  setDefault(id, notFoundCode = 'NOT_FOUND', messageKey = 'defaultSet') {
    const items = this._getter();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return failMsg(notFoundCode);
    items.forEach((i) => (i.default = i.id === id));
    this._setter(items);
    return okMsg(messageKey, items[idx]);
  }

  /** @param {string} raw */
  makeId(raw) {
    return this._idPrefix + raw;
  }
}

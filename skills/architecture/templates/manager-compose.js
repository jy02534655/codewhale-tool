import { okMsg, failMsg } from '../../utils/result.js';
import { Store } from '../../utils/store.js';

export class XxxManager {
  /**
   * @param {import('../../utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
    this._store = new Store(
      engine,
      () => this._engine.getXxxs(),
      (items) => this._engine.setXxxs(items),
      'xxx:'
    );
  }

  list() {
    return this._store.list();
  }

  add(input) {
    return this._store.add(input, {
      validate: (i) => (!i.key ? failMsg('validationError') : null),
      build: (i, items) => ({
        id: this.makeId(i.key),
        key: i.key,
        active: items.length === 0,
      }),
    });
  }

  activate(id) {
    return this._mutateXxx(id, (items) => {
      items.forEach((x) => (x.active = x.id === id));
      return okMsg('activated');
    });
  }

  remove(id) {
    return this._mutateXxx(id, (items, idx) => {
      const wasActive = items[idx].active;
      items.splice(idx, 1);
      if (wasActive && items.length > 0) items[0].active = true;
      return okMsg('deleted');
    });
  }

  /**
   * @param {string} id
   * @param {(items: Array, idx: number, item: object) => any} fn
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  _mutateXxx(id, fn) {
    const items = this._engine.getXxxs();
    const idx = items.findIndex((x) => x.id === id);
    if (idx === -1) return failMsg('xxxNotFound');
    const result = fn(items, idx, items[idx]);
    this._engine.setXxxs(items);
    return result;
  }
}

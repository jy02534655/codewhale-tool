import { ok, okMsg, failMsg } from '../../utils/result.js';

export class XxxManager {
  /**
   * @param {import('../../utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  listXxxs() {
    return ok(this._engine.getXxxs().map((x) => ({ ...x })));
  }

  /**
   * @param {string} id
   * @param {(all: Array, idx: number, item: object) => any} fn
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  _mutateXxx(id, fn) {
    const all = this._engine.getXxxs();
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return failMsg('xxxNotFound');
    const result = fn(all, idx, all[idx]);
    this._engine.setXxxs(all);
    return result;
  }

  addXxx() {
    // 手动校验、构建、写回
  }

  activateXxx(id) {
    return this._mutateXxx(id, (all, idx, item) => {
      all.forEach((x) => (x.active = x.id === id));
      if (item.models?.length) item.models[0].active = true;
      return okMsg('activated');
    });
  }
}

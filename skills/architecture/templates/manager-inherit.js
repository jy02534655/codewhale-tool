import { randomUUID } from 'node:crypto';
import { failMsg } from '../../utils/result.js';
import { Store } from '../../utils/store.js';

export class XxxManager extends Store {
  /**
   * @param {import('../../utils/config.js').ConfigEngine} engine
   */
  constructor(engine) {
    super(engine, engine.getXxxs.bind(engine), engine.setXxxs.bind(engine), 'xxx:');
  }

  list() {
    return super.list((item) => ({ ...item }));
  }

  add(input) {
    return super.add(input, {
      validate: (i) => (!i.name ? failMsg('validationError') : null),
      build: (i) => ({
        id: this.makeId(randomUUID()),
        name: i.name,
        default: false,
      }),
    });
  }

  update(id, data) {
    return super.update(id, data, 'xxxNotFound');
  }

  remove(id) {
    return super.remove(id, 'xxxNotFound');
  }

  setDefault(id) {
    return super.setDefault(id, 'xxxNotFound');
  }
}

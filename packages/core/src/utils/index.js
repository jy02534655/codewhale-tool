import { pickBy, isNumber, isEmpty as lodashIsEmpty, isBoolean, isDate, isFunction } from 'lodash-es';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function isEmpty(v) {
  if (isNumber(v) || isBoolean(v) || isDate(v) || isFunction(v)) {
    return false;
  }
  return lodashIsEmpty(v);
}

export function clearObject(o) {
  return pickBy(o, (item) => !isEmpty(item));
}

/**
 * 获取 CodeWhale 配置文件路径
 * @returns {string} ~/.codewhale/config.toml 的绝对路径
 */
export function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}
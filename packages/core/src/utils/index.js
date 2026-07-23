import { pickBy, isNumber, isEmpty as lodashIsEmpty, isBoolean, isDate, isFunction } from 'lodash-es';

export function isEmpty(v) {
  if (isNumber(v) || isBoolean(v) || isDate(v) || isFunction(v)) {
    return false;
  }
  return lodashIsEmpty(v);
}

export function clearObject(o) {
  return pickBy(o, (item) => !isEmpty(item));
}
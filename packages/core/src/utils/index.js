import pkg from 'lodash';
const { pickBy, isNumber, isEmpty: lodashIsEmpty, isBoolean, isDate, isFunction } = pkg;

export function isEmpty(v) {
  if (isNumber(v) || isBoolean(v) || isDate(v) || isFunction(v)) {
    return false;
  }
  return lodashIsEmpty(v);
}

export function clearObject(o) {
  return pickBy(o, (item) => !isEmpty(item));
}

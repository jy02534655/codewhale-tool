// lodash 作为 CommonJS 模块，在 ESM 中需通过默认导入解构，避免个别 named export 缺失报错
import { isNumber, isEmpty as lodashIsEmpty, isBoolean, isDate, isFunction, get, pickBy } from 'lodash-es';

/**
 * 判断是否为空对象、空字符串、null
 * {}、[]、''、null 会返回 true
 * 数字、布尔、时间、方法不算空
 *
 * @param {*} v 要判断的值
 * @returns {boolean}
 */
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
 * 返回数据对象中给定名称属性的值
 * 如果未提供名称，则返回数据对象本身
 *
 * @param {object} data 数据对象
 * @param {string} [name] 属性名，支持点号路径
 * @returns {*} 属性值或整个数据对象
 */
export function getValueByData(data, name) {
  return name ? get(data, name) : data;
}

/**
 * 传入的字符串只保留字母和数字
 *
 * @param {string} name 字符串
 * @returns {string} 处理后的字符串
 */
export function nameIncreasePrefix(name) {
  if (name) {
    name = name.replace(/\W|_/g, '').toLowerCase();
  }
  return name;
}
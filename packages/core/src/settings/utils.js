// 通用嵌套操作工具 + 基于 lodash 的清理/比较工具
// lodash 作为 CommonJS 模块，在 ESM 中需通过默认导入解构，避免个别 named export 缺失报错
import pkg from 'lodash';
const { isEqual, get, set, unset } = pkg;
import { clearObject } from '../utils/index.js';

// ---------- 嵌套读写删 ----------

/**
 * 根据点分隔的路径从对象中读取嵌套值
 * @param {Object} obj - 源对象
 * @param {string} path - 点分隔的路径，如 'tui.locale'
 * @returns {*} 路径对应的值，不存在时返回 undefined
 */
// 嵌套操作已统一使用 lodash get/set/unset，删掉冗余包装函数

// ---------- Schema 驱动的读写工具 ----------

/**
 * 根据 SCHEMA 从 TOML 对象中读取通用设置
 * @param {Object} tomlObj - 解析后的 TOML 配置对象
 * @param {Array} schema - SCHEMA 数组
 * @returns {Object} 平铺的通用设置对象
 */
export function readFromTomlBySchema(tomlObj, schema) {
  const result = {};
  for (const field of schema) {
    const val = get(tomlObj, field.path);
    // field.default 为 undefined 时（如字段已从 SCHEMA 移除），保留 undefined
    result[field.key] = val !== undefined ? val : field.default;
  }
  return result;
}

/**
 * 根据 SCHEMA 将前端数据写回 TOML 对象
 * 智能写入策略：值与默认值相等则删除字段，不相等则写入，使配置文件极简
 * @param {Object} data - 前端提交的平铺设置数据
 * @param {Object} tomlObj - 当前 TOML 配置对象（会被直接修改）
 * @param {Array} schema - SCHEMA 数组
 */
export function applyToTomlBySchema(data, tomlObj, schema) {
  for (const field of schema) {
    const value = data[field.key];
    if (value === undefined) continue;
    // 使用 isEqual 深比较是否等于默认值，避免 JSON.stringify 的语义边界问题
    if (isEqual(value, field.default)) {
      unset(tomlObj, field.path);
    } else {
      set(tomlObj, field.path, value);
    }
  }
  // 清理整个配置的空对象 / 空数组 / null / undefined
  clearObject(tomlObj);
}

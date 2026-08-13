// 通用嵌套操作工具 + 基于 lodash 的清理/比较工具
// lodash 作为 CommonJS 模块，在 ESM 中需通过默认导入解构，避免个别 named export 缺失报错
import { get, set, unset } from 'lodash-es';

// ---------- 嵌套读写删 ----------

/**
 * 根据 SCHEMA 从 TOML 对象中读取通用设置
 * 注意：此函数仅用于 config.toml（嵌套路径），settings.toml 必须使用方括号直接访问平铺键名
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
 * 写入策略：直接写入所有值，不做智能精简；null 表示显式删除
 * @param {Object} data - 前端提交的平铺设置数据
 * @param {Object} tomlObj - 当前 TOML 配置对象（会被直接修改）
 * @param {Array} schema - SCHEMA 数组
 */
export function applyToTomlBySchema(data, tomlObj, schema) {
  for (const field of schema) {
    const value = data[field.key];
    if (value === undefined) continue;
    if (value === null) {
      unset(tomlObj, field.path);
    } else {
      set(tomlObj, field.path, value);
    }
  }
}

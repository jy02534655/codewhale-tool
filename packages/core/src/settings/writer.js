/**
 * CodeWhale 通用设置写入器
 *
 * 将前端平铺结构写回 ~/.codewhale/config.toml。
 * 使用 Schema 驱动写入，仅处理 SCHEMA 中的字段，其他字段原样保留。
 * 通过 io.js 统一 I/O。
 */

import { SCHEMA } from './schema.js';
import { applyToTomlBySchema } from './utils.js';
import { isEmpty } from '../utils/index.js';
import { readConfig, writeConfig } from './io.js';
import { cloneDeep } from 'lodash-es';

/**
 * 将通用设置写入 CodeWhale config.toml
 * 智能写入策略：值与默认值相等则删除字段，不相等则写入，使配置文件极简
 * 非 SCHEMA 字段（如 api_key、projects、providers.*）原样保留
 * @param {Object} data - 前端提交的平铺设置数据（不含 instructions）
 */
export function writeSettingsToCodeWhale(data) {
  // 读取当前配置（保留所有非通用设置字段）
  const cwCfg = readConfig();
  const newCfg = cloneDeep(cwCfg);

  // 使用 Schema 驱动写入通用设置字段
  applyToTomlBySchema(data, newCfg, SCHEMA);

  // 清理整个配置的空值（包括非 SCHEMA 字段的空对象/空数组/null）
  // 注意：此处不清除空字符串 ''，TOML 中空字符串有意义
  for (const key of Object.keys(newCfg)) {
    if (newCfg[key] === null || newCfg[key] === undefined) {
      delete newCfg[key];
    } else if (Array.isArray(newCfg[key]) && newCfg[key].length === 0) {
      delete newCfg[key];
    } else if (typeof newCfg[key] === 'object' && !Array.isArray(newCfg[key]) && isEmpty(newCfg[key])) {
      delete newCfg[key];
    }
  }

  // 写回配置
  writeConfig(newCfg);
}

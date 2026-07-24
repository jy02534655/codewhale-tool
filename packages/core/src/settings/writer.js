/**
 * CodeWhale 通用设置写入器
 *
 * 将前端平铺结构写回 ~/.codewhale/config.toml。
 * 使用 Schema 驱动写入，仅处理 SCHEMA 中的字段，其他字段原样保留。
 * 通过 io.js 统一 I/O。
 */

import { SCHEMA } from './schema.js';
import { applyToTomlBySchema } from './utils.js';
import { clearObject } from '../utils/index.js';
import { readCodeWhaleConfig, writeCodeWhaleConfig } from '../utils/toml.js';
import { cloneDeep } from 'lodash-es';

/**
 * 将通用设置写入 CodeWhale config.toml
 * 智能写入策略：值与默认值相等则删除字段，不相等则写入，使配置文件极简
 * 非 SCHEMA 字段（如 api_key、projects、providers.*）原样保留
 * @param {Object} data - 前端提交的平铺设置数据
 */
export function writeSettingsToCodeWhale(data) {
  // 读取当前配置（保留所有非通用设置字段）
  const cwCfg = readCodeWhaleConfig({});
  const newCfg = cloneDeep(cwCfg);

  // 使用 Schema 驱动写入通用设置字段
  applyToTomlBySchema(data, newCfg, SCHEMA);

  // 清理整个配置的空值（包括非 SCHEMA 字段的空对象/空数组/null/空字符串）
  clearObject(newCfg);

  // 写回配置
  writeCodeWhaleConfig(newCfg);
}

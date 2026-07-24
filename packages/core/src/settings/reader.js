/**
 * CodeWhale 通用设置读取器
 *
 * 从 ~/.codewhale/config.toml 读取通用设置，映射为前端平铺结构。
 * 使用 Schema 驱动读取，通过 io.js 统一 I/O。
 */

import { DEFAULT_SETTINGS } from './defaults.js';
import { SCHEMA } from './schema.js';
import { readFromTomlBySchema } from './utils.js';
import { isEmpty } from '../utils/index.js';
import { readConfig } from './io.js';

/**
 * 从 CodeWhale config.toml 读取通用设置，映射为前端平铺结构
 * 使用 Schema 驱动读取通用设置字段
 * @returns {Object} 设置对象
 */
export function readSettingsFromCodeWhale() {
  const cwCfg = readConfig();

  // 配置为空时返回默认值
  if (isEmpty(cwCfg)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    // 使用 Schema 驱动读取通用设置字段
    const result = readFromTomlBySchema(cwCfg, SCHEMA);

    return result;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

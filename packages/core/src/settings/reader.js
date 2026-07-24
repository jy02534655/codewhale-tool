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
import { get } from 'lodash-es';

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

    // 兼容旧版顶层 locale（写入时已删除顶层 locale，但旧文件可能仍有）
    if (cwCfg.locale !== undefined && get(cwCfg, 'tui.locale') === undefined) {
      result.locale = cwCfg.locale;
    }
    // 兼容旧版顶层 default_text_model（部分旧文件可能仍有）
    if (result.default_text_model === undefined && cwCfg.default_text_model !== undefined) {
      result.default_text_model = cwCfg.default_text_model;
    }

    return result;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

// 对外暴露路径（保留兼容）
export { codeWhalePath } from './io.js';

/**
 * CodeWhale 通用设置统一导出
 *
 * 默认值、读取、写入、管理器全部收敛到本文件。
 * 通过 io.js 统一 I/O，消除文件操作重复。
 */

import { ok, okMsg } from '../utils/result.js';
import { DEFAULT_SETTINGS } from './defaults.js';
import { readSettingsFromCodeWhale } from './reader.js';
import { writeSettingsToCodeWhale, restoreCodeWhaleDefaults } from './writer.js';

// ---------- 导出 ----------

/**
 * SettingsManager — 通用设置管理器
 *
 * 直接操作 CodeWhale config.toml，不经过 store.json。
 * 封装读取、写入、恢复默认等通用设置操作。
 */
export class SettingsManager {
  /**
   * 获取当前通用设置
   * @returns {{ success: true, data: Object, message?: string }}
   */
  list() {
    return ok(readSettingsFromCodeWhale());
  }

  /**
   * 获取通用设置默认值
   * @returns {{ success: true, data: Object, message?: string }}
   */
  getDefaults() {
    return ok({ ...DEFAULT_SETTINGS });
  }

  /**
   * 恢复默认设置
   * @returns {{ success: true, data: Object, message: string }}
   */
  restoreDefaults() {
    restoreCodeWhaleDefaults();
    return okMsg('updated', readSettingsFromCodeWhale());
  }

  /**
   * 更新通用设置
   * @param {Object} data - 前端提交的平铺设置数据
   * @returns {{ success: true, data: Object, message: string }}
   */
  update(data) {
    const settingsData = { ...(data || {}) };
    writeSettingsToCodeWhale(settingsData);
    return okMsg('updated', readSettingsFromCodeWhale());
  }
}

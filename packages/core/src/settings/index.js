/**
 * CodeWhale 通用设置统一导出
 *
 * 默认值、读取、写入、管理器全部收敛到本文件。
 * 通过 io.js 统一 I/O，消除文件操作重复。
 */

export { DEFAULT_SETTINGS } from './defaults.js';
export { readSettingsFromCodeWhale, codeWhalePath } from './reader.js';
export { writeSettingsToCodeWhale } from './writer.js';

import { ok, okMsg } from '../utils/result.js';
import { DEFAULT_SETTINGS as _DEFAULT_SETTINGS } from './defaults.js';
import { readSettingsFromCodeWhale as _readSettingsFromCodeWhale } from './reader.js';
import { writeSettingsToCodeWhale as _writeSettingsToCodeWhale } from './writer.js';

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
    return ok(_readSettingsFromCodeWhale());
  }

  /**
   * 获取通用设置默认值
   * @returns {{ success: true, data: Object, message?: string }}
   */
  getDefaults() {
    return ok({ ..._DEFAULT_SETTINGS });
  }

  /**
   * 恢复默认设置
   * @returns {{ success: true, data: Object, message: string }}
   */
  restoreDefaults() {
    const defaults = { ..._DEFAULT_SETTINGS };
    _writeSettingsToCodeWhale(defaults);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }

  /**
   * 更新通用设置
   * @param {Object} data - 前端提交的平铺设置数据
   * @returns {{ success: true, data: Object, message: string }}
   */
  update(data) {
    const settingsData = { ...(data || {}) };
    _writeSettingsToCodeWhale(settingsData);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }
}

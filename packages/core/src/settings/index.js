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
import { readConfig, writeConfig } from './io.js';

// ---------- 独立管理 instructions（复用 io.js） ----------

/**
 * 将 instructions 写回 config.toml
 * 仅保存 path 字符串，不存储 transient 数据（content / readonly）
 * content 在读取时通过 readSettingsFromCodeWhale 从文件系统重新解析
 * @param {Array<{path: string, content?: string, readonly?: boolean}>} instructions
 */
function writeInstructionsToConfig(instructions) {
  const cwCfg = readConfig();
  const newCfg = JSON.parse(JSON.stringify(cwCfg));

  if (!Array.isArray(instructions) || instructions.length === 0) {
    delete newCfg.instructions;
  } else {
    newCfg.instructions = instructions
      .map(item => (typeof item === 'string' ? item : item.path))
      .filter(p => !!p);
  }

  writeConfig(newCfg);
}

// ---------- 导出 ----------

/**
 * SettingsManager — 通用设置管理器
 *
 * 直接操作 CodeWhale config.toml，不经过 store.json。
 * 封装读取、写入、恢复默认等通用设置操作。
 * 对外 API 行为不变，list() 返回仍包含 instructions。
 */
export class SettingsManager {
  /**
   * 获取当前通用设置
   * @returns {{ success: true, data: Object, message?: string }}
   */
  list() {
    // _readSettingsFromCodeWhale 已包含 instructions（含 content 解析），保持向后兼容
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
    // 恢复默认设置时保留现有 instructions，instructions 由独立接口管理
    const current = _readSettingsFromCodeWhale();
    const defaults = { ..._DEFAULT_SETTINGS };
    if (Array.isArray(current.instructions) && current.instructions.length > 0) {
      defaults.instructions = current.instructions;
    } else {
      delete defaults.instructions;
    }
    _writeSettingsToCodeWhale(defaults);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }

  /**
   * 更新通用设置
   * @param {Object} data - 前端提交的平铺设置数据
   * @returns {{ success: true, data: Object, message: string }}
   */
  update(data) {
    // instructions 由独立接口 /settings/instructions 管理，此处忽略
    const settingsData = { ...(data || {}) };
    delete settingsData.instructions;
    _writeSettingsToCodeWhale(settingsData);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }

  /**
   * 更新 instructions（仅写入 instructions，不触碰其他设置）
   * @param {Array<{path: string, content?: string, readonly?: boolean}>} instructions
   * @returns {{ success: true, data: Object, message: string }}
   */
  updateInstructions(instructions) {
    writeInstructionsToConfig(instructions);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }
}

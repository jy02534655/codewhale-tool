/**
 * CodeWhale 通用设置写入器
 *
 * 将前端平铺结构写回 ~/.codewhale/config.toml、settings.toml、permissions.toml。
 * 使用 Schema 驱动写入，仅处理 SCHEMA 中的字段，其他字段原样保留。
 * 通过 toml.js 统一 I/O。
 */

import { SCHEMA, getFieldTarget, FILE_TARGET } from './schema.js';
import { CODEWHALE_DEFAULTS } from './defaults.js';
import {
  configManager,
  settingsManager,
  permissionsManager,
} from '../utils/toml.js';
import { cloneDeep } from 'lodash-es';

/**
 * 将通用设置写入 CodeWhale 配置
 * 写入策略：与默认值相等也保留（不做智能精简），null 表示显式删除，undefined 表示未提交
 * 非 SCHEMA 字段（如 api_key、projects、providers.*）原样保留
 * @param {Object} data - 前端提交的平铺设置数据
 */
export function writeSettingsToCodeWhale(data) {
  const currentConfig = configManager.read();
  const currentSettings = settingsManager.read();

  // 2. 深拷贝 config，settings 保留所有现有字段（包括未知键）
  let newConfig = cloneDeep(currentConfig);
  let newSettings = { ...currentSettings };

  // 3. 分离 permissions_toml
  const hasPermissions = data.permissions_toml !== undefined;
  const permissionsValue = hasPermissions ? data.permissions_toml : undefined;
  const restData = { ...data };
  delete restData.permissions_toml;

  // 4. 遍历所有 SCHEMA 字段，按目标文件分流写入
  for (const field of SCHEMA) {
    const value = restData[field.key];
    // undefined 视为未提交，跳过；null 视为显式删除
    if (value === undefined) continue;

    const target = getFieldTarget(field.key);

    if (target === FILE_TARGET.SETTINGS) {
      writeToSettings(newSettings, field, value);
    } else if (target === FILE_TARGET.CONFIG) {
      writeToConfig(newConfig, field, value);
    }
  }

  // 5. 清理空值（只删除 undefined/null，保留空字符串、0、false、空数组、空对象）
  newConfig = cleanObject(newConfig);
  newSettings = cleanObject(newSettings);

  // 6. 写回
  configManager.write(newConfig);
  settingsManager.write(newSettings);

  // 7. permissions 只在提交时才写入
  if (hasPermissions) {
    permissionsManager.write(permissionsValue ?? '');
  }
}

/**
 * 写入 settings.toml（平铺键名）
 * 必须存在逻辑：CODEWHALE_DEFAULTS 中的键始终保留
 * 显式删除：value 为 null 时删除字段
 * 不做智能精简：即使值等于默认值也直接写入
 */
function writeToSettings(settingsObj, field, value) {
  const flatKey = field.settingsPath;

  if (value === null) {
    delete settingsObj[flatKey];
    return;
  }

  // 直接写入，不做智能精简
  settingsObj[flatKey] = value;
}

/**
 * 写入 config.toml（嵌套路径）
 * 必须存在逻辑：CONFIG_REQUIRED_KEYS 中的键始终保留
 * 显式删除：value 为 null 时删除字段
 * 不做智能精简：即使值等于默认值也直接写入
 */
function writeToConfig(configObj, field, value) {
  const parts = field.path.split('.');

  if (value === null) {
    deleteNested(configObj, parts);
    return;
  }

  // 直接写入嵌套路径
  let current = configObj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined || typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * 安全删除嵌套字段
 */
function deleteNested(obj, parts) {
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) return;
    current = current[parts[i]];
  }
  if (current && current[parts[parts.length - 1]] !== undefined) {
    delete current[parts[parts.length - 1]];
  }
}

/**
 * 清理对象：只删除 undefined 和 null，保留空字符串、0、false、空数组、空对象
 * @param {Object} o - 待清理的对象
 * @returns {Object} 清理后的新对象
 */
function cleanObject(o) {
  if (typeof o !== 'object' || o === null) return o;

  if (Array.isArray(o)) {
    return o.map((item) => cleanObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(o)) {
    if (value === undefined || value === null) continue;
    result[key] = cleanObject(value);
  }
  return result;
}

/**
 * 恢复 CodeWhale 默认设置
 * 直接操作文件，保留非 SCHEMA 字段（api_key、providers 等），
 * 只补全 CODEWHALE_DEFAULTS 中属于 settings.toml 的键，其他 SCHEMA 字段全部清空。
 */
export function restoreCodeWhaleDefaults() {
  const currentConfig = configManager.read();
  const currentSettings = settingsManager.read();

  // 保留非 SCHEMA 字段
  const configExtras = extractExtras(currentConfig, FILE_TARGET.CONFIG);
  const settingsExtras = extractExtras(currentSettings, FILE_TARGET.SETTINGS);

  const newConfig = { ...configExtras };
  const newSettings = { ...settingsExtras };

  // 只补全 CODEWHALE_DEFAULTS 中属于 settings.toml 的键
  for (const key of CODEWHALE_DEFAULTS) {
    const field = SCHEMA.find(f => f.key === key);
    if (field && getFieldTarget(field.key) === FILE_TARGET.SETTINGS) {
      newSettings[field.settingsPath] = field.default;
    }
  }

  // 清理空对象后写回
  configManager.write(cleanEmptyObjects(newConfig));
  settingsManager.write(cleanEmptyObjects(newSettings));
  permissionsManager.write('');
}

/**
 * 提取当前配置中的非 SCHEMA 字段（保留 api_key、providers 等未知字段）
 * @param {Object} currentObj - 当前配置对象
 * @param {string} targetFile - 目标文件（'config' | 'settings'）
 * @returns {Object} 只包含非 SCHEMA 字段的对象
 */
function extractExtras(currentObj, targetFile) {
  const result = cloneDeep(currentObj);

  for (const field of SCHEMA) {
    if (getFieldTarget(field.key) !== targetFile) continue;

    if (targetFile === FILE_TARGET.SETTINGS) {
      delete result[field.settingsPath];
    } else if (targetFile === FILE_TARGET.CONFIG) {
      const parts = field.path.split('.');
      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (current[parts[i]] === undefined) break;
        current = current[parts[i]];
      }
      if (current && current[parts[parts.length - 1]] !== undefined) {
        delete current[parts[parts.length - 1]];
      }
    }
  }

  return result;
}

/**
 * 清理空对象：递归删除空对象（保留空数组、空字符串、0、false）
 * @param {Object} o - 待清理的对象
 * @returns {Object} 清理后的新对象
 */
function cleanEmptyObjects(o) {
  if (typeof o !== 'object' || o === null) return o;

  if (Array.isArray(o)) {
    return o.map((item) => cleanEmptyObjects(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(o)) {
    if (value === undefined || value === null) continue;
    const cleaned = cleanEmptyObjects(value);
    // 跳过空对象（保留空数组）
    if (
      typeof cleaned === 'object' &&
      cleaned !== null &&
      !Array.isArray(cleaned) &&
      Object.keys(cleaned).length === 0
    ) {
      continue;
    }
    result[key] = cleaned;
  }
  return result;
}

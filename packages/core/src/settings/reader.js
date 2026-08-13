/**
 * CodeWhale 通用设置读取器
 *
 * 从 ~/.codewhale/config.toml、settings.toml、permissions.toml 读取通用设置，映射为前端平铺结构。
 * 使用 Schema 驱动读取，通过 io.js 统一 I/O。
 */

import { DEFAULT_SETTINGS, CODEWHALE_DEFAULTS } from './defaults.js';
import { SCHEMA, getFieldTarget, FILE_TARGET } from './schema.js';
import { isEmpty } from '../utils/index.js';
import {
  configManager,
  settingsManager,
  permissionsManager,
} from '../utils/toml.js';
import { get } from 'lodash-es';

export function readSettingsFromCodeWhale() {
  const cwCfg = configManager.read();
  const settingsCfg = settingsManager.read();

  if (isEmpty(cwCfg) && isEmpty(settingsCfg)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    // 从默认值开始逐字段覆盖
    const merged = { ...DEFAULT_SETTINGS };

    for (const field of SCHEMA) {
      const target = getFieldTarget(field.key);
      let value;

      if (target === FILE_TARGET.SETTINGS) {
        // settings.toml 使用平铺键名（点号已替换为下划线），直接方括号访问
        value = settingsCfg[field.settingsPath];
      } else if (target === FILE_TARGET.CONFIG) {
        // config.toml 使用嵌套路径，通过 lodash.get 安全读取
        value = get(cwCfg, field.path);
      } else if (target === FILE_TARGET.PERMISSIONS) {
        // permissions 单独处理
        continue;
      }

      // 只有实际存在的值才覆盖默认值，undefined 表示未配置
      if (value !== undefined) {
        merged[field.key] = value;
      }
    }

    // 确保 CODEWHALE_DEFAULTS 中的键始终有值（settings.toml 必须存在项）
    for (const key of CODEWHALE_DEFAULTS) {
      if (merged[key] === undefined && key in DEFAULT_SETTINGS) {
        merged[key] = DEFAULT_SETTINGS[key];
      }
    }

    const permissionsContent = permissionsManager.read();
    if (permissionsContent !== null) {
      merged.permissions_toml = permissionsContent;
    }

    return merged;
  } catch (e) {
    console.error('[settings] Failed to read CodeWhale settings:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

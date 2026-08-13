/**
 * CodeWhale 配置文件专用 I/O
 *
 * 直接封装 ~/.codewale/config.toml 的读写，
 * 调用方无需再传入 codeWhalePath()。
 */

import { parse, stringify } from 'smol-toml';
import { readFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { codeWhalePath } from './index.js';

const CODEWHALE_HOME = process.env.CODEWHALE_HOME || join(dirname(codeWhalePath()), '');

// ============================================================
// 1. FileManager 工厂
// ============================================================

function createFileManager({ getPath, name, isRawText = false }) {
  return {
    getPath,
    name,

    read(options = {}) {
      const path = options[`${name}Path`] || getPath();
      try {
        if (existsSync(path)) {
          const content = readFileSync(path, 'utf-8');
          if (isRawText) return content;
          return parse(content);
        }
      } catch (e) {
        console.warn(`[toml] Failed to read ${name}.toml:`, e.message);
      }
      return isRawText ? null : {};
    },

    write(data, options = {}) {
      const path = options[`${name}Path`] || getPath();
      const dir = join(path, '..');
      mkdirSync(dir, { recursive: true });

      const content = isRawText
        ? (data ?? '')
        : stringify(data);

      const tmpPath = `${path}.tmp.${Date.now()}`;
      writeFileSync(tmpPath, content, 'utf-8');
      renameSync(tmpPath, path);
    },

    exists(options = {}) {
      const path = options[`${name}Path`] || getPath();
      return existsSync(path);
    },
  };
}

// ============================================================
// 2. 三个文件管理器
// ============================================================

export const configManager = createFileManager({
  getPath: () => process.env.CODEWHALE_CONFIG_PATH || join(CODEWHALE_HOME, 'config.toml'),
  name: 'config',
  isRawText: false,
});

export const settingsManager = createFileManager({
  getPath: () => join(CODEWHALE_HOME, 'settings.toml'),
  name: 'settings',
  isRawText: false,
});

export const permissionsManager = createFileManager({
  getPath: () => join(CODEWHALE_HOME, 'permissions.toml'),
  name: 'permissions',
  isRawText: true,
});

// ============================================================
// 3. 便捷函数
// ============================================================

export const getCodeWhaleConfigPath = configManager.getPath;
export const getCodeWhaleSettingsPath = settingsManager.getPath;
export const getCodeWhalePermissionsPath = permissionsManager.getPath;

export const readCodeWhaleConfig = (opts) => configManager.read(opts);
export const writeCodeWhaleConfig = (data, opts) => configManager.write(data, opts);

export const readCodeWhaleSettings = (opts) => settingsManager.read(opts);
export const writeCodeWhaleSettings = (data, opts) => settingsManager.write(data, opts);

export const readPermissionsToml = (opts) => permissionsManager.read(opts);
export const writePermissionsToml = (data, opts) => permissionsManager.write(data, opts);

/**
 * CodeWhale 通用设置读取器
 *
 * 从 ~/.codewhale/config.toml 读取通用设置，映射为前端平铺结构。
 * 使用 Schema 驱动读取，通过 io.js 统一 I/O。
 */

import { homedir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_SETTINGS } from './defaults.js';
import { SCHEMA } from './schema.js';
import { readFromTomlBySchema } from './utils.js';
import { isEmpty } from '../utils/index.js';
import { readConfig } from './io.js';
import pkg from 'lodash';
const { get } = pkg;

// ---------- instruction 路径与内容解析工具 ----------

/**
 * 将 instruction path 解析为绝对路径
 * @param {string} path
 * @returns {string}
 */
function resolveInstructionPath(path) {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  if (isAbsolute(path)) {
    return path;
  }
  return join(process.cwd(), path);
}

/**
 * 判断是否为全局配置路径（如 ~/.codewhale/global.md）
 * @param {string} path
 * @returns {boolean}
 */
function isGlobalInstructionPath(path) {
  const resolved = resolveInstructionPath(path);
  const globalPath = join(homedir(), '.codewhale', 'global.md');
  return resolved === globalPath;
}

/**
 * 读取 instruction 文件内容
 * @param {string} path
 * @returns {string}
 */
function readInstructionContent(path) {
  const resolvedPath = resolveInstructionPath(path);
  if (existsSync(resolvedPath)) {
    try {
      return readFileSync(resolvedPath, 'utf-8');
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * 从 CodeWhale config.toml 读取通用设置，映射为前端平铺结构
 * 使用 Schema 驱动读取通用设置字段，同时保留 instruction 内容解析
 * @returns {Object} 包含 instructions 的完整设置对象
 */
export function readSettingsFromCodeWhale() {
  const cwCfg = readConfig();

  // 配置为空时返回默认值
  if (isEmpty(cwCfg)) {
    return {
      ...DEFAULT_SETTINGS,
      instructions: [],
    };
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

    // 读取并解析 instructions（保持向后兼容，前端 Instructions 组件依赖 content 字段）
    const rawInstructions = cwCfg.instructions || [];
    const instructions = rawInstructions
      .map((item) => {
        let path, content, readonly;
        if (typeof item === 'string') {
          path = item;
          content = '';
          readonly = false;
        } else if (item && typeof item === 'object' && item.path) {
          path = item.path;
          content = item.content || '';
          readonly = !!item.readonly;
        } else {
          return null;
        }

        // 判断是否为全局配置路径
        if (isGlobalInstructionPath(path)) {
          readonly = true;
        }

        // 如果不是只读，尝试读取文件内容
        if (!readonly) {
          content = readInstructionContent(path);
        }

        return { path, content, readonly };
      })
      .filter(Boolean);

    return { ...result, instructions };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      instructions: [],
    };
  }
}

// 对外暴露路径（保留兼容）
export { codeWhalePath } from './io.js';

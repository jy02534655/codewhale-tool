/**
 * CodeWhale 配置文件专用 I/O
 *
 * 直接封装 ~/.codewale/config.toml 的读写，
 * 调用方无需再传入 codeWhalePath()。
 */

import { parse, stringify } from 'smol-toml';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { atomicWriteSync } from './config.js';
import { isEmpty, codeWhalePath } from './index.js';

/**
 * 读取 CodeWhale 配置
 * @param {Object} [fallback={}] - 文件不存在或解析失败时的返回值
 * @returns {Object} 解析后的 TOML 配置对象
 */
export function readCodeWhaleConfig(fallback = {}) {
  const filePath = codeWhalePath();
  if (!existsSync(filePath)) {
    return fallback;
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * 写入 CodeWhale 配置（原子写入，自动创建目录）
 * @param {Object} data - 要写入的配置对象
 * @param {string} [header] - TOML 文件头部注释
 */
export function writeCodeWhaleConfig(data, header) {
  const filePath = codeWhalePath();
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const content = isEmpty(data)
    ? '# CodeWhale Configuration\n# (All settings are at default values)\n'
    : header + stringify(data);

  atomicWriteSync(filePath, content);
}

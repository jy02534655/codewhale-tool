// 统一配置 I/O 抽象：消除所有重复的文件操作代码
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { parse, stringify } from 'smol-toml';
import { atomicWriteSync } from '../utils/config.js';

/**
 * 获取 CodeWhale 配置文件路径
 * @returns {string} ~/.codewhale/config.toml 的绝对路径
 */
export function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

/**
 * 读取并解析 CodeWhale 配置
 * 文件不存在或解析失败时返回空对象
 * @returns {Object} 解析后的 TOML 配置对象
 */
export function readConfig() {
  const cwPath = codeWhalePath();
  if (!existsSync(cwPath)) {
    return {};
  }
  try {
    const raw = readFileSync(cwPath, 'utf-8');
    return parse(raw);
  } catch {
    return {};
  }
}

/**
 * 写入配置对象（自动创建目录）
 * @param {Object} config - 要写入的配置对象
 * @param {string} [header] - TOML 文件头部注释
 */
export function writeConfig(config, header = '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n') {
  const cwPath = codeWhalePath();
  const dir = dirname(cwPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 如果配置为空，只写注释，不生成空 TOML
  const content = Object.keys(config).length === 0
    ? '# CodeWhale Configuration\n# (All settings are at default values)\n'
    : header + stringify(config);
 
  atomicWriteSync(cwPath, content);
}

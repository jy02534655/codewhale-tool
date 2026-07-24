/**
 * 统一配置 I/O 抽象：消除所有重复的文件操作代码
 */
import { readCodeWhaleConfig, writeCodeWhaleConfig } from '../utils/toml.js';

const DEFAULT_HEADER = '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n';

/**
 * 读取并解析 CodeWhale 配置
 * 文件不存在或解析失败时返回空对象
 * @returns {Object} 解析后的 TOML 配置对象
 */
export function readConfig() {
  return readCodeWhaleConfig({});
}

/**
 * 写入配置对象（自动创建目录）
 * @param {Object} config - 要写入的配置对象
 * @param {string} [header] - TOML 文件头部注释
 */
export function writeConfig(config, header = DEFAULT_HEADER) {
  writeCodeWhaleConfig(config, header);
}

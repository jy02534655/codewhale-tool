/**
 * Skill 安装日志模块
 * 提供安装日志查询与清除
 */

import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ok, okMsg } from '../utils/result.js';

/**
 * 安装日志文件路径
 * 固定存放在当前工作目录的 data/download-skill.log
 */
const LOG_PATH = join(process.cwd(), 'data', 'download-skill.log');

/**
 * 获取安装日志（最近 200 行）
 * 如果日志文件不存在，返回空字符串
 * @returns {Object} 包含最近 200 行日志文本的结果对象
 */
export function getInstallLog() {
  if (!existsSync(LOG_PATH)) return ok('');
  const content = readFileSync(LOG_PATH, 'utf-8');
  const lines = content.split('\n');
  // 只返回最后 200 行，避免日志文件过大
  return ok(lines.slice(Math.max(0, lines.length - 200)).join('\n'));
}

/**
 * 清除安装日志
 * 直接删除日志文件
 * @returns {Object} 操作成功的结果对象
 */
export function clearInstallLog() {
  if (existsSync(LOG_PATH)) unlinkSync(LOG_PATH);
  return okMsg('skillLogCleared');
}

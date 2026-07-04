/**
 * Skill 安装日志模块
 * 提供安装日志查询与清除
 */

import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ok, okMsg } from '../utils/result.js';

const LOG_PATH = join(process.cwd(), 'data', 'download-skill.log');

/**
 * 获取安装日志（最近 200 行）
 */
export function getInstallLog() {
  if (!existsSync(LOG_PATH)) return ok('');
  const content = readFileSync(LOG_PATH, 'utf-8');
  const lines = content.split('\n');
  return ok(lines.slice(Math.max(0, lines.length - 200)).join('\n'));
}

/**
 * 清除安装日志
 */
export function clearInstallLog() {
  if (existsSync(LOG_PATH)) unlinkSync(LOG_PATH);
  return okMsg('skillLogCleared');
}
/**
 * download/shared.js — 共享基础设施
 *
 * 收口 download 层共用的基础设施：
 *   - writeSkillLog 文件日志（skill 层也调用此出口）
 *
 * @module download/shared
 */

import path from 'node:path';
import fs from 'node:fs';
import { formatTimestamp } from '../utils/logger.js';
import { getServerMessage } from '../utils/i18n.js';

/**
 * 写入统一格式的安装日志文件 download-skill.log。
 * skill 层（emitSkillInstallLog）和 download 层共用此出口。
 */
export function writeSkillLog(level, keyOrMessage, params, extra) {
  try {
    const ts = formatTimestamp();
    const useRawMessage = !!(extra && extra.rawMessage);
    const msg = useRawMessage ? keyOrMessage : getServerMessage(keyOrMessage, params);
    const safeExtra = extra && extra.rawMessage
      ? Object.fromEntries(Object.entries(extra).filter(([k]) => k !== 'rawMessage'))
      : extra;
    const extraStr = safeExtra && Object.keys(safeExtra).length
      ? ` | ${JSON.stringify(safeExtra, null, 0)}`
      : '';
    const line = `[${ts}] [${level}] ${msg}${extraStr}`;
    fs.appendFileSync(path.join(process.cwd(), 'download-skill.log'), `${line}\n`, 'utf-8');
  } catch { /* 日志写入失败不阻塞流程 */ }
}
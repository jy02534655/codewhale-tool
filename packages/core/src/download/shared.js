/**
 * download/shared.js — 共享基础设施
 *
 * 收口 download 层共用的基础设施，避免 skill 层和 download 层重复实现。
 *
 * 当前提供：
 *   - writeSkillLog：统一格式的安装日志文件写入
 *
 * @module download/shared
 */
import path from 'node:path';
import fs from 'node:fs';
import { formatTimestamp } from '../utils/logger.js';
import { getServerMessage } from '../utils/i18n.js';
/**
 * 写入统一格式的安装日志文件 download-skill.log。
 *
 * 日志行格式：[时间戳] [级别] 消息 | 额外信息（JSON）
 *
 * 设计要点：
 *   - skill 层（emitSkillInstallLog）和 download 层共用此出口，确保日志格式一致
 *   - 支持 rawMessage 模式：直接写入原始消息，不经过 i18n 查找
 *   - extra.rawMessage 字段会被过滤掉，避免冗余
 *   - 日志写入失败不会阻塞主流程（静默忽略）
 *
 * @param {string} level - 日志级别，如 'INFO'、'WARN'、'ERROR'
 * @param {string} keyOrMessage - 消息 key（用于 i18n 查找）或原始消息文本
 * @param {object} [params] - i18n 参数，用于替换消息中的占位符，如 { owner, repo }
 * @param {object} [extra] - 额外信息，会以 JSON 形式追加到日志行末尾
 * @param {boolean} [extra.rawMessage=false] - 为 true 时，keyOrMessage 被视为原始消息，不再进行 i18n 查找
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
    fs.appendFileSync(path.join(process.cwd(), 'data', 'download-skill.log'), `${line}\n`, 'utf-8');
  } catch { /* 日志写入失败不阻塞流程 */ }
}

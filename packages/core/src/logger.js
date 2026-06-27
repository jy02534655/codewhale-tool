/**
 * logger.js — 统一日志模块
 *
 * 合并 download.js 的 _log() / _logSpan() / _setLogFile() / _onLogExtra 和
 * index.js 的 _sseLogSafe()，支持文件写入 + SSE 回调 + i18n 翻译。
 *
 * @module logger
 */

import fs from 'node:fs';
import { getServerMessage } from './i18n.js';

/**
 * 格式化字节数为可读字符串
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTimestamp() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0') + '.' +
    String(d.getMilliseconds()).padStart(3, '0');
}

/**
 * 统一日志器 — 写文件 + SSE 回调 + i18n 翻译
 */
export class Logger {
  constructor() {
    this._file = null;
    this._onCallback = null;
  }

  setFile(filePath) {
    this._file = filePath;
    this.log('INFO', 'SKILL_LOG_NEW_LOG');
  }

  setCallback(fn) {
    this._onCallback = fn || null;
  }

  log(level, key, params, extra) {
    if (!this._file && !this._onCallback) return;
    try {
      const ts = formatTimestamp();
      const msg = getServerMessage(key, params);
      const extraStr = extra ? ' | ' + JSON.stringify(extra, null, 0) : '';
      const line = `[${ts}] [${level}] ${msg}${extraStr}`;

      if (this._file) fs.appendFileSync(this._file, line + '\n', 'utf-8');
      if (this._onCallback) this._onCallback({ level, message: line });
    } catch { /* 日志写入失败不阻塞流程 */ }
  }

  span(key, params) {
    const t = Date.now();
    this.log('INFO', key, params);
    return {
      finish: (statusKey, resultKey, resultParams, extra) => {
        this.log(statusKey, resultKey, resultParams, { ...extra, elapsed: Date.now() - t + 'ms' });
      },
    };
  }
}
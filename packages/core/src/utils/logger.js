/**
 * logger.js — 统一日志模块
 *
 * 合并 download.js 的 _log() / _logSpan() / _setLogFile() / _onLogExtra 和
 * index.js 的 _sseLogSafe()，支持文件写入 + SSE 回调 + i18n 翻译。
 *
 * 这个模块的用途：
 * - 把 Skill 下载、安装等耗时操作的日志写到文件里，方便后续排查问题
 * - 同时把日志实时推送到前端页面，让用户看到进度
 * - 所有日志文本都支持多语言，根据用户当前语言自动翻译
 *
 * @module logger
 */

import fs from 'node:fs';
import { getServerMessage } from './i18n.js';

/**
 * 格式化字节数为可读字符串
 *
 * 把计算机存储中的字节数转换成人类容易看懂的格式。
 * 例如：1024 字节 -> "1.0 KB"，1048576 字节 -> "1.0 MB"
 *
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的字符串，如 "1.0 MB"
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 格式化当前时间为日志时间戳
 *
 * 返回格式类似 "2026-07-10 14:30:00.123"
 * 用于日志文件每行的前缀，方便按时间排序和过滤。
 *
 * @returns {string} 当前时间戳字符串
 */
export function formatTimestamp() {
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
 *
 * Logger 实例可以同时做两件事：
 * 1. 把日志追加写入指定文件（持久化存储）
 * 2. 通过回调函数把日志实时推送给前端（实时显示）
 *
 * 典型使用场景：
 * - Skill 下载时，记录每个步骤的日志
 * - 前端通过 SSE（Server-Sent Events）接收日志并显示在页面上
 */
export class Logger {
  constructor() {
    this._file = null;      // 日志文件路径，null 表示不写文件
    this._onCallback = null; // 前端回调函数，null 表示不推送到前端
  }

  /**
   * 设置日志文件路径
   *
   * 设置后，所有日志都会追加写入这个文件。
   * 设置时会自动写入一条"新建诊断日志"的标记，方便在文件中定位。
   *
   * @param {string} filePath 日志文件完整路径
   */
  setFile(filePath) {
    this._file = filePath;
    this.log('INFO', 'skillLogNewLog');
  }

  /**
   * 设置前端日志回调
   *
   * 设置后，所有日志都会通过这个函数推送给前端。
   * 通常用于 SSE 推送，让用户实时看到日志输出。
   *
   * @param {fn} fn 回调函数，接收 { level, message } 对象
   */
  setCallback(fn) {
    this._onCallback = fn || null;
  }

  /**
   * 写入一条日志
   *
   * 这是 Logger 最核心的方法。每次调用都会：
   * 1. 生成当前时间戳
   * 2. 根据 key 查找多语言消息文本
   * 3. 格式化日志行
   * 4. 写入文件（如果已设置）
   * 5. 调用回调（如果已设置）
   *
   * @param {string} level 日志级别，如 'INFO'、'ERROR'
   * @param {string} key 消息 key，用于从 i18n 查找翻译
   * @param {Object} [params] 插值参数，用于替换消息中的占位符
   * @param {Object} [extra] 额外信息，会以 JSON 形式追加到日志行末尾
   */
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

  /**
   * 计时器：记录某个操作的开始和结束时间
   *
   * 使用方式：
   * 1. 调用 span() 开始计时，返回一个对象
   * 2. 调用返回对象的 finish() 方法结束计时，自动记录耗时
   *
   * 示例：
   *   const s = logger.span('skillProgressDownloading', { name: 'xxx' });
   *   // ... 执行耗时操作 ...
   *   s.finish('INFO', 'skillProgressDownloadDone');
   *
   * @param {string} key 开始消息 key
   * @param {Object} [params] 插值参数
   * @returns {{ finish: Function }} 包含 finish 方法的对象
   */
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

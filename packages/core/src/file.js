/**
 * FileManager — 文件系统浏览与读取核心逻辑
 *
 * 提供目录列表和文件内容读取能力，供 Server 路由层调用。
 * 所有路径统一使用 path.resolve() 解析，避免目录穿越。
 *
 * @module file
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { ok, fail, failMsg } from './utils/result.js';

/**
 * 已知 Windows 系统隐藏文件夹名称
 */
const HIDDEN_FOLDER_NAMES = new Set([
  'System Volume Information',
  '$RECYCLE.BIN',
  'Recovery',
]);

export class FileManager {
  /**
   * 列出目录内容
   *
   * @param {string} dirPath - 目标目录路径
   * @param {string} [accept] - 可选，逗号分隔的扩展名过滤，如 ".txt,.zip"
   * @returns {{ success: boolean, data?: { name: string, isDirectory: boolean, path: string }[], message?: string }}
   */
  list(dirPath, accept, directory) {
    try {
      const resolved = path.resolve(dirPath);
      if (!fs.existsSync(resolved)) {
        return failMsg('FILE_NOT_FOUND');
      }
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) {
        return failMsg('FILE_NOT_DIRECTORY');
      }
      const items = fs.readdirSync(resolved, { withFileTypes: true });
      const exts = (accept || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const hiddenFiles = getHiddenFiles(resolved);
      const result = items
        .filter((item) => {
          if (item.name.startsWith('.')) return false;
          if (HIDDEN_FOLDER_NAMES.has(item.name)) return false;
          const fullPath = path.join(resolved, item.name).toLowerCase();
          if (hiddenFiles.has(fullPath)) return false;
          return true;
        })
        .filter((item) => {
          if (exts.length === 0 || item.isDirectory()) return true;
          const ext = '.' + item.name.split('.').pop().toLowerCase();
          return exts.includes(ext);
        })
        .filter((item) => {
          if (!directory || item.isDirectory()) return true;
          return false;
        })
        .map((item) => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          path: path.join(resolved, item.name),
        }));
      return ok(result);
    } catch (err) {
      return failMsg('FILE_LIST_FAILED');
    }
  }

  /**
   * 读取文件内容（文本）
   *
   * @param {string} filePath - 目标文件路径
   * @returns {{ success: boolean, data?: string, message?: string }}
   */
  read(filePath) {
    if (!filePath) {
      return failMsg('FILE_PATH_REQUIRED');
    }
    try {
      const resolved = path.resolve(filePath);
      if (!fs.existsSync(resolved)) {
        return failMsg('FILE_NOT_FOUND');
      }
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        return failMsg('FILE_IS_DIRECTORY');
      }
      // 限制读取大小，防止加载过大的文件（例如 1MB）
      const MAX_SIZE = 1024 * 1024;
      if (stat.size > MAX_SIZE) {
        return failMsg('FILE_TOO_LARGE');
      }
      const content = fs.readFileSync(resolved, 'utf-8');
      return ok(content);
    } catch (err) {
      return failMsg('FILE_READ_FAILED');
    }
  }

  /**
   * 获取可用盘符列表（Windows）或根目录（非 Windows）
 *
 * @returns {{ success: boolean, data?: string[], message?: string }}
 */
drives() {
  try {
    if (process.platform === 'win32') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const result = [];
      for (const letter of letters) {
        const root = letter + ':\\';
        if (fs.existsSync(root)) result.push(root);
      }
      return ok(result);
    }
    return ok(['/']);
  } catch {
    return ok(['/']);
  }
}
}

/**
 * 获取目录中具有隐藏属性的文件路径集合（仅 Windows）
 *
 * @param {string} dirPath - 目录路径
 * @returns {Set<string>}
 */
function getHiddenFiles(dirPath) {
  if (process.platform !== 'win32') return new Set();
  try {
    const output = execSync('attrib "' + dirPath.replace(/"/g, '\\"') + '\\*"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const hidden = new Set();
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.includes('H')) {
        const match = trimmed.match(/^[A-Z]*\s+(.+)$/);
        if (match) {
          hidden.add(match[1].toLowerCase());
        }
      }
    }
    return hidden;
  } catch {
    return new Set();
  }
}
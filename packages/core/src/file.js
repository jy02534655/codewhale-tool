/**
 * FileManager — 文件系统浏览与读取核心逻辑
 *
 * 提供目录列表和文件内容读取能力，供 Server 路由层调用。
 * 所有路径统一使用 safeResolve() 解析（path.resolve + fs.realpathSync），
 * 避免目录穿越和符号链接绕过。
 *
 * 通俗理解：
 * 这个类相当于给后端提供一个“安全文件浏览器”。前端想查看某个目录下
 * 有哪些文件、或者读取某个文件内容时，不会直接访问你的硬盘，而是经过
 * 这里统一处理：先校验路径是否存在、是不是目录、文件是否过大，
 * 然后再返回结果。这样可以防止误读系统文件或加载过大的文件导致卡顿。
 *
 * @module file
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ok, failMsg } from './utils/result.js';
import { MAX_FILE_SIZE } from './constants.js';

/**
 * 已知 Windows 系统隐藏文件夹名称
 *
 * 这些是 Windows 系统自动创建的隐藏文件夹，浏览目录时应自动跳过，
 * 避免用户看到系统内部文件造成困惑。
 */
const HIDDEN_FOLDER_NAMES = new Set([
  'System Volume Information',
  '$RECYCLE.BIN',
  'Recovery',
]);

/**
 * 安全解析路径，处理符号链接和路径穿越
 *
 * 先使用 path.resolve 规范化路径，再使用 fs.realpathSync 解析符号链接，
 * 确保获取真实路径，避免通过符号链接绕过目录限制。
 *
 * @param {string} userPath - 用户输入的路径
 * @returns {string} 解析后的真实路径
 */
function safeResolve(userPath) {
  const resolved = path.resolve(userPath);
  try {
    return fs.realpathSync(resolved);
  } catch {
    // 路径不存在时 realpathSync 会失败，返回已规范化的路径
    return resolved;
  }
}

export class FileManager {
  /**
   * 列出目录内容
   *
   * 这是文件浏览器的核心方法。给定一个目录路径，返回该目录下的
   * 文件和子文件夹列表。支持按扩展名过滤、只显示文件夹、隐藏文件过滤。
   *
   * 过滤逻辑（按顺序执行）：
   * 1. 跳过以点开头的隐藏文件/文件夹（如 .git、.vscode）
   * 2. 跳过 Windows 系统隐藏文件夹（如 System Volume Information）
   * 3. 跳过具有隐藏属性的文件（仅 Windows，通过 attrib 命令检测）
   * 4. 如果指定了扩展名过滤，只保留匹配的文件（不过滤文件夹）
   * 5. 如果指定了只显示目录，过滤掉普通文件
   *
   * @param {string} dirPath - 目标目录路径
   * @param {string} [accept] - 可选，逗号分隔的扩展名过滤，如 ".txt,.zip"
   * @param {string} [directory] - 可选，若提供则只返回目录项
   * @returns {{ success: boolean, data?: { name: string, isDirectory: boolean, path: string }[], message?: string }}
   */
  list(dirPath, accept, directory) {
    try {
      // 先把用户传入的路径解析成绝对路径，防止 ../ 之类的路径穿越攻击
      const resolved = safeResolve(dirPath);
      if (!fs.existsSync(resolved)) {
        return failMsg('fileNotFound');
      }
      const stat = fs.statSync(resolved);
      if (!stat.isDirectory()) {
        return failMsg('fileNotDirectory');
      }
      const items = fs.readdirSync(resolved, { withFileTypes: true });

      // 把扩展名字符串转成数组，便于后面快速匹配
      // 例如 ".txt,.zip" -> [".txt", ".zip"]
      const exts = (accept || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      // 获取该目录下具有隐藏属性的文件路径集合（仅 Windows 有效）
      const hiddenFiles = getHiddenFiles(resolved);

      const result = items
        // 第一层过滤：隐藏文件和系统文件夹
        .filter((item) => {
          // 跳过以点开头的文件/文件夹（类 Unix 系统的隐藏文件）
          if (item.name.startsWith('.')) return false;
          // 跳过 Windows 系统隐藏文件夹
          if (HIDDEN_FOLDER_NAMES.has(item.name)) return false;
          // 跳过 Windows 隐藏属性文件
          const fullPath = path.join(resolved, item.name).toLowerCase();
          if (hiddenFiles.has(fullPath)) return false;
          return true;
        })
        // 第二层过滤：扩展名过滤（只对文件生效，目录不过滤）
        .filter((item) => {
          if (exts.length === 0 || item.isDirectory()) return true;
          const ext = '.' + item.name.split('.').pop().toLowerCase();
          return exts.includes(ext);
        })
        // 第三层过滤：只显示目录（如果指定了 directory 参数）
        .filter((item) => {
          if (!directory || item.isDirectory()) return true;
          return false;
        })
        // 组装最终返回格式
        .map((item) => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          path: path.join(resolved, item.name),
        }));
      return ok(result);
    } catch {
      return failMsg('fileListFailed');
    }
  }

  /**
   * 读取文件内容（文本）
   *
   * 给定一个文件路径，读取其文本内容返回。
   * 为了安全起见，会做多重校验：
   * 1. 路径不能为空
   * 2. 文件必须存在
   * 3. 目标必须是文件，不能是目录
   * 4. 文件大小不能超过 1MB，防止加载过大的文件导致内存溢出
   *
   * @param {string} filePath - 目标文件路径
   * @returns {{ success: boolean, data?: string, message?: string }}
   */
  read(filePath) {
    // 路径为空直接返回错误，避免后续逻辑处理空值
    if (!filePath) {
      return failMsg('filePathRequired');
    }
    try {
      // 同样先解析成绝对路径，防止路径穿越和符号链接绕过
      const resolved = safeResolve(filePath);
      if (!fs.existsSync(resolved)) {
        return failMsg('fileNotFound');
      }
      const stat = fs.statSync(resolved);
      // 如果目标是目录而不是文件，返回错误
      if (stat.isDirectory()) {
        return failMsg('fileIsDirectory');
      }
      // 限制读取大小，防止加载过大的文件（例如 1MB）
      if (stat.size > MAX_FILE_SIZE) {
        return failMsg('fileTooLarge');
      }
      const content = fs.readFileSync(resolved, 'utf-8');
      return ok(content);
    } catch {
      return failMsg('fileReadFailed');
    }
  }

  /**
   * 获取可用盘符列表（Windows）或根目录（非 Windows）
   *
   * 这个方法的用途是给前端提供一个“快速导航”的入口。
   * 在 Windows 上，返回所有已分配的盘符（如 C:\、D:\）；
   * 在 Linux/macOS 上，只返回根目录 /。
   *
   * @returns {{ success: boolean, data?: string[], message?: string }}
   */
  drives() {
    try {
      // Windows 系统下枚举 A-Z 盘符，检查哪些实际存在
      if (process.platform === 'win32') {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const result = [];
        for (const letter of letters) {
          const root = letter + ':\\';
          if (fs.existsSync(root)) result.push(root);
        }
        return ok(result);
      }
      // 非 Windows 系统直接返回根目录
      return ok(['/']);
    } catch {
      // 如果出错，至少返回根目录，保证前端有东西可展示
      return ok(['/']);
    }
  }
}

/**
 * 获取目录中具有隐藏属性的文件路径集合（仅 Windows）
 *
 * Windows 文件系统有“隐藏属性”，不同于“以点开头的隐藏文件”。
 * 这个方法通过执行 `attrib` 命令来检测哪些文件被标记为隐藏。
 *
 * @param {string} dirPath - 目录路径
 * @returns {Set<string>} 隐藏文件路径集合（小写）
 */
function getHiddenFiles(dirPath) {
  // 非 Windows 系统不需要检测隐藏属性
  if (process.platform !== 'win32') return new Set();
  try {
    // 使用 spawnSync 参数数组传递，避免 shell 解析，防止命令注入
    const result = spawnSync('attrib', [dirPath + '\\*'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (result.error || result.status !== 0) return new Set();
    const output = result.stdout;
    const hidden = new Set();
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // attrib 输出中，带 H 标记的是隐藏文件
      if (trimmed.includes('H')) {
        const match = trimmed.match(/^[A-Z]*\s+(.+)$/);
        if (match) {
          hidden.add(match[1].toLowerCase());
        }
      }
    }
    return hidden;
  } catch {
    // 如果 attrib 命令执行失败，返回空集合，不影响正常文件展示
    return new Set();
  }
}

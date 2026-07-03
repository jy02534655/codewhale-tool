/**
 * 文件浏览与读取相关 API
 *
 * 封装目录列表和文件内容读取两个能力，供 picker 等组件使用。
 */

import { ajaxBack, ajaxPostBack } from '@/utils/request';

/**
 * 获取目录内容列表
 *
 * @param {string} path - 目标目录路径
 * @param {string} [accept] - 可选，逗号分隔的扩展名过滤，如 ".txt,.zip"
 * @returns {Promise<{ name: string, isDirectory: boolean, path: string }[]>}
 */
export function getFileList(path, accept, directory) {
  return ajaxPostBack('/files/list', { path, accept, directory });
}

/**
 * 获取可用盘符列表
 *
 * @returns {Promise<string[]>}
 */
export function getDrives() {
  return ajaxBack('/files/drives');
}

/**
 * 读取文件内容
 *
 * @param {string} path - 目标文件路径
 * @returns {Promise<string>}
 */
export function readFile(path) {
  return ajaxBack('/files/read', { path });
}

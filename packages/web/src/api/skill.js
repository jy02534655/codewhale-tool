/**
 * Skill 相关 API
 *
 * 使用 ajaxBack/ajaxPostBack/ajaxDeleteBack 封装，
 * loading 遮罩由 request.js 层自动管理。
 */

import { ajaxBack, ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

/**
 * 获取已安装 skill 列表
 * @returns {Promise<{success: boolean, data: Array, skills?: Array}>} 包含 skill 列表的 Promise
 */
export function getSkillList() {
  return ajaxBack('/skill/list', {}, { rootProperty: 'skills' });
}

/**
 * 获取指定 skill 的详细信息（SKILL.md 内容）
 * @param {string} id - Skill ID
 * @returns {Promise<{success: boolean, data: string}>} 包含 skill 详细内容的 Promise
 */
export function getSkillDetail(id) {
  return ajaxBack('/skill/show/' + id);
}

/**
 * 安装指定 skill
 * @param {string} id - Skill ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function installSkill(id) {
  return ajaxPostBack('/skill/install', { id });
}

/**
 * 启用指定 skill
 * @param {string} id - Skill ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function enableSkill(id) {
  return ajaxPostBack('/skill/enable/' + id);
}

/**
 * 禁用指定 skill
 * @param {string} id - Skill ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function disableSkill(id) {
  return ajaxPostBack('/skill/disable/' + id);
}

/**
 * 删除指定 skill
 * @param {string} id - Skill ID
 * @returns {Promise<{success: boolean, message?: string}>} 操作结果 Promise
 */
export function removeSkill(id) {
  return ajaxDeleteBack('/skill/remove/' + id);
}

/**
 * 搜索社区 skill
 * @param {string} query - 搜索关键词
 * @returns {Promise<{success: boolean, data: Array, skills?: Array}>} 包含搜索结果列表的 Promise
 */
export function searchSkill(query) {
  return ajaxBack('/skill/search', { q: query || '' }, { rootProperty: 'skills' });
}

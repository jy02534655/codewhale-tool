/**
 * Skill 相关 API
 *
 * 使用 ajaxBack/ajaxPostBack/ajaxDeleteBack 封装，
 * loading 遮罩由 request.js 层自动管理。
 */

import { ajaxBack, ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

// 获取已安装 skill 列表
export function getSkillList() {
  return ajaxBack('/skill/list', {}, { rootProperty: 'skills' });
}

// 获取 skill 详情（SKILL.md 内容）
export function getSkillDetail(id) {
  return ajaxBack('/skill/show/' + id);
}

// 安装 skill
export function installSkill(id) {
  return ajaxPostBack('/skill/install', { id });
}

// 启用 skill
export function enableSkill(id) {
  return ajaxPostBack('/skill/enable/' + id);
}

// 禁用 skill
export function disableSkill(id) {
  return ajaxPostBack('/skill/disable/' + id);
}

// 删除 skill
export function removeSkill(id) {
  return ajaxDeleteBack('/skill/remove/' + id);
}

// 搜索社区 skill
export function searchSkill(query) {
  return ajaxBack('/skill/search', { q: query || '' }, { rootProperty: 'skills' });
}

// Skill 列表与元数据 API 接口
import { ajaxBack, ajaxPutBack } from '@/utils/request';
import { assign } from '@/utils';

// 获取全局 skill 列表
export function getGlobalSkillList() { return ajaxBack('/skill/list/global'); }

// 获取所有项目 skill 列表
export function getAllProjectSkillList() { return ajaxBack('/skill/list/projects'); }

// 合并更新元数据（alias + remark + tags）
export function updateMeta(id, data, ... params) { return ajaxPutBack('/skill/meta/' + id, assign({}, data, params), { successMessage: true }); }

// 更新 skill 排序值
export function updateSkillSortOrder({ id, ... params }) {
  return ajaxPutBack('/skill/sort/' + id, params, { successMessage: true })
}

// 获取 SKILL.md 原始内容
export function getReadme(id) { return ajaxBack('/skill/readme/' + id); }

// 保存 SKILL.md
export function saveReadme(id, content) { return ajaxPutBack('/skill/readme/' + id, { content }, { successMessage: true }); }

// 获取当前项目目录
export function getCurrentProjectDir() { return ajaxBack('/skill/current-project'); }

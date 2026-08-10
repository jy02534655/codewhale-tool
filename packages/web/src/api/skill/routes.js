// Skill 列表与元数据 API 接口
import { ajaxBack, ajaxPutBack } from '@/utils/request';

// 获取全局 skill 列表
export function getGlobalSkillList() { return ajaxBack('/skill/list/global'); }

// 获取所有项目 skill 列表
export function getAllProjectSkillList() { return ajaxBack('/skill/list/projects'); }

// 合并更新元数据（alias + remark + tags）
export function updateMeta(data) {
  return ajaxPutBack('/skill/meta', data, { successMessage: true });
}

// 更新 skill 排序值
export function updateSkillSortOrder(data) {
  return ajaxPutBack('/skill/sort', data, { successMessage: true })
}

// 获取 SKILL.md 原始内容
export function getReadme(id) { return ajaxBack('/skill/readme/' + id); }

// 保存 SKILL.md
export function saveReadme(data) {
  return ajaxPutBack('/skill/readme', data, { successMessage: true });
}

// 获取当前项目目录
export function getCurrentProjectDir() { return ajaxBack('/skill/current-project'); }

// Skill 命令与状态操作 API 接口
import { ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

// 启用 skill
export function enableSkill(id, level, projectId) { return ajaxPostBack('/skill/enable/' + id, { level, projectId }, { successMessage: true }); }

// 禁用 skill
export function disableSkill(id, level, projectId) { return ajaxPostBack('/skill/disable/' + id, { level, projectId }, { successMessage: true }); }

// 删除 skill
export function removeSkill(id, level, projectId) { return ajaxDeleteBack('/skill/remove/' + id, { level, projectId }, { successMessage: true }); }

// 将全局 skill 复制到项目 skill 目录
export function copySkillToProject(id) { return ajaxPostBack('/skill/copy-to-project/' + id, {}, { successMessage: true }); }

// 更新 skill（git pull）
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: true }); }

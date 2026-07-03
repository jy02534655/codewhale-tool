// Skill 命令与状态操作 API 接口
import { ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

// 启用 skill
export function enableSkill(id) { return ajaxPostBack('/skill/enable/' + id, {}, { successMessage: true }); }

// 禁用 skill
export function disableSkill(id) { return ajaxPostBack('/skill/disable/' + id, {}, { successMessage: true }); }

// 删除 skill
export function removeSkill(id) { return ajaxDeleteBack('/skill/remove/' + id, {}, { successMessage: true }); }

// 将全局 skill 复制到项目 skill 目录
export function copySkillToProject(id) { return ajaxPostBack('/skill/copy-to-project/' + id, {}, { successMessage: true }); }

// 更新 skill（git pull）
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: true }); }

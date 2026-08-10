// Skill 命令与状态操作 API 接口
import { ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

// 删除 skill
export function removeSkill(id, level, projectId) { return ajaxDeleteBack('/skill/remove/' + id, { level, projectId }, { successMessage: true }); }

// 将全局 skill 复制到项目 skill 目录
export function copySkillToProject({ id, projectId }) {
  return ajaxPostBack('/skill/copy-to-project/' + id, { projectId }, { successMessage: true })
}

// 更新 skill（git pull）
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: true }); }

// Skill 命令与状态操作 API 接口
import { ajaxPostBack, ajaxDeleteBack } from '@/utils/request';

// 删除 skill
export function removeSkill(data) {
  return ajaxDeleteBack('/skill/remove', data, { successMessage: true });
}

// 将全局 skill 复制到项目 skill 目录
export function copySkillToProject(data) {
  return ajaxPostBack('/skill/copy-to-project', data, { successMessage: true })
}

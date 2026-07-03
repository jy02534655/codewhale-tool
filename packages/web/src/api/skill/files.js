// Skill 文件操作 API 接口
import { ajaxBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

// 获取 skill 目录下的文件列表
export function getSkillFiles(id) { return ajaxBack('/skill/files/' + id); }

// 读取 skill 目录下的指定文件
export function readSkillFile(id, filePath) { return ajaxBack('/skill/file/' + id, { path: filePath }); }

// 保存 skill 目录下的指定文件
export function saveSkillFile(id, filePath, content) {
  return ajaxPutBack('/skill/file/' + id, { path: filePath, content }, { successMessage: true });
}

// 删除 skill 目录下的指定文件
export function removeSkillFile(id, filePath) {
  return ajaxDeleteBack('/skill/file/' + id, { path: filePath }, { successMessage: true });
}

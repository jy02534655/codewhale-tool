// Skill 文件操作 API 接口
import { ajaxBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

// 获取 skill 目录下的文件列表
export function getSkillFiles(id, level, projectId) {
  return ajaxBack('/skill/files/' + id, { level, projectId })
}

// 读取 skill 目录下的指定文件
export function readSkillFile(id, filePath, level, projectId) {
  return ajaxBack('/skill/file/' + id, { path: filePath, level, projectId })
}

// 保存 skill 目录下的指定文件
export function saveSkillFile(id, filePath, content, level, projectId) {
  return ajaxPutBack('/skill/file/' + id, { path: filePath, content, level, projectId }, { successMessage: true })
}

// 删除 skill 目录下的指定文件
export function removeSkillFile(id, filePath, level, projectId) {
  return ajaxDeleteBack('/skill/file/' + id, { path: filePath, level, projectId }, { successMessage: true })
}

// Skill 文件操作 API 接口
import { ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

// 获取 skill 目录下的文件列表
export function getSkillFiles(data) {
  return ajaxPostBack('/skill/files', data)
}

// 读取 skill 目录下的指定文件
export function readSkillFile(data) {
  return ajaxPostBack('/skill/file', data)
}

// 保存 skill 目录下的指定文件
export function saveSkillFile(data) {
  return ajaxPutBack('/skill/file', data, { successMessage: true })
}

// 删除 skill 目录下的指定文件
export function removeSkillFile(data) {
  return ajaxDeleteBack('/skill/file', data, { successMessage: true })
}

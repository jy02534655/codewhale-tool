/**
 * Skill 相关 API
 *
 * 参考 provider.js 规范： 成功消息通过第三个参数传入，由 request.js 自动显示
 * loading 遮罩由 request.js 自动管理
 */
import { ajaxBack, ajaxPostBack, ajaxDeleteBack, ajaxPutBack } from '@/utils/request'

/** 获取全部 skill */
export function getSkillList() { return ajaxBack('/skill/list') }

/** 获取全局 skill */
export function getGlobalSkillList() { return ajaxBack('/skill/list/global') }

/** 获取项目 skill */
export function getProjectSkillList() { return ajaxBack('/skill/list/project') }

/** 获取指定 skill 详情 */
export function getSkillDetail(id) { return ajaxBack('/skill/show/' + id) }

/** 启用 skill */
export function enableSkill(id) { return ajaxPostBack('/skill/enable/' + id, {}, { successMessage: true }) }

/** 禁用 skill */
export function disableSkill(id) { return ajaxPostBack('/skill/disable/' + id, {}, { successMessage: true }) }

/** 删除 skill */
export function removeSkill(id) { return ajaxDeleteBack('/skill/remove/' + id, {}, { successMessage: true }) }

/** 更新 skill（git pull） */
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: true }) }

/** 通过 SSE 流式安装 skill（返回 EventSource 实例） */
export function installFromGithubStream(repoUrl, skillPath, level) {
  const params = new URLSearchParams({
    repoUrl: repoUrl || '',
    skillPath: skillPath || '',
    level: level || 'global',
  })
  return new EventSource('/api/skill/install-github-stream?' + params.toString())
}

/** 合并更新元数据（alias + remark + tags） */
export function updateMeta(id, data) { return ajaxPutBack('/skill/meta/' + id, data, { successMessage: true }) }

/** 获取 SKILL.md 原始内容 */
export function getReadme(id) { return ajaxBack('/skill/readme/' + id) }

/** 保存 SKILL.md */
export function saveReadme(id, content) { return ajaxPutBack('/skill/readme/' + id, { content }, { successMessage: true }) }

/** 获取安装日志 */
export function getInstallLog() { return ajaxBack('/skill/install-log') }

/** 清除安装日志 */
export function clearInstallLog() { return ajaxDeleteBack('/skill/install-log') }

/** 获取当前项目目录 */
export function getCurrentProjectDir() { return ajaxBack('/skill/current-project') }
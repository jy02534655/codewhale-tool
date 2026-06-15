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

/** 安装 community skill */
export function installSkill(id, level) { return ajaxPostBack('/skill/install', { id, level }, { successMessage: 'syncSuccess' }) }

/** 启用 skill */
export function enableSkill(id) { return ajaxPostBack('/skill/enable/' + id, {}, { successMessage: 'updated' }) }

/** 禁用 skill */
export function disableSkill(id) { return ajaxPostBack('/skill/disable/' + id, {}, { successMessage: 'updated' }) }

/** 删除 skill */
export function removeSkill(id) { return ajaxDeleteBack('/skill/remove/' + id, {}, { successMessage: 'deleted' }) }

/** 更新 skill（git pull） */
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: 'updated' }) }

/** 搜索社区 skill */
export function searchSkill(query, force) {
  const params = []
  if (query) params.push('q=' + encodeURIComponent(query))
  if (force) params.push('force=true')
  return ajaxBack('/skill/search' + (params.length ? '?' + params.join('&') : ''))
}

/** 自动发现 */
export function discoverSkill(level) { return ajaxPostBack('/skill/discover', { level }, { successMessage: 'syncSuccess' }) }

/** 合并更新元数据（alias + remark + tags） */
export function updateMeta(id, data) { return ajaxPutBack('/skill/meta/' + id, data, { successMessage: 'updated' }) }

/** 获取 SKILL.md 原始内容 */
export function getReadme(id) { return ajaxBack('/skill/readme/' + id) }

/** 保存 SKILL.md */
export function saveReadme(id, content) { return ajaxPutBack('/skill/readme/' + id, { content }, { successMessage: 'updated' }) }
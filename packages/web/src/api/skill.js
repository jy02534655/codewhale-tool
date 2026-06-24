/**
 * Skill 相关 API
 *
 * 参考 provider.js 规范： 成功消息通过第三个参数传入，由 request.js 自动显示
 * loading 遮罩由 request.js 自动管理
 */
import { ajaxBack, ajaxPostBack, ajaxPostBackLong, ajaxDeleteBack, ajaxPutBack } from '@/utils/request'

/** 获取全部 skill */
export function getSkillList() { return ajaxBack('/skill/list') }

/** 获取全局 skill */
export function getGlobalSkillList() { return ajaxBack('/skill/list/global') }

/** 获取项目 skill */
export function getProjectSkillList() { return ajaxBack('/skill/list/project') }

/** 获取指定 skill 详情 */
export function getSkillDetail(id) { return ajaxBack('/skill/show/' + id) }

/** 安装 community skill */
export function installSkill(id, level) { return ajaxPostBack('/skill/install', { id, level }, { successMessage: true }) }

/** 启用 skill */
export function enableSkill(id) { return ajaxPostBack('/skill/enable/' + id, {}, { successMessage: true }) }

/** 禁用 skill */
export function disableSkill(id) { return ajaxPostBack('/skill/disable/' + id, {}, { successMessage: true }) }

/** 删除 skill */
export function removeSkill(id) { return ajaxDeleteBack('/skill/remove/' + id, {}, { successMessage: true }) }

/** 更新 skill（git pull） */
export function updateSkill(id) { return ajaxPostBack('/skill/update/' + id, {}, { successMessage: true }) }

/** 从 GitHub 仓库安装 skill */
export function installFromGithub(repoUrl, skillPath, level, proxyUrl) {
  return new EventSource('/skill/install-github', { repoUrl, skillPath, level, proxyUrl }, { successMessage: true, loading: false })
}

/** 从 ZIP 文件安装 skill */
export function installFromZip(zipSource, level, proxyUrl) {
  return ajaxPostBackLong('/skill/install-zip', { zipSource, level, proxyUrl }, { successMessage: true, loading: false })
}

/** 上传本地 ZIP 文件安装 skill（base64 编码） */
export function uploadZip(base64, fileName, level) {
  return ajaxPostBackLong('/skill/upload-zip', { base64, fileName, level }, { successMessage: true, loading: false })
}

/** 从注册表安装 skill */
export function installFromRegistry(identifier, level) {
  return ajaxPostBackLong('/skill/install-registry', { identifier, level }, { successMessage: true, loading: false })
}

/** 搜索社区 skill */
export function searchSkill(query, force) {
  const params = []
  if (query) params.push('q=' + encodeURIComponent(query))
  if (force) params.push('force=true')
  return ajaxBack('/skill/search' + (params.length ? '?' + params.join('&') : ''))
}

/** 检查 Skillhub CLI 安装状态 */
export function skillhubStatus() { return ajaxBack('/skill/skillhub/status') }

/** 安装 Skillhub CLI */
export function skillhubInstall() { return ajaxPostBack('/skill/skillhub/install', {}, { successMessage: true }) }

/** 通过 Skillhub 搜索技能 */
export function skillhubSearch(keyword) { return ajaxPostBack('/skill/skillhub/search', { keyword }) }

/** 通过 Skillhub 安装技能 */
export function skillhubInstallSkill(name) { return ajaxPostBack('/skill/skillhub/install-skill', { name }, { successMessage: true }) }

/** 自动发现 */
export function discoverSkill(level) { return ajaxPostBack('/skill/discover', { level }, { successMessage: true }) }

/** 合并更新元数据（alias + remark + tags） */
export function updateMeta(id, data) { return ajaxPutBack('/skill/meta/' + id, data, { successMessage: true }) }

/** 获取 SKILL.md 原始内容 */
export function getReadme(id) { return ajaxBack('/skill/readme/' + id) }

/** 保存 SKILL.md */
export function saveReadme(id, content) { return ajaxPutBack('/skill/readme/' + id, { content }, { successMessage: true }) }

/** GitHub 仓库安装（SSE 实时进度流，返回 EventSource 实例） */
export function installFromGithubStream(repoUrl, skillPath, proxyUrl) {
  var params = new URLSearchParams({
    repoUrl: repoUrl || '',
    skillPath: skillPath || '',
    proxyUrl: proxyUrl || '',
  })
  return new EventSource('/api/skill/install-github-stream?' + params.toString())
}
// 统一文件编辑/预览辅助，供 Skill 详情与弹窗复用。
import { computed } from 'vue'

// 引入 markdown 渲染器。
import { marked } from 'marked'

// 引入代码高亮能力。
import hljs from 'highlight.js'

// Markdown 文件扩展名集合。
const markdownExtensions = ['md', 'markdown']

// 代码文件扩展名集合。
const codeExtensions = ['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'json', 'css', 'scss', 'sass', 'less', 'html', 'vue', 'yml', 'yaml', 'toml', 'ini', 'sh', 'ps1', 'bash', 'zsh', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'php', 'sql', 'xml', 'env']

// 普通文本扩展名集合。
const textExtensions = ['txt', 'gitignore', 'npmrc', 'editorconfig']

// 配置 markdown 基础渲染行为。
marked.setOptions({
  gfm: true,
  breaks: true,
})

// 获取文件名。
function getFilename(filePath) {
  // 拆分路径并返回最后一段文件名。
  const segments = String(filePath || '').split('/')
  return segments[segments.length - 1] || ''
}

// 提取扩展名。
export function getFileExtension(filePath) {
  // 先拿到基础文件名，避免目录干扰判断。
  const filename = getFilename(filePath)

  // 用点分隔文件名，兼容多段后缀。
  const parts = filename.split('.')

  // 空路径时直接返回空字符串。
  if (!filename) return ''

  // 处理 `.gitignore` 这类隐藏文件扩展名。
  if (filename.charAt(0) === '.' && parts.length === 2) return parts[1].toLowerCase()

  // 普通文件返回最后一段后缀。
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

// 获取展示模式。
export function getPreviewMode(filePath) {
  // 基于文件后缀判断预览类型。
  const ext = getFileExtension(filePath)

  // Markdown 文件走富文本预览。
  if (markdownExtensions.indexOf(ext) !== -1) return 'markdown'

  // 代码文件走高亮代码预览。
  if (codeExtensions.indexOf(ext) !== -1) return 'code'

  // 其余回退为纯文本。
  return 'text'
}

// 判断当前文件是否可编辑。
export function isEditableTextFile(filePath) {
  // 提取后缀后统一走白名单判断。
  const ext = getFileExtension(filePath)

  // 允许编辑 README、Markdown、代码与常见文本配置文件。
  return filePath === 'SKILL.md' || markdownExtensions.indexOf(ext) !== -1 || codeExtensions.indexOf(ext) !== -1 || textExtensions.indexOf(ext) !== -1
}

// 获取模式标签。
export function getPreviewModeLabel(filePath) {
  // 基于预览模式返回界面标签。
  const mode = getPreviewMode(filePath)

  // Markdown 模式显示 Markdown 标签。
  if (mode === 'markdown') return 'Markdown'

  // 代码模式显示 Code 标签。
  if (mode === 'code') return 'Code'

  // 纯文本模式显示 Text 标签。
  return 'Text'
}

// 渲染 markdown 内容。
export function renderMarkdown(content) {
  // 始终把输入转成字符串，避免 null/undefined 破坏渲染。
  return marked.parse(String(content || ''))
}

// 将代码渲染为高亮 HTML。
export function renderCodeAsHtml(content, filePath) {
  // 归一化代码内容。
  const code = String(content || '')

  // 尝试从路径推导语言类型。
  const lang = getFileExtension(filePath)

  // 已知语言时走精确高亮，避免自动识别误判。
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value
  }

  // 未知语言时回退到自动识别。
  return hljs.highlightAuto(code).value
}

// 判断是否适合做基础语法检查。
function canValidateSyntax(filePath) {
  // 当前仅对结构化文本做轻量检查。
  const ext = getFileExtension(filePath)
  return ['json', 'yml', 'yaml'].indexOf(ext) !== -1
}

// 对常见文本做轻量语法提示。
export function validateFileContent(filePath, content) {
  // 归一化为字符串，避免运行时空值报错。
  const text = String(content || '')

  // 提前拿到后缀供分支复用。
  const ext = getFileExtension(filePath)

  // 不支持检查的文件直接视为通过。
  if (!canValidateSyntax(filePath)) {
    return { ok: true, message: '' }
  }

  // JSON 文件使用原生解析做可靠校验。
  if (ext === 'json') {
    try {
      JSON.parse(text)
      return { ok: true, message: '' }
    } catch (err) {
      return { ok: false, message: err && err.message ? err.message : 'Invalid JSON' }
    }
  }

  // YAML 先做轻量结构提示，避免引入新依赖。
  if (ext === 'yml' || ext === 'yaml') {
    // 按行拆分，逐行做基础形态判断。
    const lines = text.split('\n')

    // 找出最早疑似缺少冒号的行。
    const invalidLine = lines.findIndex(function (line) {
      // 去掉两端空白后再判断有效性。
      const trimmed = line.trim()

      // 空行、注释行与列表项跳过检查。
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('- ')) return false

      // `key:` 这种占位行视为合法。
      if (trimmed.endsWith(':')) return false

      // 不包含冒号的普通行给出警告。
      return trimmed.indexOf(':') === -1
    })

    // 命中异常行时返回警告信息。
    if (invalidLine !== -1) {
      return { ok: false, message: 'YAML line ' + (invalidLine + 1) + ' may be missing a colon.' }
    }
  }

  // 未发现明显问题则认为通过。
  return { ok: true, message: '' }
}

// 统一提供预览与提示相关响应式数据。
export function useFilePresentation(pathRef, contentRef, t) {
  // 计算当前文件预览模式。
  const previewMode = computed(function () {
    return getPreviewMode(pathRef.value)
  })

  // 计算当前文件展示标签。
  const previewModeLabel = computed(function () {
    return getPreviewModeLabel(pathRef.value)
  })

  // Markdown 模式输出渲染后的 HTML。
  const previewHtml = computed(function () {
    return renderMarkdown(contentRef.value)
  })

  // 代码模式输出高亮后的 HTML。
  const previewCodeHtml = computed(function () {
    return renderCodeAsHtml(contentRef.value, pathRef.value)
  })

  // 生成当前内容的基础语法状态。
  const syntaxState = computed(function () {
    return validateFileContent(pathRef.value, contentRef.value)
  })

  // 将语法状态映射为 Element Plus 提示类型。
  const syntaxType = computed(function () {
    return syntaxState.value.ok ? 'success' : 'warning'
  })

  // 生成展示给用户的语法提示文案。
  const syntaxMessage = computed(function () {
    // 没有路径时不显示任何提示。
    if (!pathRef.value) return ''

    // 校验通过时展示成功文案。
    if (syntaxState.value.ok) {
      return t ? t('skill.syntaxOk') : 'Syntax looks good'
    }

    // 校验失败时拼接警告前缀与具体错误。
    return (t ? t('skill.syntaxWarning') + '：' : 'Syntax warning: ') + syntaxState.value.message
  })

  // 向外暴露所有预览相关状态。
  return {
    previewMode,
    previewModeLabel,
    previewHtml,
    previewCodeHtml,
    syntaxType,
    syntaxMessage,
  }
}

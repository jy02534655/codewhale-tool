/**
 * i18n 多语言核心模块
 *
 * 提供供应商名称、UI 文案、服务器消息的多语言映射。
 * 支持语言：zh-Hans（默认）、en、ja、pt-BR
 *
 * 通俗理解：
 * 这个文件是整个应用的“翻译字典”。凡是在界面上看到的文字、
 * 后端返回给前端的提示消息，基本都在这里按语言分类存放。
 * 业务代码里不要硬编码“已添加”“删除失败”这类字符串，
 * 而是使用这里的 key，运行时根据用户当前语言自动取对应文本。
 *
 * @module i18n
 */

/** @type {string} 当前语言环境，默认 zh-Hans */
let _currentLocale = 'zh-Hans';

/**
 * 设置全局语言环境
 *
 * 这个函数会改变整个程序后续读取翻译文本时使用的语言。
 * 一般在用户切换界面语言时调用。
 *
 * @param {string} locale 语言代码，如 'zh-Hans'、'en'、'ja'、'pt-BR'
 */
export function setLocale(locale) {
  _currentLocale = locale;
}

/**
 * 获取当前语言环境
 *
 * @returns {string} 当前语言代码
 */
export function getLocale() {
  return _currentLocale;
}

/** @typedef {'zh-Hans'|'en'|'ja'|'pt-BR'} Locale */

/** @type {Locale[]} */
export const SUPPORTED_LOCALES = ['zh-Hans', 'en', 'ja', 'pt-BR'];

/** @type {Record<Locale, string>} */
export const LOCALE_LABELS = {
  'zh-Hans': '简体中文',
  'en': 'English',
  'ja': '日本語',
  'pt-BR': 'Português (BR)',
};

/**
 * 供应商多语言映射
 *
 * key 是供应商在代码中的内部 id，value 是各语言下的显示名称。
 * 这样前端显示供应商列表时，可以根据用户当前语言自动切换名称。
 *
 * key = provider id，value = Record<Locale, string>
 */
export const PROVIDER_I18N = {
  deepseek: { 'zh-Hans': 'DeepSeek', en: 'DeepSeek', ja: 'DeepSeek', 'pt-BR': 'DeepSeek' },
  siliconflow: { 'zh-Hans': '硅基流动', en: 'SiliconFlow', ja: 'SiliconFlow', 'pt-BR': 'SiliconFlow' },
  openrouter: { 'zh-Hans': 'OpenRouter', en: 'OpenRouter', ja: 'OpenRouter', 'pt-BR': 'OpenRouter' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM', en: 'NVIDIA NIM', ja: 'NVIDIA NIM', 'pt-BR': 'NVIDIA NIM' },
  atlascloud: { 'zh-Hans': 'AtlasCloud', en: 'AtlasCloud', ja: 'AtlasCloud', 'pt-BR': 'AtlasCloud' },
  'wanjie-ark': { 'zh-Hans': '万界方舟', en: 'Wanjie Ark', ja: '万界方舟', 'pt-BR': 'Wanjie Ark' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo', en: 'Xiaomi MiMo', ja: '小米 MiMo', 'pt-BR': 'Xiaomi MiMo' },
  novita: { 'zh-Hans': 'Novita', en: 'Novita', ja: 'Novita', 'pt-BR': 'Novita' },
  fireworks: { 'zh-Hans': 'Fireworks', en: 'Fireworks', ja: 'Fireworks', 'pt-BR': 'Fireworks' },
  openai: { 'zh-Hans': 'OpenAI（兼容）', en: 'OpenAI / Compat', ja: 'OpenAI（互換）', 'pt-BR': 'OpenAI / Compat' },
  sglang: { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)', ja: 'SGLang（自前）', 'pt-BR': 'SGLang (Self)' },
  vllm: { 'zh-Hans': 'vLLM（自托管）', en: 'vLLM (Self)', ja: 'vLLM（自前）', 'pt-BR': 'vLLM (Self)' },
  ollama: { 'zh-Hans': 'Ollama（本地）', en: 'Ollama (Local)', ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

/**
 * 根据供应商 id 和当前语言，获取供应商的显示名称。
 *
 * 如果某个供应商没有配置当前语言的名称，会回退到简体中文名称；
 * 如果连简体中文都没有，就直接返回供应商 id 本身。
 *
 * @param {string} providerId 供应商内部 id
 * @param {string} locale 目标语言代码
 * @returns {string} 该供应商在该语言下的显示名称
 */
export function getProviderI18nLabel(providerId, locale) {
  const map = PROVIDER_I18N[providerId];
  if (!map) return providerId;
  return map[locale] || map['zh-Hans'] || providerId;
}

/**
 * 获取所有已知供应商的 id 和显示名称列表。
 *
 * 主要用于前端下拉框等需要展示“所有可选供应商”的场景。
 *
 * @param {string} locale 目标语言代码
 * @returns {Array<{ id: string, label: string }>}
 */
export function getKnownProviders(locale) {
  return Object.entries(PROVIDER_I18N).map(([id, labels]) => ({
    id,
    label: labels[locale] || labels['zh-Hans'] || id,
  }));
}

/**
 * 获取某个供应商的默认 API 地址。
 *
 * 不同供应商的 API 地址不同，这里集中管理，避免硬编码在业务逻辑里。
 * 如果某个供应商没有配置默认地址，返回空字符串，由前端或业务侧处理。
 *
 * @param {string} providerId 供应商内部 id
 * @returns {string} 默认 Base URL
 */
export function getDefaultBaseUrl(providerId) {
  const urls = {
    deepseek: 'https://api.deepseek.com',
    siliconflow: 'https://api.siliconflow.cn/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    openai: 'https://api.openai.com/v1',
    novita: 'https://api.novita.ai/v3/openai',
    fireworks: 'https://api.fireworks.ai/inference/v1',
  };
  return urls[providerId] || '';
}

// ════════════════════════════════════════════════════════════════
// 服务器消息多语言
// ════════════════════════════════════════════════════════════════

/**
 * 服务器端 API 返回消息的多语言映射
 *
 * 这些消息会在用户执行某些操作后返回给前端，用于显示成功提示、错误提示等。
 * key 是消息的内部标识，value 是带占位符（如 {count}）的模板字符串。
 * 占位符会在实际使用时被替换成真实数值。
 */
export const SERVER_MSG = {
  'zh-Hans': {
    providerNotFound: '供应商不存在',
    officialKeyNotFound: 'API key 不存在',
    added: '已添加',
    deleted: '已删除',
    updated: '已更新',
    defaultSet: '已设为默认',
    activated: '已激活',
    deactivated: '已切换回官方 API',
    modelAdded: '模型已添加',
    modelDeleted: '模型已删除',
    modelSet: '当前模型已切换',
    aliasUpdated: '别名已更新',
    notFound: '未找到',
    projectNotFound: '项目未找到',
    synced: '同步完成',

    keyRequired: 'api_key 不能为空',
    keyDuplicate: '该 API key 已存在',
    keyNotFound: 'API key 不存在',
    providerRequired: 'provider 类型不能为空',
    providerDuplicate: '该供应商已存在(相同类型 + 相同 api_key)',
    modelDuplicate: '模型已存在',
    modelNotFound: '模型不存在',
    modelMinOne: '至少保留一个模型',
    providerNoModels: '该供应商下没有模型',
    configNotExists: 'CodeWhale 配置不存在，跳过同步',
    configParseError: '读取 CodeWhale 配置失败',
    officialMgrNotReady: 'OfficialKeyManager 未初始化',
    validationError: '请填写完整信息',
    invalidBaseUrl: 'Base URL 格式不正确，请输入有效的 http/https 地址',
    proxyNotFound: '代理未找到',
    tokenNotFound: 'Token 未找到',
    syncMerged: '已从 CodeWhale 同步 {count} 个新条目',
    importedAlias: '从 CodeWhale 导入',
    skillAlreadyInstalled: '该技能已安装',
    skillDirNotExists: '本地路径不存在',
    skillDirNoReadme: '目录中没有 SKILL.md 文件',
    skillNotFound: '技能未安装',
    skillNotCommunity: '只有 community 来源的技能支持在线更新',
    skillMissingReadme: '安装完成但未找到 SKILL.md',
    skillUpdateStart: '开始更新 Skill: {skillId}',
    skillUpdateStarted: '正在更新 Skill: {skillId}',
    skillUpdateMissingId: '更新 Skill 失败：缺少 skillId',
    skillUpdateNotFound: '更新 Skill 失败：未找到 {skillId}',
    skillUpdateTempInstallFailed: '更新 Skill 失败（安装临时副本）: {message}',
    skillUpdateReplacing: '临时安装成功，正在替换旧版本...',
    skillUpdateReplaceFailed: '更新 Skill 失败：无法替换目录',
    skillUpdateSuccess: 'Skill 更新成功: {skillId}',
    skillUpdateUnknownError: '未知错误',
    gitCloneFailed: 'Git clone 失败',
    gitPullFailed: 'git pull 失败',
    githubApiError: 'GitHub API 请求失败',
    networkError: '网络请求失败',
    deleteDirFailed: '删除目录失败',
    skillZipDownloadFailed: 'ZIP 下载失败，请检查网络连接',
    skillNoFileUploaded: '请先选择 ZIP 文件',
    skillInstallFailed: 'Skill 安装失败',
    skillZipExtractFailed: 'ZIP 解压失败，文件可能已损坏',
    skillInvalidRepoUrl: '无效的 GitHub 仓库 URL',
    skillMultiSkillRepo: '此仓库包含多个 Skill，请指定 skill 名称',

    fileNotFound: '路径不存在',
    fileNotDirectory: '路径不是目录',
    fileListFailed: '加载目录失败',
    fileReadFailed: '读取文件失败',
    fileIsDirectory: '目标路径是目录，无法读取为文件',
    fileTooLarge: '文件过大，无法读取',
    filePathRequired: '文件路径不能为空',

    // ── 错误消息 ──
    skillErrorUnsupportedProxy: '不支持的代理协议: {type}',
    skillErrorInvalidGithubUrl: '无效的 GitHub URL: {url}',
    skillErrorSkillNotFoundRepo: '{owner}/{repo} 中未找到 {skillName}（共 {count} 个条目）',
    skillErrorAllStrategiesFailed: '所有下载策略均失败',
    skillErrorApiAllPrefixesFailed: 'API 下载失败：所有前缀均未找到 SKILL.md',
    skillErrorReadmeNotFound: 'SKILL.md 未找到',
    skillErrorProxyDownload: '代理下载失败: HTTP {status}',

    // ── 诊断日志 ──
    skillLogNewLog: '========== 新建诊断日志 ==========',
    skillLogDownloadStart: '========== 下载开始 ==========',
    skillLogParams: '参数',
    skillLogRepoInfo: '仓库信息',
    skillLogPrefixProbe: '探测前缀 ...',
    skillLogPrefixResult: '结果: {prefix}',
    skillLogTarballProbe: '探测 Tarball 大小 ...',
    skillLogSize: '大小: {size}',
    skillLogSizeUnknown: '无法探测',
    skillLogTryPrefixes: '尝试前缀列表（去重）',
    skillLogStrategyRoute: '策略路由',
    skillLogStrategyTar: '走 Tar 策略',
    skillLogStrategyApi: '走 API 策略',
    skillLogTarAttempt: 'Tar 尝试 #{n}',
    skillLogExtractResult: '提取结果',
    skillLogSuccessNFiles: '成功 ({n} 个文件)',
    skillLogFailed: '失败: {msg}',
    skillLogError: '异常: {msg}',
    skillLogApiAttempt: 'API 尝试 #{n}',
    skillLogSuccessWithReadme: '成功 (有 SKILL.md)',
    skillLogDownloadDone: '========== 下载完成 ==========',
    skillLogFinalVerifyFailed: '最终验证失败: SKILL.md 不存在',

    // ── 进度消息 ──
    skillProgressParsingRepo: '解析仓库信息...',
    skillLogProxyAgentCreated: '代理通道已创建 ({type}://{host}:{port})',
    skillProgressDetectedPrefix: '已检测到前缀: {prefix}',
    skillProgressTarballSize: 'Tarball 大小: {size}',
    skillProgressCannotDetectSize: '无法探测 Tarball 大小',
    skillProgressTarStreaming: 'Tar 流式下载...',
    skillProgressFetchingTree: '获取文件列表 (Tree API)...',
    skillProgressExtractNoReadme: '{n} 个文件，无 SKILL.md，尝试其他前缀',
    skillProgressTarFailed: 'Tar 失败: {msg}',
    skillProgressFallbackApi: '回退 API 并发下载...',
    skillProgressAlsoFailed: '前缀 "{prefix}" 也失败',
    skillProgressPrefixDone: '前缀 {prefix} 完成 ({n} 个文件)',
    skillProgressZipDownloading: '下载 ZIP...',
    skillProgressZipExtracting: '解压 ZIP...',
    skillProgressZipFailed: 'ZIP 失败: {msg}',
    skillProgressZipDone: 'ZIP 完成 ({n} 个文件)',
    skillProgressInstallDone: '安装完成',
    skillProgressInstallFailed: '安装失败',
    skillProgressUpdating: '正在更新 Skill...',
    skillProgressUpdateDone: '更新完成',
    skillProgressUpdateFailed: '更新失败',
    skillProgressDeleteDone: '删除完成',
    skillProgressDeleteFailed: '删除失败',

    // ── 诊断日志详细 ──
    skillLogDetailProxy: '代理: {proxy}',
    skillLogDetailGithub: 'GitHub: {owner}/{repo}',
    skillLogDetailBranch: '分支: {branch}',
    skillLogDetailSubdir: '子目录: {subdir}',
    skillLogDetailPrefix: '前缀: {prefix}',
    skillLogDetailOutput: '输出: {output}',

    // ── Skill 相关错误 ──
    skillErrorInvalidRepo: '仓库地址无效',
    skillErrorDownloadFailed: '下载失败',
    skillErrorExtractFailed: '解压失败',
    skillErrorNoReadme: '未找到 SKILL.md',
    skillErrorInstallFailed: '安装失败',
    skillErrorUpdateFailed: '更新失败',
    skillErrorDeleteFailed: '删除失败',

    // ── 文件相关 ──
    fileErrorReadFailed: '读取文件失败',
    fileErrorListFailed: '列出目录失败',
    fileErrorNotDirectory: '路径不是目录',
    fileErrorNotFound: '文件不存在',

    // ── 其他通用消息 ──
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    reset: '重置',
    submit: '提交',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息',
  },
  'en': {
    providerNotFound: 'Provider not found',
    officialKeyNotFound: 'API key not found',
    added: 'Added',
    deleted: 'Deleted',
    updated: 'Updated',
    defaultSet: 'Set as default',
    activated: 'Activated',
    deactivated: 'Switched back to official API',
    modelAdded: 'Model added',
    modelDeleted: 'Model deleted',
    modelSet: 'Current model switched',
    aliasUpdated: 'Alias updated',
    notFound: 'Not found',
    projectNotFound: 'Project not found',
    synced: 'Sync completed',

    keyRequired: 'api_key is required',
    keyDuplicate: 'This API key already exists',
    keyNotFound: 'API key not found',
    providerRequired: 'provider type is required',
    providerDuplicate: 'Provider already exists (same type + same api_key)',
    modelDuplicate: 'Model already exists',
    modelNotFound: 'Model not found',
    modelMinOne: 'At least one model must be kept',
    providerNoModels: 'No models under this provider',
    configNotExists: 'CodeWhale config does not exist, skipping sync',
    configParseError: 'Failed to read CodeWhale config',
    officialMgrNotReady: 'OfficialKeyManager not initialized',
    validationError: 'Please fill in all fields',
    invalidBaseUrl: 'Invalid Base URL format, please enter a valid http/https address',
    proxyNotFound: 'Proxy not found',
    tokenNotFound: 'Token not found',
    syncMerged: 'Synced {count} new entries from CodeWhale',
    importedAlias: 'Imported from CodeWhale',
    skillAlreadyInstalled: 'Skill already installed',
    skillDirNotExists: 'Local path does not exist',
    skillDirNoReadme: 'No SKILL.md in directory',
    skillNotFound: 'Skill not installed',
    skillNotCommunity: 'Only community skills support online updates',
    skillMissingReadme: 'Installation complete but SKILL.md not found',
    skillUpdateStart: 'Start updating Skill: {skillId}',
    skillUpdateStarted: 'Updating Skill: {skillId}',
    skillUpdateMissingId: 'Update Skill failed: missing skillId',
    skillUpdateNotFound: 'Update Skill failed: {skillId} not found',
    skillUpdateTempInstallFailed: 'Update Skill failed (temp install): {message}',
    skillUpdateReplacing: 'Temp install success, replacing old version...',
    skillUpdateReplaceFailed: 'Update Skill failed: cannot replace directory',
    skillUpdateSuccess: 'Skill update success: {skillId}',
    skillUpdateUnknownError: 'Unknown error',
    gitCloneFailed: 'Git clone failed',
    gitPullFailed: 'git pull failed',
    githubApiError: 'GitHub API request failed',
    networkError: 'Network request failed',
    deleteDirFailed: 'Delete directory failed',
    skillZipDownloadFailed: 'ZIP download failed, check network',
    skillNoFileUploaded: 'Please select ZIP file first',
    skillInstallFailed: 'Skill installation failed',
    skillZipExtractFailed: 'ZIP extract failed, file may be corrupted',
    skillInvalidRepoUrl: 'Invalid GitHub repo URL',
    skillMultiSkillRepo: 'This repo contains multiple Skills, please specify skill name',

    fileNotFound: 'Path does not exist',
    fileNotDirectory: 'Path is not a directory',
    fileListFailed: 'Failed to load directory',
    fileReadFailed: 'Failed to read file',
    fileIsDirectory: 'Target path is directory, cannot read as file',
    fileTooLarge: 'File too large to read',
    filePathRequired: 'File path is required',

    // ── Error messages ──
    skillErrorUnsupportedProxy: 'Unsupported proxy protocol: {type}',
    skillErrorInvalidGithubUrl: 'Invalid GitHub URL: {url}',
    skillErrorSkillNotFoundRepo: '{skillName} not found in {owner}/{repo} ({count} items)',
    skillErrorAllStrategiesFailed: 'All download strategies failed',
    skillErrorApiAllPrefixesFailed: 'API download failed: no SKILL.md found at all prefixes',
    skillErrorReadmeNotFound: 'SKILL.md not found',
    skillErrorProxyDownload: 'Proxy download failed: HTTP {status}',

    // ── Diagnostic logs ──
    skillLogNewLog: '========== New Diagnostic Log ==========',
    skillLogDownloadStart: '========== Download Start ==========',
    skillLogParams: 'Params',
    skillLogRepoInfo: 'Repo Info',
    skillLogPrefixProbe: 'Probing prefix ...',
    skillLogPrefixResult: 'Result: {prefix}',
    skillLogTarballProbe: 'Probing Tarball size ...',
    skillLogSize: 'Size: {size}',
    skillLogSizeUnknown: 'Unknown size',
    skillLogTryPrefixes: 'Trying prefix list (deduped)',
    skillLogStrategyRoute: 'Strategy route',
    skillLogStrategyTar: 'Tar strategy',
    skillLogStrategyApi: 'API strategy',
    skillLogTarAttempt: 'Tar attempt #{n}',
    skillLogExtractResult: 'Extract result',
    skillLogSuccessNFiles: 'Success ({n} files)',
    skillLogFailed: 'Failed: {msg}',
    skillLogError: 'Error: {msg}',
    skillLogApiAttempt: 'API attempt #{n}',
    skillLogSuccessWithReadme: 'Success (with SKILL.md)',
    skillLogDownloadDone: '========== Download Complete ==========',
    skillLogFinalVerifyFailed: 'Final verification failed: SKILL.md not found',

    // ── Progress messages ──
    skillProgressParsingRepo: 'Parsing repo info...',
    skillLogProxyAgentCreated: 'Proxy agent created ({type}://{host}:{port})',
    skillProgressDetectedPrefix: 'Detected prefix: {prefix}',
    skillProgressTarballSize: 'Tarball size: {size}',
    skillProgressCannotDetectSize: 'Cannot detect size',
    skillProgressTarStreaming: 'Tar streaming download...',
    skillProgressFetchingTree: 'Fetching file list (Tree API)...',
    skillProgressExtractNoReadme: '{n} files, no SKILL.md, trying other prefixes',
    skillProgressTarFailed: 'Tar failed: {msg}',
    skillProgressFallbackApi: 'Fallback API concurrent download...',
    skillProgressAlsoFailed: 'Prefix "{prefix}" also failed',
    skillProgressPrefixDone: 'Prefix {prefix} done ({n} files)',
    skillProgressZipDownloading: 'Downloading ZIP...',
    skillProgressZipExtracting: 'Extracting ZIP...',
    skillProgressZipFailed: 'ZIP failed: {msg}',
    skillProgressZipDone: 'ZIP done ({n} files)',
    skillProgressInstallDone: 'Installation done',
    skillProgressInstallFailed: 'Installation failed',
    skillProgressUpdating: 'Updating Skill...',
    skillProgressUpdateDone: 'Update done',
    skillProgressUpdateFailed: 'Update failed',
    skillProgressDeleteDone: 'Deletion done',
    skillProgressDeleteFailed: 'Deletion failed',

    // ── Diagnostic logs detailed ──
    skillLogDetailProxy: 'Proxy: {proxy}',
    skillLogDetailGithub: 'GitHub: {owner}/{repo}',
    skillLogDetailBranch: 'Branch: {branch}',
    skillLogDetailSubdir: 'Subdir: {subdir}',
    skillLogDetailPrefix: 'Prefix: {prefix}',
    skillLogDetailOutput: 'Output: {output}',

    // ── Skill related errors ──
    skillErrorInvalidRepo: 'Invalid repo URL',
    skillErrorDownloadFailed: 'Download failed',
    skillErrorExtractFailed: 'Extract failed',
    skillErrorNoReadme: 'SKILL.md not found',
    skillErrorInstallFailed: 'Installation failed',
    skillErrorUpdateFailed: 'Update failed',
    skillErrorDeleteFailed: 'Deletion failed',

    // ── File related ──
    fileErrorReadFailed: 'Read file failed',
    fileErrorListFailed: 'List directory failed',
    fileErrorNotDirectory: 'Path is not a directory',
    fileErrorNotFound: 'File not found',

    // ── Other common messages ──
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    reset: 'Reset',
    submit: 'Submit',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  },
  'ja': {
    providerNotFound: 'プロバイダが見つかりません',
    officialKeyNotFound: 'APIキーが見つかりません',
    added: '追加しました',
    deleted: '削除しました',
    updated: '更新しました',
    defaultSet: 'デフォルトに設定',
    activated: '有効化しました',
    deactivated: '公式APIに戻しました',
    modelAdded: 'モデルを追加しました',
    modelDeleted: 'モデルを削除しました',
    modelSet: '現在のモデルを切り替えました',
    aliasUpdated: 'エイリアスを更新しました',
    notFound: '見つかりません',
    projectNotFound: 'プロジェクトが見つかりません',
    synced: '同期完了',

    keyRequired: 'api_keyは必須です',
    keyDuplicate: 'このAPIキーは既に存在します',
    keyNotFound: 'APIキーが見つかりません',
    providerRequired: 'providerタイプは必須です',
    providerDuplicate: 'プロバイダは既に存在します（同じタイプ + 同じapi_key）',
    modelDuplicate: 'モデルは既に存在します',
    modelNotFound: 'モデルが見つかりません',
    modelMinOne: '少なくとも1つのモデルを残す必要があります',
    providerNoModels: 'このプロバイダにはモデルがありません',
    configNotExists: 'CodeWhale設定が存在しないため、同期をスキップします',
    configParseError: 'CodeWhale設定の読み取りに失敗しました',
    officialMgrNotReady: 'OfficialKeyManagerが初期化されていません',
    validationError: 'すべてのフィールドに入力してください',
    invalidBaseUrl: 'Base URLの形式が正しくありません。有効なhttp/httpsアドレスを入力してください',
    proxyNotFound: 'プロキシが見つかりません',
    tokenNotFound: 'トークンが見つかりません',
    syncMerged: 'CodeWhaleから{count}件の新しいエントリを同期しました',
    importedAlias: 'CodeWhaleからインポート',
    skillAlreadyInstalled: 'スキルは既にインストールされています',
    skillDirNotExists: 'ローカルパスが存在しません',
    skillDirNoReadme: 'ディレクトリにSKILL.mdがありません',
    skillNotFound: 'スキルがインストールされていません',
    skillNotCommunity: 'コミュニティスキルのみオンライン更新をサポートします',
    skillMissingReadme: 'インストール完了しましたがSKILL.mdが見つかりません',
    skillUpdateStart: 'スキル更新開始: {skillId}',
    skillUpdateStarted: 'スキル更新中: {skillId}',
    skillUpdateMissingId: 'スキル更新失敗：skillIdが不足',
    skillUpdateNotFound: 'スキル更新失敗：{skillId}が見つかりません',
    skillUpdateTempInstallFailed: 'スキル更新失敗（一時インストール）: {message}',
    skillUpdateReplacing: '一時インストール成功、旧バージョンを置換中...',
    skillUpdateReplaceFailed: 'スキル更新失敗：ディレクトリを置換できません',
    skillUpdateSuccess: 'スキル更新成功: {skillId}',
    skillUpdateUnknownError: '不明なエラー',
    gitCloneFailed: 'Git clone失敗',
    gitPullFailed: 'git pull失敗',
    githubApiError: 'GitHub APIリクエスト失敗',
    networkError: 'ネットワークリクエスト失敗',
    deleteDirFailed: 'ディレクトリ削除失敗',
    skillZipDownloadFailed: 'ZIPダウンロード失敗、ネットワークを確認してください',
    skillNoFileUploaded: 'ZIPファイルを選択してください',
    skillInstallFailed: 'スキルインストール失敗',
    skillZipExtractFailed: 'ZIP解凍失敗、ファイルが破損している可能性があります',
    skillInvalidRepoUrl: '無効なGitHubリポジトリURL',
    skillMultiSkillRepo: 'このリポジトリには複数のスキルが含まれています。スキル名を指定してください',

    fileNotFound: 'パスが存在しません',
    fileNotDirectory: 'パスはディレクトリではありません',
    fileListFailed: 'ディレクトリの読み込みに失敗',
    fileReadFailed: 'ファイルの読み取りに失敗',
    fileIsDirectory: '対象パスはディレクトリです',
    fileTooLarge: 'ファイルが大きすぎます',
    filePathRequired: 'ファイルパスが必要です',

    // ── エラーメッセージ ──
    skillErrorUnsupportedProxy: 'サポートされていないプロキシプロトコル: {type}',
    skillErrorInvalidGithubUrl: '無効なGitHub URL: {url}',
    skillErrorSkillNotFoundRepo: '{owner}/{repo} に {skillName} が見つかりません（{count}件）',
    skillErrorAllStrategiesFailed: 'すべてのダウンロード戦略が失敗しました',
    skillErrorApiAllPrefixesFailed: 'APIダウンロード失敗：すべてのプレフィックスでSKILL.mdが見つかりません',
    skillErrorReadmeNotFound: 'SKILL.mdが見つかりません',
    skillErrorProxyDownload: 'プロキシダウンロード失敗: HTTP {status}',

    // ── 診断ログ ──
    skillLogNewLog: '========== 新規診断ログ ==========',
    skillLogDownloadStart: '========== ダウンロード開始 ==========',
    skillLogParams: 'パラメータ',
    skillLogRepoInfo: 'リポジトリ情報',
    skillLogPrefixProbe: 'プレフィックスを調査中...',
    skillLogPrefixResult: '結果: {prefix}',
    skillLogTarballProbe: 'Tarballサイズを調査中...',
    skillLogSize: 'サイズ: {size}',
    skillLogSizeUnknown: 'サイズ不明',
    skillLogTryPrefixes: 'プレフィックスリストを試行（重複削除）',
    skillLogStrategyRoute: '戦略ルート',
    skillLogStrategyTar: 'Tar戦略',
    skillLogStrategyApi: 'API戦略',
    skillLogTarAttempt: 'Tar試行 #{n}',
    skillLogExtractResult: '抽出結果',
    skillLogSuccessNFiles: '成功 ({n}ファイル)',
    skillLogFailed: '失敗: {msg}',
    skillLogError: 'エラー: {msg}',
    skillLogApiAttempt: 'API試行 #{n}',
    skillLogSuccessWithReadme: '成功 (SKILL.mdあり)',
    skillLogDownloadDone: '========== ダウンロード完了 ==========',
    skillLogFinalVerifyFailed: '最終検証失敗: SKILL.mdが存在しません',

    // ── 進捗メッセージ ──
    skillProgressParsingRepo: 'リポジトリ情報を解析中...',
    skillLogProxyAgentCreated: 'プロキシエージェント作成完了 ({type}://{host}:{port})',
    skillProgressDetectedPrefix: 'プレフィックスを検出: {prefix}',
    skillProgressTarballSize: 'Tarballサイズ: {size}',
    skillProgressCannotDetectSize: 'サイズを検出できません',
    skillProgressTarStreaming: 'Tarストリーミングダウンロード...',
    skillProgressFetchingTree: 'ファイルリスト取得中 (Tree API)...',
    skillProgressExtractNoReadme: '{n}ファイル、SKILL.mdなし、他のプレフィックスを試行',
    skillProgressTarFailed: 'Tar失敗: {msg}',
    skillProgressFallbackApi: 'APIフォールバック並列ダウンロード...',
    skillProgressAlsoFailed: 'プレフィックス "{prefix}" も失敗',
    skillProgressPrefixDone: 'プレフィックス {prefix} 完了 ({n}ファイル)',
    skillProgressZipDownloading: 'ZIPダウンロード中...',
    skillProgressZipExtracting: 'ZIP解凍中...',
    skillProgressZipFailed: 'ZIP失敗: {msg}',
    skillProgressZipDone: 'ZIP完了 ({n}ファイル)',
    skillProgressInstallDone: 'インストール完了',
    skillProgressInstallFailed: 'インストール失敗',
    skillProgressUpdating: 'スキル更新中...',
    skillProgressUpdateDone: '更新完了',
    skillProgressUpdateFailed: '更新失敗',
    skillProgressDeleteDone: '削除完了',
    skillProgressDeleteFailed: '削除失敗',

    // ── 診断ログ詳細 ──
    skillLogDetailProxy: 'プロキシ: {proxy}',
    skillLogDetailGithub: 'GitHub: {owner}/{repo}',
    skillLogDetailBranch: 'ブランチ: {branch}',
    skillLogDetailSubdir: 'サブディレクトリ: {subdir}',
    skillLogDetailPrefix: 'プレフィックス: {prefix}',
    skillLogDetailOutput: '出力: {output}',

    // ── Skill関連エラー ──
    skillErrorInvalidRepo: 'リポジトリURLが無効です',
    skillErrorDownloadFailed: 'ダウンロード失敗',
    skillErrorExtractFailed: '解凍失敗',
    skillErrorNoReadme: 'SKILL.mdが見つかりません',
    skillErrorInstallFailed: 'インストール失敗',
    skillErrorUpdateFailed: '更新失敗',
    skillErrorDeleteFailed: '削除失敗',

    // ── ファイル関連 ──
    fileErrorReadFailed: 'ファイル読み取り失敗',
    fileErrorListFailed: 'ディレクトリ一覧失敗',
    fileErrorNotDirectory: 'パスはディレクトリではありません',
    fileErrorNotFound: 'ファイルが見つかりません',

    // ── その他共通メッセージ ──
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    add: '追加',
    search: '検索',
    reset: 'リセット',
    submit: '送信',
    loading: '読み込み中...',
    success: '成功',
    error: 'エラー',
    warning: '警告',
    info: '情報',
  },
  'pt-BR': {
    providerNotFound: 'Provedor não encontrado',
    officialKeyNotFound: 'API key não encontrada',
    added: 'Adicionado',
    deleted: 'Excluído',
    updated: 'Atualizado',
    defaultSet: 'Definido como padrão',
    activated: 'Ativado',
    deactivated: 'Voltado para API oficial',
    modelAdded: 'Modelo adicionado',
    modelDeleted: 'Modelo excluído',
    modelSet: 'Modelo atual alterado',
    aliasUpdated: 'Alias atualizado',
    notFound: 'Não encontrado',
    projectNotFound: 'Projeto não encontrado',
    synced: 'Sincronização concluída',

    keyRequired: 'api_key é obrigatória',
    keyDuplicate: 'Esta API key já existe',
    keyNotFound: 'API key não encontrada',
    providerRequired: 'Tipo de provider é obrigatório',
    providerDuplicate: 'Provedor já existe (mesmo tipo + mesma api_key)',
    modelDuplicate: 'Modelo já existe',
    modelNotFound: 'Modelo não encontrado',
    modelMinOne: 'Deve manter pelo menos um modelo',
    providerNoModels: 'Nenhum modelo neste provedor',
    configNotExists: 'Configuração CodeWhale não existe, pulando sincronização',
    configParseError: 'Falha ao ler configuração CodeWhale',
    officialMgrNotReady: 'OfficialKeyManager não inicializado',
    validationError: 'Preencha todas as informações',
    invalidBaseUrl: 'Formato de Base URL inválido, insira um endereço http/https válido',
    proxyNotFound: 'Proxy não encontrado',
    tokenNotFound: 'Token não encontrado',
    syncMerged: 'Sincronizados {count} novos itens do CodeWhale',
    importedAlias: 'Importado do CodeWhale',
    skillAlreadyInstalled: 'Skill já instalada',
    skillDirNotExists: 'Caminho local não existe',
    skillDirNoReadme: 'Nenhum SKILL.md no diretório',
    skillNotFound: 'Skill não instalada',
    skillNotCommunity: 'Apenas skills community suportam atualização online',
    skillMissingReadme: 'Instalação concluída mas SKILL.md não encontrado',
    skillUpdateStart: 'Iniciando atualização da Skill: {skillId}',
    skillUpdateStarted: 'Atualizando Skill: {skillId}',
    skillUpdateMissingId: 'Falha na atualização: skillId ausente',
    skillUpdateNotFound: 'Falha na atualização: {skillId} não encontrado',
    skillUpdateTempInstallFailed: 'Falha na atualização (instalação temporária): {message}',
    skillUpdateReplacing: 'Instalação temporária OK, substituindo versão antiga...',
    skillUpdateReplaceFailed: 'Falha na atualização: não foi possível substituir diretório',
    skillUpdateSuccess: 'Skill atualizada com sucesso: {skillId}',
    skillUpdateUnknownError: 'Erro desconhecido',
    gitCloneFailed: 'Git clone falhou',
    gitPullFailed: 'git pull falhou',
    githubApiError: 'Requisição GitHub API falhou',
    networkError: 'Requisição de rede falhou',
    deleteDirFailed: 'Falha ao excluir diretório',
    skillZipDownloadFailed: 'Download ZIP falhou, verifique a conexão',
    skillNoFileUploaded: 'Selecione o arquivo ZIP primeiro',
    skillInstallFailed: 'Instalação da Skill falhou',
    skillZipExtractFailed: 'Extração ZIP falhou, arquivo pode estar corrompido',
    skillInvalidRepoUrl: 'URL de repositório GitHub inválida',
    skillMultiSkillRepo: 'Este repositório contém múltiplas Skills, especifique o nome',

    fileNotFound: 'Caminho não existe',
    fileNotDirectory: 'Caminho não é um diretório',
    fileListFailed: 'Falha ao carregar diretório',
    fileReadFailed: 'Falha ao ler arquivo',
    fileIsDirectory: 'Caminho é diretório, não pode ler como arquivo',
    fileTooLarge: 'Arquivo muito grande para ler',
    filePathRequired: 'Caminho do arquivo é obrigatório',

    // ── Mensagens de erro ──
    skillErrorUnsupportedProxy: 'Protocolo de proxy não suportado: {type}',
    skillErrorInvalidGithubUrl: 'URL GitHub inválida: {url}',
    skillErrorSkillNotFoundRepo: '{skillName} não encontrado em {owner}/{repo} ({count} itens)',
    skillErrorAllStrategiesFailed: 'Todas as estratégias de download falharam',
    skillErrorApiAllPrefixesFailed: 'Download API falhou: nenhum SKILL.md encontrado em todos os prefixos',
    skillErrorReadmeNotFound: 'SKILL.md não encontrado',
    skillErrorProxyDownload: 'Download via proxy falhou: HTTP {status}',

    // ── Logs de diagnóstico ──
    skillLogNewLog: '========== Novo Log de Diagnóstico ==========',
    skillLogDownloadStart: '========== Início do Download ==========',
    skillLogParams: 'Parâmetros',
    skillLogRepoInfo: 'Informações do Repositório',
    skillLogPrefixProbe: 'Investigando prefixo...',
    skillLogPrefixResult: 'Resultado: {prefix}',
    skillLogTarballProbe: 'Investigando tamanho do Tarball...',
    skillLogSize: 'Tamanho: {size}',
    skillLogSizeUnknown: 'Tamanho desconhecido',
    skillLogTryPrefixes: 'Tentando prefixos (deduplicados)',
    skillLogStrategyRoute: 'Rota de estratégia',
    skillLogStrategyTar: 'Estratégia Tar',
    skillLogStrategyApi: 'Estratégia API',
    skillLogTarAttempt: 'Tentativa Tar #{n}',
    skillLogExtractResult: 'Resultado da extração',
    skillLogSuccessNFiles: 'Sucesso ({n} arquivos)',
    skillLogFailed: 'Falhou: {msg}',
    skillLogError: 'Erro: {msg}',
    skillLogApiAttempt: 'Tentativa API #{n}',
    skillLogSuccessWithReadme: 'Sucesso (com SKILL.md)',
    skillLogDownloadDone: '========== Download Concluído ==========',
    skillLogFinalVerifyFailed: 'Verificação final falhou: SKILL.md não existe',

    // ── Mensagens de progresso ──
    skillProgressParsingRepo: 'Analisando informações do repositório...',
    skillLogProxyAgentCreated: 'Agente proxy criado ({type}://{host}:{port})',
    skillProgressDetectedPrefix: 'Prefixo detectado: {prefix}',
    skillProgressTarballSize: 'Tamanho do Tarball: {size}',
    skillProgressCannotDetectSize: 'Não foi possível detectar o tamanho',
    skillProgressTarStreaming: 'Download streaming do Tar...',
    skillProgressFetchingTree: 'Obtendo lista de arquivos (Tree API)...',
    skillProgressExtractNoReadme: '{n} arquivos, sem SKILL.md, tentando outros prefixos',
    skillProgressTarFailed: 'Tar falhou: {msg}',
    skillProgressFallbackApi: 'Fallback para download concorrente via API...',
    skillProgressAlsoFailed: 'Prefixo "{prefix}" também falhou',
    skillProgressPrefixDone: 'Prefixo {prefix} concluído ({n} arquivos)',
    skillProgressZipDownloading: 'Baixando ZIP...',
    skillProgressZipExtracting: 'Extraindo ZIP...',
    skillProgressZipFailed: 'ZIP falhou: {msg}',
    skillProgressZipDone: 'ZIP concluído ({n} arquivos)',
    skillProgressInstallDone: 'Instalação concluída',
    skillProgressInstallFailed: 'Instalação falhou',
    skillProgressUpdating: 'Atualizando Skill...',
    skillProgressUpdateDone: 'Atualização concluída',
    skillProgressUpdateFailed: 'Atualização falhou',
    skillProgressDeleteDone: 'Exclusão concluída',
    skillProgressDeleteFailed: 'Exclusão falhou',

    // ── Logs de diagnóstico detalhados ──
    skillLogDetailProxy: 'Proxy: {proxy}',
    skillLogDetailGithub: 'GitHub: {owner}/{repo}',
    skillLogDetailBranch: 'Branch: {branch}',
    skillLogDetailSubdir: 'Subdiretório: {subdir}',
    skillLogDetailPrefix: 'Prefixo: {prefix}',
    skillLogDetailOutput: 'Saída: {output}',

    // ── Erros relacionados a Skills ──
    skillErrorInvalidRepo: 'URL do repositório inválida',
    skillErrorDownloadFailed: 'Download falhou',
    skillErrorExtractFailed: 'Extração falhou',
    skillErrorNoReadme: 'SKILL.md não encontrado',
    skillErrorInstallFailed: 'Instalação falhou',
    skillErrorUpdateFailed: 'Atualização falhou',
    skillErrorDeleteFailed: 'Exclusão falhou',

    // ── Arquivos ──
    fileErrorReadFailed: 'Falha ao ler arquivo',
    fileErrorListFailed: 'Falha ao listar diretório',
    fileErrorNotDirectory: 'Caminho não é um diretório',
    fileErrorNotFound: 'Arquivo não encontrado',

    // ── Outras mensagens gerais ──
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Buscar',
    reset: 'Redefinir',
    submit: 'Enviar',
    loading: 'Carregando...',
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Aviso',
    info: 'Informação',
  },
};

/**
 * 根据消息 key 和当前语言，获取对应的翻译文本。
 *
 * 如果某个 key 在当前语言下找不到，会回退到简体中文。
 * 如果简体中文也没有，就返回 key 本身作为兜底。
 * 文本中的 {占位符} 会被 params 对象中的对应值替换。
 *
 * 这个函数是后端返回消息给前端时的核心翻译入口。
 * 所有 result.js 里的 okMsg/failMsg 都会调用它。
 *
 * @param {string} key 消息内部标识
 * @param {Object} [params={}] 占位符替换参数，如 { count: 3 }
 * @returns {string} 翻译后的文本
 */
export function getServerMessage(key, params = {}) {
  const map = SERVER_MSG[_currentLocale] || SERVER_MSG['zh-Hans'];
  let msg = map?.[key] || SERVER_MSG['zh-Hans']?.[key] || key;
  for (const [k, v] of Object.entries(params)) {
    msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return msg;
}

/**
 * i18n 多语言核心模块
 *
 * 提供供应商名称、UI 文案、服务器消息的多语言映射。
 * 支持语言：zh-Hans（默认）、en、ja、pt-BR
 *
 * @module i18n
 */

/** @type {string} 当前语言环境，默认 zh-Hans */
let _currentLocale = 'zh-Hans';

/**
 * 设置全局语言环境
 * @param {string} locale
 */
export function setLocale(locale) {
  _currentLocale = locale;
}

/**
 * 获取当前语言环境
 * @returns {string}
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
 * key = provider id，value = Record<Locale, string>
 */
export const PROVIDER_I18N = {
  deepseek: { 'zh-Hans': 'DeepSeek', en: 'DeepSeek', ja: 'DeepSeek', 'pt-BR': 'DeepSeek' },
  siliconflow: { 'zh-Hans': '硅基流动', en: 'SiliconFlow', ja: 'SiliconFlow', 'pt-BR': 'SiliconFlow' },
  openrouter: { 'zh-Hans': 'OpenRouter', en: 'OpenRouter', ja: 'OpenRouter', 'pt-BR': 'OpenRouter' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM', en: 'NVIDIA NIM', ja: 'NVIDIA NIM', 'pt-BR': 'NVIDIA NIM' },
  atlascloud: { 'zh-Hans': 'AtlasCloud', en: 'AtlasCloud', ja: 'AtlasCloud', 'pt-BR': 'AtlasCloud' },
  'wanjie-ark': { 'zh-Hans': '万界方舟', en: 'Wanjie Ark', ja: '万界方舟', 'pt-BR': 'Wanjie Ark' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo', en: 'Xiaomi MiMo', ja: 'Xiaomi MiMo', 'pt-BR': 'Xiaomi MiMo' },
  novita: { 'zh-Hans': 'Novita', en: 'Novita', ja: 'Novita', 'pt-BR': 'Novita' },
  fireworks: { 'zh-Hans': 'Fireworks', en: 'Fireworks', ja: 'Fireworks', 'pt-BR': 'Fireworks' },
  openai: { 'zh-Hans': 'OpenAI（兼容）', en: 'OpenAI / Compat', ja: 'OpenAI（互換）', 'pt-BR': 'OpenAI / Compat' },
  sglang: { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)', ja: 'SGLang（自前）', 'pt-BR': 'SGLang (Self)' },
  vllm: { 'zh-Hans': 'vLLM（自托管）', en: 'vLLM (Self)', ja: 'vLLM（自前）', 'pt-BR': 'vLLM (Self)' },
  ollama: { 'zh-Hans': 'Ollama（本地）', en: 'Ollama (Local)', ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

export function getProviderI18nLabel(providerId, locale) {
  const map = PROVIDER_I18N[providerId];
  if (!map) return providerId;
  return map[locale] || map['zh-Hans'] || providerId;
}

export function getKnownProviders(locale) {
  return Object.entries(PROVIDER_I18N).map(([id, labels]) => ({
    id,
    label: labels[locale] || labels['zh-Hans'] || id,
  }));
}

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
 */
export const SERVER_MSG = {
  'zh-Hans': {
    providerNotFound: '供应商不存在',
    officialKeyNotFound: 'API key 不存在',
    added: '已添加',
    deleted: '已删除',
    updated: '已更新',
    activated: '已激活',
    deactivated: '已切换回官方 API',
    modelAdded: '模型已添加',
    modelDeleted: '模型已删除',
    modelSet: '当前模型已切换',
    keyAdded: '已添加',
    keyActivated: '已激活',
    aliasUpdated: '别名已更新',
    notFound: '未找到',
    synced: '同步完成',

    KEY_REQUIRED: 'api_key 不能为空',
    KEY_DUPLICATE: '该 API key 已存在',
    KEY_NOT_FOUND: 'API key 不存在',
    PROVIDER_REQUIRED: 'provider 类型不能为空',
    PROVIDER_DUPLICATE: '该供应商已存在（相同类型 + 相同 api_key）',
    PROVIDER_NOT_FOUND: '供应商不存在',
    MODEL_DUPLICATE: '模型已存在',
    MODEL_NOT_FOUND: '模型不存在',
    MODEL_MIN_ONE: '至少保留一个模型',
    PROVIDER_NO_MODELS: '该供应商下没有模型',
    CONFIG_NOT_EXISTS: 'CodeWhale 配置不存在，跳过同步',
    CONFIG_PARSE_ERROR: '读取 CodeWhale 配置失败',
    OFFICIAL_MGR_NOT_READY: 'OfficialKeyManager 未初始化',
    VALIDATION_ERROR: '请填写完整信息',
    PROXY_NOT_FOUND: '代理未找到',
    TOKEN_NOT_FOUND: 'Token 未找到',
    SYNC_MERGED: '已从 CodeWhale 同步 {count} 个新条目',
    IMPORTED_ALIAS: '从 CodeWhale 导入',
    SKILL_ALREADY_INSTALLED: '该技能已安装',
    SKILL_DIR_NOT_EXISTS: '本地路径不存在',
    SKILL_DIR_NO_README: '目录中没有 SKILL.md 文件',
    SKILL_NOT_FOUND: '技能未安装',
    SKILL_NOT_COMMUNITY: '只有 community 来源的技能支持在线更新',
    SKILL_MISSING_README: '安装完成但未找到 SKILL.md',
    GIT_CLONE_FAILED: 'Git clone 失败',
    GIT_PULL_FAILED: 'git pull 失败',
    GITHUB_API_ERROR: 'GitHub API 请求失败',
    NETWORK_ERROR: '网络请求失败',
    DELETE_DIR_FAILED: '删除目录失败',
    SKILL_ZIP_DOWNLOAD_FAILED: 'ZIP 下载失败，请检查网络连接',
    SKILL_INSTALL_FAILED: 'Skill 安装失败',
    SKILL_ZIP_EXTRACT_FAILED: 'ZIP 解压失败，文件可能已损坏',
    SKILL_INVALID_REPO_URL: '无效的 GitHub 仓库 URL',
    SKILL_MULTI_SKILL_REPO: '此仓库包含多个 Skill，请指定 skill 名称',

    // ── 错误消息 ──
    SKILL_ERROR_UNSUPPORTED_PROXY: '不支持的代理协议: {type}',
    SKILL_ERROR_INVALID_GITHUB_URL: '无效的 GitHub URL: {url}',
    SKILL_ERROR_SKILL_NOT_FOUND_REPO: '{owner}/{repo} 中未找到 {skillName}（共 {count} 个条目）',
    SKILL_ERROR_ALL_STRATEGIES_FAILED: '所有下载策略均失败',
    SKILL_ERROR_API_ALL_PREFIXES_FAILED: 'API 下载失败：所有前缀均未找到 SKILL.md',
    SKILL_ERROR_README_NOT_FOUND: 'SKILL.md 未找到',
    SKILL_ERROR_PROXY_DOWNLOAD: '代理下载失败: HTTP {status}',

    // ── 诊断日志 ──
    SKILL_LOG_NEW_LOG: '========== 新建诊断日志 ==========',
    SKILL_LOG_DOWNLOAD_START: '========== 下载开始 ==========',
    SKILL_LOG_PARAMS: '参数',
    SKILL_LOG_REPO_INFO: '仓库信息',
    SKILL_LOG_PREFIX_PROBE: '探测前缀 ...',
    SKILL_LOG_PREFIX_RESULT: '结果: {prefix}',
    SKILL_LOG_TARBALL_PROBE: '探测 Tarball 大小 ...',
    SKILL_LOG_SIZE: '大小: {size}',
    SKILL_LOG_SIZE_UNKNOWN: '无法探测',
    SKILL_LOG_TRY_PREFIXES: '尝试前缀列表（去重）',
    SKILL_LOG_STRATEGY_ROUTE: '策略路由',
    SKILL_LOG_STRATEGY_TAR: '走 Tar 策略',
    SKILL_LOG_STRATEGY_API: '走 API 策略',
    SKILL_LOG_TAR_ATTEMPT: 'Tar 尝试 #{n}',
    SKILL_LOG_EXTRACT_RESULT: '提取结果',
    SKILL_LOG_SUCCESS_N_FILES: '成功 ({n} 个文件)',
    SKILL_LOG_FAILED: '失败: {msg}',
    SKILL_LOG_ERROR: '异常: {msg}',
    SKILL_LOG_API_ATTEMPT: 'API 尝试 #{n}',
    SKILL_LOG_SUCCESS_WITH_README: '成功 (有 SKILL.md)',
    SKILL_LOG_DOWNLOAD_DONE: '========== 下载完成 ==========',
    SKILL_LOG_FINAL_VERIFY_FAILED: '最终验证失败: SKILL.md 不存在',

    // ── 进度消息 ──
    SKILL_PROGRESS_PARSING_REPO: '解析仓库信息...',
    SKILL_PROGRESS_DETECTED_PREFIX: '已检测到前缀: {prefix}',
    SKILL_PROGRESS_TARBALL_SIZE: 'Tarball 大小: {size}',
    SKILL_PROGRESS_CANNOT_DETECT_SIZE: '无法探测 Tarball 大小',
    SKILL_PROGRESS_TAR_STREAMING: 'Tar 流式下载...',
    SKILL_PROGRESS_FETCHING_TREE: '获取文件列表 (Tree API)...',
    SKILL_PROGRESS_EXTRACT_NO_README: '{n} 个文件，无 SKILL.md，尝试其他前缀',
    SKILL_PROGRESS_TAR_FAILED: 'Tar 失败: {msg}',
    SKILL_PROGRESS_FALLBACK_API: '回退 API 并发下载...',
    SKILL_PROGRESS_ALSO_FAILED: '前缀 "{prefix}" 也失败: {msg}',
    SKILL_PROGRESS_REGISTERING: '注册 Skill...',
    SKILL_PROGRESS_DONE: '安装完成',
    SKILL_PROGRESS_CONNECTING_GITHUB: '连接 GitHub...',
    SKILL_PROGRESS_DOWNLOADING_PCT: '下载中 {pct}%',
    SKILL_PROGRESS_EXTRACTING: '解压中...',
    SKILL_PROGRESS_GIT_SPARSE_CLONE: 'git sparse clone...',
    SKILL_PROGRESS_SPARSE_CHECKOUT: 'sparse-checkout: {path}...',
    SKILL_PROGRESS_CHECKOUT_FILES: 'checkout files...',
    SKILL_PROGRESS_COPYING: '复制到目标目录...',
    SKILL_PROGRESS_CLONE_DONE: 'clone 完成',
    SKILL_PROGRESS_FINDING_SKILL_DIR: '定位 Skill 目录...',
  },
  'en': {
    providerNotFound: 'Vendor not found',
    officialKeyNotFound: 'API key not found',
    added: 'Added',
    deleted: 'Deleted',
    updated: 'Updated',
    activated: 'Activated',
    deactivated: 'Switched to official API',
    modelAdded: 'Model added',
    modelDeleted: 'Model deleted',
    modelSet: 'Model switched',
    keyAdded: 'Added',
    keyActivated: 'Activated',
    aliasUpdated: 'Alias updated',
    notFound: 'Not found',
    synced: 'Synced',

    KEY_REQUIRED: 'api_key is required',
    KEY_DUPLICATE: 'This API key already exists',
    KEY_NOT_FOUND: 'API key not found',
    PROVIDER_REQUIRED: 'Provider type is required',
    PROVIDER_DUPLICATE: 'This provider already exists (same type + same api_key)',
    PROVIDER_NOT_FOUND: 'Provider not found',
    MODEL_DUPLICATE: 'Model already exists',
    MODEL_NOT_FOUND: 'Model not found',
    MODEL_MIN_ONE: 'At least one model is required',
    PROVIDER_NO_MODELS: 'This provider has no models',
    CONFIG_NOT_EXISTS: 'CodeWhale config not found, skip sync',
    CONFIG_PARSE_ERROR: 'Failed to read CodeWhale config',
    OFFICIAL_MGR_NOT_READY: 'OfficialKeyManager not initialized',
    VALIDATION_ERROR: 'Please fill in all required fields',
    PROXY_NOT_FOUND: 'Proxy not found',
    TOKEN_NOT_FOUND: 'Token not found',
    SYNC_MERGED: 'Synced {count} new entries from CodeWhale',
    IMPORTED_ALIAS: 'Imported from CodeWhale',
    SKILL_ALREADY_INSTALLED: 'Skill already installed',
    SKILL_DIR_NOT_EXISTS: 'Local path does not exist',
    SKILL_DIR_NO_README: 'SKILL.md not found in directory',
    SKILL_NOT_FOUND: 'Skill not installed',
    SKILL_NOT_COMMUNITY: 'Only community skills support online updates',
    SKILL_MISSING_README: 'SKILL.md not found after installation',
    GIT_CLONE_FAILED: 'Git clone failed',
    GIT_PULL_FAILED: 'git pull failed',
    GITHUB_API_ERROR: 'GitHub API request failed',
    NETWORK_ERROR: 'Network request failed',
    DELETE_DIR_FAILED: 'Failed to delete directory',
    SKILL_ZIP_DOWNLOAD_FAILED: 'ZIP download failed, check network connection',
    SKILL_INSTALL_FAILED: 'Skill installation failed',
    SKILL_ZIP_EXTRACT_FAILED: 'ZIP extraction failed, file may be corrupted',
    SKILL_INVALID_REPO_URL: 'Invalid GitHub repository URL',
    SKILL_MULTI_SKILL_REPO: 'This repo contains multiple skills, please specify a skill name',

    SKILL_ERROR_UNSUPPORTED_PROXY: 'Unsupported proxy type: {type}',
    SKILL_ERROR_INVALID_GITHUB_URL: 'Invalid GitHub URL: {url}',
    SKILL_ERROR_SKILL_NOT_FOUND_REPO: '{skillName} not found in {owner}/{repo} ({count} entries)',
    SKILL_ERROR_ALL_STRATEGIES_FAILED: 'All download strategies failed',
    SKILL_ERROR_API_ALL_PREFIXES_FAILED: 'API download failed: SKILL.md not found in any prefix',
    SKILL_ERROR_README_NOT_FOUND: 'SKILL.md not found',
    SKILL_ERROR_PROXY_DOWNLOAD: 'Proxy download failed: HTTP {status}',

    SKILL_LOG_NEW_LOG: '========== New Log ==========',
    SKILL_LOG_DOWNLOAD_START: '========== Download Start ==========',
    SKILL_LOG_PARAMS: 'Parameters',
    SKILL_LOG_REPO_INFO: 'Repository Info',
    SKILL_LOG_PREFIX_PROBE: 'Probe prefix ...',
    SKILL_LOG_PREFIX_RESULT: 'Result: {prefix}',
    SKILL_LOG_TARBALL_PROBE: 'Probe tarball size ...',
    SKILL_LOG_SIZE: 'Size: {size}',
    SKILL_LOG_SIZE_UNKNOWN: 'Cannot detect',
    SKILL_LOG_TRY_PREFIXES: 'Try prefixes (deduped)',
    SKILL_LOG_STRATEGY_ROUTE: 'Strategy route',
    SKILL_LOG_STRATEGY_TAR: 'Tar strategy',
    SKILL_LOG_STRATEGY_API: 'API strategy',
    SKILL_LOG_TAR_ATTEMPT: 'Tar attempt #{n}',
    SKILL_LOG_EXTRACT_RESULT: 'Extract result',
    SKILL_LOG_SUCCESS_N_FILES: 'Success ({n} files)',
    SKILL_LOG_FAILED: 'Failed: {msg}',
    SKILL_LOG_ERROR: 'Error: {msg}',
    SKILL_LOG_API_ATTEMPT: 'API attempt #{n}',
    SKILL_LOG_SUCCESS_WITH_README: 'Success (with SKILL.md)',
    SKILL_LOG_DOWNLOAD_DONE: '========== Download Complete ==========',
    SKILL_LOG_FINAL_VERIFY_FAILED: 'Final verify failed: SKILL.md not found',

    SKILL_PROGRESS_PARSING_REPO: 'Parsing repo info...',
    SKILL_PROGRESS_DETECTED_PREFIX: 'Detected prefix: {prefix}',
    SKILL_PROGRESS_TARBALL_SIZE: 'Tarball size: {size}',
    SKILL_PROGRESS_CANNOT_DETECT_SIZE: 'Cannot detect tarball size',
    SKILL_PROGRESS_TAR_STREAMING: 'Tar streaming...',
    SKILL_PROGRESS_FETCHING_TREE: 'Fetching tree (Tree API)...',
    SKILL_PROGRESS_EXTRACT_NO_README: '{n} files, no SKILL.md, trying other prefixes',
    SKILL_PROGRESS_TAR_FAILED: 'Tar failed: {msg}',
    SKILL_PROGRESS_FALLBACK_API: 'Fallback to API concurrent download...',
    SKILL_PROGRESS_ALSO_FAILED: 'Prefix "{prefix}" also failed: {msg}',
    SKILL_PROGRESS_REGISTERING: 'Registering skill...',
    SKILL_PROGRESS_DONE: 'Installation complete',
    SKILL_PROGRESS_CONNECTING_GITHUB: 'Connecting to GitHub...',
    SKILL_PROGRESS_DOWNLOADING_PCT: 'Downloading {pct}%',
    SKILL_PROGRESS_EXTRACTING: 'Extracting...',
    SKILL_PROGRESS_GIT_SPARSE_CLONE: 'git sparse clone...',
    SKILL_PROGRESS_SPARSE_CHECKOUT: 'sparse-checkout: {path}...',
    SKILL_PROGRESS_CHECKOUT_FILES: 'checkout files...',
    SKILL_PROGRESS_COPYING: 'Copying to target...',
    SKILL_PROGRESS_CLONE_DONE: 'clone complete',
    SKILL_PROGRESS_FINDING_SKILL_DIR: 'Locating skill directory...',
  },
  'ja': {
    providerNotFound: 'ベンダーが見つかりません',
    officialKeyNotFound: 'APIキーが見つかりません',
    added: '追加しました',
    deleted: '削除しました',
    updated: '更新しました',
    activated: '有効化しました',
    deactivated: '公式APIに切り替えました',
    modelAdded: 'モデルを追加しました',
    modelDeleted: 'モデルを削除しました',
    modelSet: 'モデルを切り替えました',
    keyAdded: '追加しました',
    keyActivated: '有効化しました',
    aliasUpdated: '別名を更新しました',
    notFound: '見つかりません',
    synced: '同期完了',

    KEY_REQUIRED: 'api_key は必須です',
    KEY_DUPLICATE: 'このAPIキーは既に存在します',
    KEY_NOT_FOUND: 'APIキーが見つかりません',
    PROVIDER_REQUIRED: 'プロバイダー種別は必須です',
    PROVIDER_DUPLICATE: 'このプロバイダーは既に存在します',
    PROVIDER_NOT_FOUND: 'プロバイダーが見つかりません',
    MODEL_DUPLICATE: 'モデルは既に存在します',
    MODEL_NOT_FOUND: 'モデルが見つかりません',
    MODEL_MIN_ONE: '少なくとも1つのモデルが必要です',
    PROVIDER_NO_MODELS: 'このプロバイダーにはモデルがありません',
    CONFIG_NOT_EXISTS: 'CodeWhale設定が見つかりません',
    CONFIG_PARSE_ERROR: 'CodeWhale設定の読み取りに失敗しました',
    OFFICIAL_MGR_NOT_READY: 'OfficialKeyManager が初期化されていません',
    VALIDATION_ERROR: '必須項目を入力してください',
    PROXY_NOT_FOUND: 'プロキシが見つかりません',
    TOKEN_NOT_FOUND: 'トークンが見つかりません',
    SYNC_MERGED: 'CodeWhale から {count} 件の新規エントリーを同期しました',
    IMPORTED_ALIAS: 'CodeWhale からインポート',
    SKILL_ALREADY_INSTALLED: 'スキルは既にインストールされています',
    SKILL_DIR_NOT_EXISTS: 'ローカルパスが存在しません',
    SKILL_DIR_NO_README: 'ディレクトリにSKILL.mdがありません',
    SKILL_NOT_FOUND: 'スキルがインストールされていません',
    SKILL_NOT_COMMUNITY: 'コミュニティスキルのみオンライン更新可能です',
    SKILL_MISSING_README: 'インストール後にSKILL.mdが見つかりません',
    GIT_CLONE_FAILED: 'Git clone に失敗しました',
    GIT_PULL_FAILED: 'git pull に失敗しました',
    GITHUB_API_ERROR: 'GitHub API リクエストに失敗しました',
    NETWORK_ERROR: 'ネットワークリクエストに失敗しました',
    DELETE_DIR_FAILED: 'ディレクトリの削除に失敗しました',
    SKILL_ZIP_DOWNLOAD_FAILED: 'ZIP のダウンロードに失敗しました',
    SKILL_INSTALL_FAILED: 'スキルのインストールに失敗しました',
    SKILL_ZIP_EXTRACT_FAILED: 'ZIP の解凍に失敗しました',
    SKILL_INVALID_REPO_URL: '無効な GitHub リポジトリ URL です',
    SKILL_MULTI_SKILL_REPO: '複数のスキルが含まれています',

    SKILL_ERROR_UNSUPPORTED_PROXY: '未対応のプロキシプロトコル: {type}',
    SKILL_ERROR_INVALID_GITHUB_URL: '無効な GitHub URL: {url}',
    SKILL_ERROR_SKILL_NOT_FOUND_REPO: '{owner}/{repo} に {skillName} が見つかりません',
    SKILL_ERROR_ALL_STRATEGIES_FAILED: 'すべてのダウンロード戦略が失敗しました',
    SKILL_ERROR_API_ALL_PREFIXES_FAILED: 'API ダウンロード失敗',
    SKILL_ERROR_README_NOT_FOUND: 'SKILL.md が見つかりません',
    SKILL_ERROR_PROXY_DOWNLOAD: 'プロキシダウンロード失敗: HTTP {status}',

    SKILL_LOG_NEW_LOG: '========== 新規ログ ==========',
    SKILL_LOG_DOWNLOAD_START: '========== ダウンロード開始 ==========',
    SKILL_LOG_PARAMS: 'パラメータ',
    SKILL_LOG_REPO_INFO: 'リポジトリ情報',
    SKILL_LOG_PREFIX_PROBE: 'プレフィックス探索 ...',
    SKILL_LOG_PREFIX_RESULT: '結果: {prefix}',
    SKILL_LOG_TARBALL_PROBE: 'Tarball サイズ探索 ...',
    SKILL_LOG_SIZE: 'サイズ: {size}',
    SKILL_LOG_SIZE_UNKNOWN: '検出不可',
    SKILL_LOG_TRY_PREFIXES: 'プレフィックス一覧',
    SKILL_LOG_STRATEGY_ROUTE: '戦略ルート',
    SKILL_LOG_STRATEGY_TAR: 'Tar 戦略',
    SKILL_LOG_STRATEGY_API: 'API 戦略',
    SKILL_LOG_TAR_ATTEMPT: 'Tar 試行 #{n}',
    SKILL_LOG_EXTRACT_RESULT: '抽出結果',
    SKILL_LOG_SUCCESS_N_FILES: '成功 ({n} ファイル)',
    SKILL_LOG_FAILED: '失敗: {msg}',
    SKILL_LOG_ERROR: 'エラー: {msg}',
    SKILL_LOG_API_ATTEMPT: 'API 試行 #{n}',
    SKILL_LOG_SUCCESS_WITH_README: '成功 (SKILL.md あり)',
    SKILL_LOG_DOWNLOAD_DONE: '========== ダウンロード完了 ==========',
    SKILL_LOG_FINAL_VERIFY_FAILED: '最終検証失敗',

    SKILL_PROGRESS_PARSING_REPO: 'リポジトリ情報解析中...',
    SKILL_PROGRESS_DETECTED_PREFIX: 'プレフィックス検出: {prefix}',
    SKILL_PROGRESS_TARBALL_SIZE: 'Tarball サイズ: {size}',
    SKILL_PROGRESS_CANNOT_DETECT_SIZE: 'Tarball サイズ検出不可',
    SKILL_PROGRESS_TAR_STREAMING: 'Tar ストリーミング...',
    SKILL_PROGRESS_FETCHING_TREE: 'ファイル一覧取得中...',
    SKILL_PROGRESS_EXTRACT_NO_README: '{n} ファイル、SKILL.md なし',
    SKILL_PROGRESS_TAR_FAILED: 'Tar 失敗: {msg}',
    SKILL_PROGRESS_FALLBACK_API: 'API 並列ダウンロードに切替中...',
    SKILL_PROGRESS_ALSO_FAILED: 'プレフィックス "{prefix}" も失敗: {msg}',
    SKILL_PROGRESS_REGISTERING: 'スキル登録中...',
    SKILL_PROGRESS_DONE: 'インストール完了',
    SKILL_PROGRESS_CONNECTING_GITHUB: 'GitHub 接続中...',
    SKILL_PROGRESS_DOWNLOADING_PCT: 'ダウンロード中 {pct}%',
    SKILL_PROGRESS_EXTRACTING: '解凍中...',
    SKILL_PROGRESS_GIT_SPARSE_CLONE: 'git sparse clone...',
    SKILL_PROGRESS_SPARSE_CHECKOUT: 'sparse-checkout: {path}...',
    SKILL_PROGRESS_CHECKOUT_FILES: 'checkout files...',
    SKILL_PROGRESS_COPYING: 'コピー中...',
    SKILL_PROGRESS_CLONE_DONE: 'clone 完了',
    SKILL_PROGRESS_FINDING_SKILL_DIR: 'スキルディレクトリ検索中...',
  },
  'pt-BR': {
    providerNotFound: 'Fornecedor não encontrado',
    officialKeyNotFound: 'Chave não encontrada',
    added: 'Adicionado',
    deleted: 'Excluído',
    updated: 'Atualizado',
    activated: 'Ativado',
    deactivated: 'Alternou para API oficial',
    modelAdded: 'Modelo adicionado',
    modelDeleted: 'Modelo excluído',
    modelSet: 'Modelo alterado',
    keyAdded: 'Adicionado',
    keyActivated: 'Ativado',
    aliasUpdated: 'Apelido atualizado',
    notFound: 'Não encontrado',
    synced: 'Sincronizado',

    KEY_REQUIRED: 'api_key é obrigatório',
    KEY_DUPLICATE: 'Esta chave API já existe',
    KEY_NOT_FOUND: 'Chave API não encontrada',
    PROVIDER_REQUIRED: 'Tipo de fornecedor é obrigatório',
    PROVIDER_DUPLICATE: 'Este fornecedor já existe (mesmo tipo + mesma chave)',
    PROVIDER_NOT_FOUND: 'Fornecedor não encontrado',
    MODEL_DUPLICATE: 'Modelo já existe',
    MODEL_NOT_FOUND: 'Modelo não encontrado',
    MODEL_MIN_ONE: 'Pelo menos um modelo é obrigatório',
    PROVIDER_NO_MODELS: 'Este fornecedor não possui modelos',
    CONFIG_NOT_EXISTS: 'Config do CodeWhale não encontrada',
    CONFIG_PARSE_ERROR: 'Falha ao ler config do CodeWhale',
    OFFICIAL_MGR_NOT_READY: 'OfficialKeyManager não inicializado',
    VALIDATION_ERROR: 'Preencha todos os campos obrigatórios',
    PROXY_NOT_FOUND: 'Proxy não encontrado',
    TOKEN_NOT_FOUND: 'Token não encontrado',
    SYNC_MERGED: 'Sincronizado {count} novas entradas do CodeWhale',
    IMPORTED_ALIAS: 'Importado do CodeWhale',
    SKILL_ALREADY_INSTALLED: 'Skill já instalada',
    SKILL_DIR_NOT_EXISTS: 'Caminho local não existe',
    SKILL_DIR_NO_README: 'SKILL.md não encontrado no diretório',
    SKILL_NOT_FOUND: 'Skill não instalada',
    SKILL_NOT_COMMUNITY: 'Apenas skills da comunidade suportam atualização online',
    SKILL_MISSING_README: 'SKILL.md não encontrado após instalação',
    GIT_CLONE_FAILED: 'Falha no git clone',
    GIT_PULL_FAILED: 'Falha no git pull',
    GITHUB_API_ERROR: 'Falha na requisição à API do GitHub',
    NETWORK_ERROR: 'Falha na requisição de rede',
    DELETE_DIR_FAILED: 'Falha ao excluir diretório',
    SKILL_ZIP_DOWNLOAD_FAILED: 'Falha no download do ZIP',
    SKILL_INSTALL_FAILED: 'Falha na instalação da skill',
    SKILL_ZIP_EXTRACT_FAILED: 'Falha ao extrair ZIP',
    SKILL_INVALID_REPO_URL: 'URL de repositório GitHub inválida',
    SKILL_MULTI_SKILL_REPO: 'Este repositório contém múltiplas skills',

    SKILL_ERROR_UNSUPPORTED_PROXY: 'Tipo de proxy não suportado: {type}',
    SKILL_ERROR_INVALID_GITHUB_URL: 'URL GitHub inválida: {url}',
    SKILL_ERROR_SKILL_NOT_FOUND_REPO: '{skillName} não encontrado em {owner}/{repo}',
    SKILL_ERROR_ALL_STRATEGIES_FAILED: 'Todas as estratégias de download falharam',
    SKILL_ERROR_API_ALL_PREFIXES_FAILED: 'Falha no download via API',
    SKILL_ERROR_README_NOT_FOUND: 'SKILL.md não encontrado',
    SKILL_ERROR_PROXY_DOWNLOAD: 'Falha no download via proxy: HTTP {status}',

    SKILL_LOG_NEW_LOG: '========== Novo Log ==========',
    SKILL_LOG_DOWNLOAD_START: '========== Início do Download ==========',
    SKILL_LOG_PARAMS: 'Parâmetros',
    SKILL_LOG_REPO_INFO: 'Info do Repositório',
    SKILL_LOG_PREFIX_PROBE: 'Procurar prefixo ...',
    SKILL_LOG_PREFIX_RESULT: 'Resultado: {prefix}',
    SKILL_LOG_TARBALL_PROBE: 'Medir tarball ...',
    SKILL_LOG_SIZE: 'Tamanho: {size}',
    SKILL_LOG_SIZE_UNKNOWN: 'Não foi possível detectar',
    SKILL_LOG_TRY_PREFIXES: 'Tentar prefixos',
    SKILL_LOG_STRATEGY_ROUTE: 'Rota de estratégia',
    SKILL_LOG_STRATEGY_TAR: 'Estratégia Tar',
    SKILL_LOG_STRATEGY_API: 'Estratégia API',
    SKILL_LOG_TAR_ATTEMPT: 'Tentativa Tar #{n}',
    SKILL_LOG_EXTRACT_RESULT: 'Resultado da extração',
    SKILL_LOG_SUCCESS_N_FILES: 'Sucesso ({n} arquivos)',
    SKILL_LOG_FAILED: 'Falhou: {msg}',
    SKILL_LOG_ERROR: 'Erro: {msg}',
    SKILL_LOG_API_ATTEMPT: 'Tentativa API #{n}',
    SKILL_LOG_SUCCESS_WITH_README: 'Sucesso (com SKILL.md)',
    SKILL_LOG_DOWNLOAD_DONE: '========== Download Completo ==========',
    SKILL_LOG_FINAL_VERIFY_FAILED: 'Falha na verificação final',

    SKILL_PROGRESS_PARSING_REPO: 'Analisando repositório...',
    SKILL_PROGRESS_DETECTED_PREFIX: 'Prefixo detectado: {prefix}',
    SKILL_PROGRESS_TARBALL_SIZE: 'Tamanho do tarball: {size}',
    SKILL_PROGRESS_CANNOT_DETECT_SIZE: 'Não foi possível detectar o tamanho',
    SKILL_PROGRESS_TAR_STREAMING: 'Streaming Tar...',
    SKILL_PROGRESS_FETCHING_TREE: 'Obtendo lista de arquivos...',
    SKILL_PROGRESS_EXTRACT_NO_README: '{n} arquivos, sem SKILL.md',
    SKILL_PROGRESS_TAR_FAILED: 'Tar falhou: {msg}',
    SKILL_PROGRESS_FALLBACK_API: 'Alternando para download via API...',
    SKILL_PROGRESS_ALSO_FAILED: 'Prefixo "{prefix}" também falhou: {msg}',
    SKILL_PROGRESS_REGISTERING: 'Registrando skill...',
    SKILL_PROGRESS_DONE: 'Instalação completa',
    SKILL_PROGRESS_CONNECTING_GITHUB: 'Conectando ao GitHub...',
    SKILL_PROGRESS_DOWNLOADING_PCT: 'Baixando {pct}%',
    SKILL_PROGRESS_EXTRACTING: 'Extraindo...',
    SKILL_PROGRESS_GIT_SPARSE_CLONE: 'git sparse clone...',
    SKILL_PROGRESS_SPARSE_CHECKOUT: 'sparse-checkout: {path}...',
    SKILL_PROGRESS_CHECKOUT_FILES: 'checkout files...',
    SKILL_PROGRESS_COPYING: 'Copiando...',
    SKILL_PROGRESS_CLONE_DONE: 'clone completo',
    SKILL_PROGRESS_FINDING_SKILL_DIR: 'Localizando diretório da skill...',
  },
};

/**
 * 获取服务器消息在指定语言下的文本
 * @param {string} key - SERVER_MSG 中的消息 key
 * @param {Object} [params] - 可选插值参数，如 { count: 3 }
 * @returns {string}
 */
export function getServerMessage(key, params = {}) {
  const locale = getLocale();
  let msg = (SERVER_MSG[locale] && SERVER_MSG[locale][key]) || SERVER_MSG['zh-Hans'][key] || '';
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return msg;
}

/**
 * 直接返回标准失败响应（含翻译消息 + errorCode）
 * @param {string} key - SERVER_MSG 中的消息 key
 * @returns {{success: false, data: null, message: string, errorCode: string}}
 */
export function failMsg(key) {
  const locale = getLocale();
  return {
    success: false,
    data: null,
    message: (SERVER_MSG[locale] && SERVER_MSG[locale][key]) || SERVER_MSG['zh-Hans'][key] || '',
    errorCode: key,
  };
}
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
  'en':      'English',
  'ja':      '日本語',
  'pt-BR':   'Português (BR)',
};

/**
 * 供应商多语言映射
 * key = provider id，value = Record<Locale, string>
 */
export const PROVIDER_I18N = {
  deepseek:    { 'zh-Hans': 'DeepSeek',       en: 'DeepSeek',       ja: 'DeepSeek',       'pt-BR': 'DeepSeek' },
  siliconflow: { 'zh-Hans': '硅基流动',        en: 'SiliconFlow',    ja: 'SiliconFlow',    'pt-BR': 'SiliconFlow' },
  openrouter:  { 'zh-Hans': 'OpenRouter',     en: 'OpenRouter',     ja: 'OpenRouter',     'pt-BR': 'OpenRouter' },
  'nvidia-nim': { 'zh-Hans': 'NVIDIA NIM',    en: 'NVIDIA NIM',    ja: 'NVIDIA NIM',    'pt-BR': 'NVIDIA NIM' },
  atlascloud:  { 'zh-Hans': 'AtlasCloud',     en: 'AtlasCloud',     ja: 'AtlasCloud',     'pt-BR': 'AtlasCloud' },
  'wanjie-ark': { 'zh-Hans': '万界方舟',       en: 'Wanjie Ark',     ja: '万界方舟',        'pt-BR': 'Wanjie Ark' },
  'xiaomi-mimo': { 'zh-Hans': '小米 MiMo',     en: 'Xiaomi MiMo',    ja: 'Xiaomi MiMo',    'pt-BR': 'Xiaomi MiMo' },
  novita:      { 'zh-Hans': 'Novita',        en: 'Novita',        ja: 'Novita',        'pt-BR': 'Novita' },
  fireworks:   { 'zh-Hans': 'Fireworks',     en: 'Fireworks',     ja: 'Fireworks',     'pt-BR': 'Fireworks' },
  openai:      { 'zh-Hans': 'OpenAI（兼容）',  en: 'OpenAI / Compat', ja: 'OpenAI（互換）',  'pt-BR': 'OpenAI / Compat' },
  sglang:      { 'zh-Hans': 'SGLang（自托管）', en: 'SGLang (Self)',  ja: 'SGLang（自前）',  'pt-BR': 'SGLang (Self)' },
  vllm:        { 'zh-Hans': 'vLLM（自托管）',   en: 'vLLM (Self)',    ja: 'vLLM（自前）',    'pt-BR': 'vLLM (Self)' },
  ollama:      { 'zh-Hans': 'Ollama（本地）',   en: 'Ollama (Local)',  ja: 'Ollama（ローカル）', 'pt-BR': 'Ollama (Local)' },
};

/**
 * 获取供应商在指定语言下的 label
 * @param {string} providerId
 * @param {Locale} locale
 * @returns {string}
 */
export function getProviderI18nLabel(providerId, locale) {
  const map = PROVIDER_I18N[providerId];
  if (!map) return providerId;
  return map[locale] || map['zh-Hans'] || providerId;
}

/**
 * 获取所有供应商列表（指定语言）
 * @param {Locale} locale
 * @returns {{id:string, label:string}[]}
 */
export function getKnownProviders(locale) {
  return Object.entries(PROVIDER_I18N).map(([id, labels]) => ({
    id,
    label: labels[locale] || labels['zh-Hans'] || id,
  }));
}

/**
 * 根据 provider id 获取默认 base_url
 * @param {string} providerId
 * @returns {string}
 */
export function getDefaultBaseUrl(providerId) {
  const urls = {
    deepseek:    'https://api.deepseek.com',
    siliconflow: 'https://api.siliconflow.cn/v1',
    openrouter:  'https://openrouter.ai/api/v1',
    openai:      'https://api.openai.com/v1',
    novita:      'https://api.novita.ai/v3/openai',
    fireworks:   'https://api.fireworks.ai/inference/v1',
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

    // ── 业务错误消息 ──
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

    // ── Skillhub ──
    SKILLHUB_NOT_INSTALLED: 'Skillhub 命令行工具未安装，请先通过 Web UI 安装',
    SKILLHUB_INSTALL_FAILED: 'Skillhub 安装失败，请检查网络连接',
    SKILLHUB_SEARCH_FAILED: 'Skillhub 搜索失败',
    SKILLHUB_INSTALL_SKILL_OK: '技能已通过 Skillhub 安装成功',
    SKILLHUB_INSTALL_SKILL_FAILED: '通过 Skillhub 安装技能失败',
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

    // ── Skillhub ──
    SKILLHUB_NOT_INSTALLED: 'Skillhub CLI not installed, please install via Web UI first',
    SKILLHUB_INSTALL_FAILED: 'Skillhub installation failed, check network connection',
    SKILLHUB_SEARCH_FAILED: 'Skillhub search failed',
    SKILLHUB_INSTALL_SKILL_OK: 'Skill installed successfully via Skillhub',
    SKILLHUB_INSTALL_SKILL_FAILED: 'Failed to install skill via Skillhub',
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
    SKILL_ZIP_DOWNLOAD_FAILED: 'ZIP のダウンロードに失敗しました。ネットワークを確認してください',
    SKILL_INSTALL_FAILED: 'スキルのインストールに失敗しました',
    SKILL_ZIP_EXTRACT_FAILED: 'ZIP の解凍に失敗しました。ファイルが破損している可能性があります',
    SKILL_INVALID_REPO_URL: '無効な GitHub リポジトリ URL です',
    SKILL_MULTI_SKILL_REPO: 'このリポジトリには複数のスキルが含まれています。スキル名を指定してください',

    // ── Skillhub ──
    SKILLHUB_NOT_INSTALLED: 'Skillhub CLI がインストールされていません。Web UI からインストールしてください',
    SKILLHUB_INSTALL_FAILED: 'Skillhub のインストールに失敗しました。ネットワークを確認してください',
    SKILLHUB_SEARCH_FAILED: 'Skillhub の検索に失敗しました',
    SKILLHUB_INSTALL_SKILL_OK: 'スキルが Skillhub 経由で正常にインストールされました',
    SKILLHUB_INSTALL_SKILL_FAILED: 'Skillhub 経由でのスキルインストールに失敗しました',
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
    SKILL_ZIP_DOWNLOAD_FAILED: 'Falha no download do ZIP, verifique a rede',
    SKILL_INSTALL_FAILED: 'Falha na instalação da skill',
    SKILL_ZIP_EXTRACT_FAILED: 'Falha ao extrair ZIP, arquivo pode estar corrompido',
    SKILL_INVALID_REPO_URL: 'URL de repositório GitHub inválida',
    SKILL_MULTI_SKILL_REPO: 'Este repositório contém múltiplos skills, especifique um nome',

    // ── Skillhub ──
    SKILLHUB_NOT_INSTALLED: 'Skillhub CLI não instalado, instale via Web UI primeiro',
    SKILLHUB_INSTALL_FAILED: 'Falha na instalação do Skillhub, verifique a rede',
    SKILLHUB_SEARCH_FAILED: 'Falha na busca do Skillhub',
    SKILLHUB_INSTALL_SKILL_OK: 'Skill instalada com sucesso via Skillhub',
    SKILLHUB_INSTALL_SKILL_FAILED: 'Falha ao instalar skill via Skillhub',
  },
};

/**
 * 获取服务器消息在指定语言下的文本
 * @param {Locale} locale
 * @param {string} key
 * @returns {string}
 */
export function getServerMessage(key) {
  const locale = getLocale();
  return (SERVER_MSG[locale] && SERVER_MSG[locale][key]) || SERVER_MSG['zh-Hans'][key] || '';
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
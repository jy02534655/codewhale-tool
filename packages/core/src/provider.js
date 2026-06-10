/**
 * ProviderManager — Provider 与模型管理
 * OfficialKeyManager — 官方 API key 管理
 *
 * 基于本地 JSON 存储（store.json），管理：
 *   1. 官方 DeepSeek API key（可多个，支持别名，主键 = official:api_key）
 *   2. 第三方 provider 列表（增删改查，主键 = provider:api_key）
 *   3. 每个 provider 下的模型列表（增删改查，切换激活）
 *
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * @module provider
 */

import { getProviderI18nLabel, getDefaultBaseUrl, getServerMessage, getLocale } from './i18n.js';
import { ok, fail } from './result.js';

/** 掩码显示 API key（前5位 + ... + 后4位） */
function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

// ════════════════════════════════════════════════════════════════
// OfficialKeyManager — 官方 API key 管理
// ════════════════════════════════════════════════════════════════

export class OfficialKeyManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  /** @returns {import('./types.js').OfficialKeyEntry[]} */
  list() {
    return this._engine.getOfficialKeys().map((k) => ({
      ...k,
      api_key_preview: maskKey(k.api_key),
    }));
  }

  /** @returns {import('./types.js').OfficialKeyEntry|null} */
  getActive() {
    return this._engine.getOfficialKeys().find((k) => k.active) || null;
  }

  /**
   * 添加官方 key
   * @param {object} opts
   * @param {string} opts.alias  - 别名
   * @param {string} opts.api_key
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  add({ alias, api_key } = {}) {
    const locale = getLocale();
    if (!api_key) return fail(getServerMessage(locale, 'KEY_REQUIRED'), 'KEY_REQUIRED');
    const id = 'official:' + api_key;
    const keys = this._engine.getOfficialKeys();
    if (keys.some((k) => k.id === id)) {
      return fail(getServerMessage(locale, 'KEY_DUPLICATE'), 'KEY_DUPLICATE');
    }
    keys.push({ id, alias: alias || '默认', api_key, active: keys.length === 0 });
    this._engine.setOfficialKeys(keys);
    return ok({ id }, getServerMessage(locale, 'keyAdded'));
  }

  /**
   * 激活指定官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activate(id) {
    const locale = getLocale();
    const keys = this._engine.getOfficialKeys();
    const target = keys.find((k) => k.id === id);
    if (!target) return fail(getServerMessage(locale, 'KEY_NOT_FOUND'), 'KEY_NOT_FOUND');
    keys.forEach((k) => (k.active = k.id === id));
    this._engine.setOfficialKeys(keys);
    return ok(null, getServerMessage(locale, 'keyActivated'));
  }

  /**
   * 更新别名
   * @param {string} id
   * @param {string} alias
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias(id, alias) {
    const locale = getLocale();
    const keys = this._engine.getOfficialKeys();
    const k = keys.find((x) => x.id === id);
    if (!k) return fail(getServerMessage(locale, 'KEY_NOT_FOUND'), 'KEY_NOT_FOUND');
    k.alias = alias;
    this._engine.setOfficialKeys(keys);
    return ok(null, getServerMessage(locale, 'aliasUpdated'));
  }

  /**
   * 删除官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(id) {
    const locale = getLocale();
    const keys = this._engine.getOfficialKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) return fail(getServerMessage(locale, 'KEY_NOT_FOUND'), 'KEY_NOT_FOUND');
    const wasActive = keys[idx].active;
    keys.splice(idx, 1);
    if (wasActive && keys.length > 0) keys[0].active = true;
    this._engine.setOfficialKeys(keys);
    return ok(null, getServerMessage(locale, 'deleted'));
  }
}

// ════════════════════════════════════════════════════════════════
// ProviderManager — 第三方 provider 管理
// ════════════════════════════════════════════════════════════════

export class ProviderManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  // ─── Provider 列表查询 ─────────────────────────────────────

  /**
   * @returns {Array<{id:string,provider:string,label:string,api_key_preview:string,base_url:string,models:Array,active:boolean}>}
   */
  listProviders() {
    const locale = getLocale();
    return this._engine.getProviders().map((p) => ({
      id: p.id,
      provider: p.provider,
      label: p.label || getProviderI18nLabel(p.provider, locale),
      api_key_preview: maskKey(p.api_key),
      base_url: p.base_url || '',
      models: p.models || [],
      active: !!p.active,
    }));
  }

  /** @param {string} id */
  getProvider(id) {
    return this._engine.findProvider(id) || null;
  }

  /** @returns {import('./types.js').ProviderEntry|null} */
  getActiveProvider() {
    return this._engine.getProviders().find((p) => p.active) || null;
  }

  /** @returns {{provider_id:string,model_name:string}|null} */
  getActiveModel() {
    const active = this.getActiveProvider();
    if (!active) return null;
    const m = active.models?.find((x) => x.active);
    return m ? { provider_id: active.id, model_name: m.name } : null;
  }

  // ─── Provider 增删改 ───────────────────────────────────────

  /**
   * @param {object} opts
   * @param {string} opts.provider
   * @param {string} opts.api_key
   * @param {string} [opts.label]
   * @param {string} [opts.base_url]
   * @param {string[]|string} [opts.models]
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  addProvider({ provider, api_key, label, base_url, models } = {}) {
    const locale = getLocale();
    if (!provider) return fail(getServerMessage(locale, 'PROVIDER_REQUIRED'), 'PROVIDER_REQUIRED');
    if (!api_key) return fail(getServerMessage(locale, 'KEY_REQUIRED'), 'KEY_REQUIRED');
    const id = `${provider}:${api_key}`;
    if (this._engine.findProvider(id)) {
      return fail(getServerMessage(locale, 'PROVIDER_DUPLICATE'), 'PROVIDER_DUPLICATE');
    }
    const modelsArr = typeof models === 'string'
      ? models.split(',').map(s => s.trim()).filter(Boolean)
      : models;
    const modelList = (modelsArr && modelsArr.length > 0 ? modelsArr : ['deepseek-ai/DeepSeek-V4-Pro']).map((name, i) => ({
      name, active: i === 0,
    }));
    this._engine.setProviders([
      ...this._engine.getProviders(),
      { id, provider, label: label || getProviderI18nLabel(provider, locale), api_key, base_url: base_url || getDefaultBaseUrl(provider), models: modelList, active: false },
    ]);
    return ok({ id }, getServerMessage(locale, 'added'));
  }

  /** @param {string} id @param {object} opts */
  updateProvider(id, opts = {}) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    if (opts.label !== undefined) all[idx].label = opts.label;
    if (opts.base_url !== undefined) all[idx].base_url = opts.base_url;
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'updated'));
  }

  /** @param {string} id */
  removeProvider(id) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    const wasActive = all[idx].active;
    all.splice(idx, 1);
    if (wasActive) all.forEach((p) => (p.active = false));
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'deleted'));
  }

  // ─── 模型管理 ──────────────────────────────────────────────

  /** @param {string} providerId @param {string} modelName */
  addModel(providerId, modelName) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const p = all.find((x) => x.id === providerId);
    if (!p) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    if (!p.models) p.models = [];
    if (p.models.some((m) => m.name === modelName)) return fail(getServerMessage(locale, 'MODEL_DUPLICATE'), 'MODEL_DUPLICATE');
    p.models.push({ name: modelName, active: false });
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'modelAdded'));
  }

  /** @param {string} providerId @param {string} modelName */
  removeModel(providerId, modelName) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const p = all.find((x) => x.id === providerId);
    if (!p) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    if (!p.models || p.models.length <= 1) return fail(getServerMessage(locale, 'MODEL_MIN_ONE'), 'MODEL_MIN_ONE');
    const mi = p.models.findIndex((m) => m.name === modelName);
    if (mi === -1) return fail(getServerMessage(locale, 'MODEL_NOT_FOUND'), 'MODEL_NOT_FOUND');
    const wasActive = p.models[mi].active;
    p.models.splice(mi, 1);
    if (wasActive) p.models[0].active = true;
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'modelDeleted'));
  }

  /** @param {string} providerId @param {string} modelName */
  setActiveModel(providerId, modelName) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const p = all.find((x) => x.id === providerId);
    if (!p) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    if (!p.models) return fail(getServerMessage(locale, 'PROVIDER_NO_MODELS'), 'PROVIDER_NO_MODELS');
    const target = p.models.find((m) => m.name === modelName);
    if (!target) return fail(getServerMessage(locale, 'MODEL_NOT_FOUND'), 'MODEL_NOT_FOUND');
    p.models.forEach((m) => (m.active = m.name === modelName));
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'modelSet'));
  }

  // ─── 激活管理 ──────────────────────────────────────────────

  /** @param {string} providerId */
  activateProvider(providerId) {
    const locale = getLocale();
    const all = this._engine.getProviders();
    const target = all.find((p) => p.id === providerId);
    if (!target) return fail(getServerMessage(locale, 'PROVIDER_NOT_FOUND'), 'PROVIDER_NOT_FOUND');
    all.forEach((p) => (p.active = p.id === providerId));
    if (target.models && target.models.length > 0 && !target.models.some((m) => m.active)) {
      target.models[0].active = true;
    }
    this._engine.setProviders(all);
    return ok(null, getServerMessage(locale, 'activated'));
  }

  /** @returns {{success:boolean, data:null, message:string}} */
  deactivateThirdParty() {
    const all = this._engine.getProviders();
    all.forEach((p) => (p.active = false));
    this._engine.setProviders(all);
    return ok(null);
  }

  /** @param {Array<{id:string,active:boolean}>} states */
  batchSetActive(states) {
    const all = this._engine.getProviders();
    for (const s of states) {
      const p = all.find((x) => x.id === s.id);
      if (p) p.active = s.active;
    }
    this._engine.setProviders(all);
  }

  /** @param {import('./types.js').ProviderEntry[]} providers */
  replaceAll(providers) {
    this._engine.setProviders(providers);
  }
}
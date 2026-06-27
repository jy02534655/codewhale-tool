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

import { getProviderI18nLabel, getDefaultBaseUrl, getLocale, getServerMessage } from './i18n.js';
import { ok, okMsg, failMsg } from './result.js';

/** 掩码显示 API key（前5位 + ... + 后4位） */
function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

/** 校验 URL：可选字段，填了必须是 http/https 格式 */
function isValidUrl(str) {
  if (!str) return true;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

  /** @returns {{success: boolean, data: import('./types.js').OfficialKeyEntry[], message: string}} */
  list() {
    return ok(this._engine.getOfficialKeys().map((k) => ({
      ...k,
      api_key_preview: maskKey(k.api_key),
    })));
  }

  /** @returns {{success: boolean, data: import('./types.js').OfficialKeyEntry|null, message: string}} */
  getActive() {
    return ok(this._engine.getOfficialKeys().find((k) => k.active) || null);
  }

  /**
   * 查找 key 并执行回调，自动处理查找失败和 set
   * @param {string} id
   * @param {(keys: Array, idx: number, k: object, locale: string) => any} fn
   * @private
   */
  _mutateKey(id, fn) {
    const keys = this._engine.getOfficialKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) return failMsg('KEY_NOT_FOUND');
    const result = fn(keys, idx, keys[idx]);
    this._engine.setOfficialKeys(keys);
    return result;
  }

  /**
   * 添加官方 key
   * @param {object} opts
   * @param {string} [opts.alias]
   * @param {string} opts.api_key
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  add({ alias, api_key } = {}) {
    if (!api_key) return failMsg('KEY_REQUIRED');
    const id = 'official:' + api_key;
    const keys = this._engine.getOfficialKeys();
    if (keys.some((k) => k.id === id)) {
      return failMsg('KEY_DUPLICATE');
    }
    keys.push({ id, alias: alias || '默认', api_key, active: keys.length === 0 });
    this._engine.setOfficialKeys(keys);
    return okMsg('keyAdded', { id });
  }

  /**
   * 激活指定官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activate(id) {
    return this._mutateKey(id, (keys) => {
      keys.forEach((kk) => (kk.active = kk.id === id));
      return okMsg('keyActivated');
    });
  }

  /**
   * 更新别名
   * @param {{id: string, alias: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias({ id, alias }) {
    return this._mutateKey(id, (keys, idx, k) => {
      k.alias = alias;
      return okMsg('aliasUpdated');
    });
  }

  /**
   * 删除官方 key
   * @param {string} id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  remove(id) {
    return this._mutateKey(id, (keys, idx, k) => {
      const wasActive = k.active;
      keys.splice(idx, 1);
      if (wasActive && keys.length > 0) keys[0].active = true;
      return okMsg('deleted');
    });
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

  // ─── 内部辅助 ────────────────────────────────────────────────

  /**
   * 查找 provider 并执行回调，自动处理查找失败和 set
   * @param {string} id
   * @param {(all: Array, idx: number, p: object, locale: string) => any} fn
   * @private
   */
  _mutate(id, fn) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return failMsg('PROVIDER_NOT_FOUND');
    const result = fn(all, idx, all[idx]);
    this._engine.setProviders(all);
    return result;
  }

  // ─── Provider 列表查询 ─────────────────────────────────────

  /**
   * @returns {{success: boolean, data: Array, message: string}}
   */
  listProviders() {
    return ok(this._engine.getProviders().map((p) => ({
      id: p.id,
      provider: p.provider,
      label: p.label || getProviderI18nLabel(p.provider, getLocale()),
      api_key_preview: maskKey(p.api_key),
      base_url: p.base_url || '',
      models: p.models || [],
      active: !!p.active,
    })));
  }

  /** @param {string} id @returns {{success: boolean, data: object|null, message: string}} */
  getProvider(id) {
    return ok(this._engine.findProvider(id) || null);
  }

  /** @returns {{success: boolean, data: import('./types.js').ProviderEntry|null, message: string}} */
  getActiveProvider() {
    return ok(this._engine.getProviders().find((p) => p.active) || null);
  }

  /** @returns {{success: boolean, data: {provider_id:string,model_name:string}|null, message: string}} */
  getActiveModel() {
    const r = this.getActiveProvider();
    const active = r.data;
    if (!active) return ok(null);
    const m = active.models?.find((x) => x.active);
    return ok(m ? { provider_id: active.id, model_name: m.name } : null);
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
    if (!provider) return failMsg('PROVIDER_REQUIRED');
    if (!api_key) return failMsg('KEY_REQUIRED');
    if (base_url && !isValidUrl(base_url)) return failMsg('INVALID_BASE_URL');
    const id = `${provider}:${api_key}`;
    if (this._engine.findProvider(id)) {
      return failMsg('PROVIDER_DUPLICATE');
    }
    const modelsArr = typeof models === 'string'
      ? models.split(',').map(s => s.trim()).filter(Boolean)
      : models;
    const modelList = (modelsArr && modelsArr.length > 0 ? modelsArr : ['deepseek-ai/DeepSeek-V4-Pro']).map((name, i) => ({
      name, active: i === 0,
    }));
    this._engine.setProviders([
      ...this._engine.getProviders(),
      { id, provider, label: label || getProviderI18nLabel(provider, getLocale()), api_key, base_url: base_url || getDefaultBaseUrl(provider), models: modelList, active: false },
    ]);
    return okMsg('added', { id });
  }

  /** @param {{id: string, label?: string, base_url?: string}} param */
  updateProvider({ id, label, base_url } = {}) {
    return this._mutate(id, (all, idx, p) => {
      if (base_url !== undefined && !isValidUrl(base_url)) return failMsg('INVALID_BASE_URL');
      if (label !== undefined) p.label = label;
      if (base_url !== undefined) p.base_url = base_url;
      return okMsg('updated');
    });
  }

  /** @param {string} id */
  removeProvider(id) {
    return this._mutate(id, (all, idx, p) => {
      const wasActive = p.active;
      all.splice(idx, 1);
      if (wasActive) all.forEach((pp) => (pp.active = false));
      return okMsg('deleted');
    });
  }

  // ─── 模型管理 ──────────────────────────────────────────────

  /** @param {{id: string, name: string}} param */
  addModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models) p.models = [];
      if (p.models.some((m) => m.name === name)) return failMsg('MODEL_DUPLICATE');
      p.models.push({ name, active: false });
      return ok(null, getServerMessage('modelAdded'));
    });
  }

  /** @param {{id: string, name: string}} param */
  removeModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models || p.models.length <= 1) return failMsg('MODEL_MIN_ONE');
      const mi = p.models.findIndex((m) => m.name === name);
      if (mi === -1) return failMsg('MODEL_NOT_FOUND');
      const wasActive = p.models[mi].active;
      p.models.splice(mi, 1);
      if (wasActive) p.models[0].active = true;
      return ok(null, getServerMessage('modelDeleted'));
    });
  }

  /** @param {{id: string, name: string}} param */
  setActiveModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models) return failMsg('PROVIDER_NO_MODELS');
      const target = p.models.find((m) => m.name === name);
      if (!target) return failMsg('MODEL_NOT_FOUND');
      p.models.forEach((m) => (m.active = m.name === name));
      return ok(null, getServerMessage('modelSet'));
    });
  }

  // ─── 激活管理 ──────────────────────────────────────────────

  /** @param {string} providerId */
  activateProvider(providerId) {
    return this._mutate(providerId, (all, idx, p) => {
      all.forEach((pp) => (pp.active = pp.id === providerId));
      if (p.models && p.models.length > 0 && !p.models.some((m) => m.active)) {
        p.models[0].active = true;
      }
      return ok(null, getServerMessage('activated'));
    });
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
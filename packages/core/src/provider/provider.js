/**
 * @module provider/provider
 */

import { getProviderI18nLabel, getDefaultBaseUrl, getLocale } from '../utils/i18n.js';
import { ok, okMsg, failMsg } from '../utils/result.js';
import { maskKey } from './officialKey.js';

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
// ProviderManager — 第三方 provider 管理
// ════════════════════════════════════════════════════════════════

/**
 * Provider 与模型管理
 *
 * @module ProviderManager
 */
export class ProviderManager {
  /**
   * @param {import('../utils/config.js').ConfigEngine} engine
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
    if (idx === -1) return failMsg('providerNotFound');
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

  /** @returns {{success: boolean, data: import('../types.js').ProviderEntry|null, message: string}} */
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

  /**
   * 在单次调用中同时返回激活的供应商与激活的模型
   *
   * 避免路由层调用 getActiveProvider() + getActiveModel() 导致
   * getActiveProvider() 被内部调用两次的问题。
   *
   * @returns {{success: boolean, data: {active: object|null, active_model: {provider_id:string, model_name:string}|null}, message: string}}
   */
  getActiveInfo() {
    const active = this._engine.getProviders().find((p) => p.active) || null;
    if (!active) return ok({ active: null, active_model: null });
    const model = active.models?.find((x) => x.active);
    return ok({
      active,
      active_model: model ? { provider_id: active.id, model_name: model.name } : null,
    });
  }

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
    if (!provider) return failMsg('providerRequired');
    if (!api_key) return failMsg('keyRequired');
    if (base_url && !isValidUrl(base_url)) return failMsg('invalidBaseUrl');
    const id = `${provider}:${api_key}`;
    if (this._engine.findProvider(id)) {
      return failMsg('providerDuplicate');
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

  /** @param {{id: string, provider?: string, label?: string, base_url?: string}} param */
  updateProvider({ id, provider, label, base_url } = {}) {
    return this._mutate(id, (all, idx, p) => {
      if (base_url !== undefined && !isValidUrl(base_url)) return failMsg('invalidBaseUrl');

      // 如果供应商类型变更，需重建主键：新id = 新provider:api_key
      if (provider !== undefined && provider !== p.provider) {
        const newId = `${provider}:${p.api_key}`;
        if (all.some((x) => x.id === newId)) return failMsg('providerDuplicate');
        const updated = { ...p, id: newId, provider };
        if (label !== undefined) updated.label = label;
        if (base_url !== undefined) updated.base_url = base_url;
        all.push(updated);
        all.splice(idx, 1);
        return okMsg('updated');
      }

      // 供应商类型不变，仅更新常规字段
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
      if (p.models.some((m) => m.name === name)) return failMsg('modelDuplicate');
      p.models.push({ name, active: false });
      return okMsg('modelAdded');
    });
  }

  /** @param {{id: string, name: string}} param */
  removeModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models || p.models.length <= 1) return failMsg('modelMinOne');
      const mi = p.models.findIndex((m) => m.name === name);
      if (mi === -1) return failMsg('modelNotFound');
      const wasActive = p.models[mi].active;
      p.models.splice(mi, 1);
      if (wasActive) p.models[0].active = true;
      return okMsg('modelDeleted');
    });
  }

  /** @param {{id: string, name: string}} param */
  setActiveModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models) return failMsg('providerNoModels');
      const target = p.models.find((m) => m.name === name);
      if (!target) return failMsg('modelNotFound');
      p.models.forEach((m) => (m.active = m.name === name));
      return okMsg('modelSet');
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
      return okMsg('activated');
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

  /** @param {import('../types.js').ProviderEntry[]} providers */
  replaceAll(providers) {
    this._engine.setProviders(providers);
  }
}

/**
 * ProviderManager — Provider 与模型管理
 *
 * 基于本地 JSON 存储（store.json），管理：
 *   1. 官方 DeepSeek API key（始终保留）
 *   2. 第三方 provider 列表（增删改查，主键 = provider:api_key）
 *   3. 每个 provider 下的模型列表（增删改查，切换激活）
 *
 * @module provider
 */

import { getProviderLabel, getDefaultBaseUrl } from './types.js';

/** 掩码显示 API key（前5位 + ... + 后4位） */
function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

export class ProviderManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine - JSON 存储引擎
   */
  constructor(engine) {
    /** @type {import('./config.js').ConfigEngine} */
    this._engine = engine;
  }

  // ─── 官方 API Key ──────────────────────────────────────────

  /**
   * 获取官方 API key
   * @returns {{official_api_key: string}}
   */
  getOfficialApiKey() {
    return { official_api_key: this._engine.getOfficialApiKey() };
  }

  /**
   * 设置官方 API key
   * @param {string} apiKey
   * @returns {{success: boolean}}
   */
  setOfficialApiKey(apiKey) {
    this._engine.setOfficialApiKey(apiKey);
    return { success: true };
  }

  // ─── Provider 列表查询 ─────────────────────────────────────

  /**
   * 列出所有 provider（不暴露完整 API key）
   * @returns {Array<{id:string, provider:string, label:string, api_key_preview:string, base_url:string, models:Array, active:boolean}>}
   */
  listProviders() {
    const providers = this._engine.getProviders();
    return providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      label: p.label || getProviderLabel(p.provider),
      api_key_preview: maskKey(p.api_key),
      base_url: p.base_url || '',
      models: p.models || [],
      active: !!p.active,
    }));
  }

  /**
   * 获取单个 provider 完整信息（含完整 API key，供编辑用）
   * @param {string} id - 主键 "provider:api_key"
   * @returns {import('./types.js').ProviderEntry|null}
   */
  getProvider(id) {
    return this._engine.findProvider(id) || null;
  }

  /**
   * 获取当前激活的 provider
   * @returns {import('./types.js').ProviderEntry|null}
   */
  getActiveProvider() {
    const providers = this._engine.getProviders();
    return providers.find((p) => p.active) || null;
  }

  /**
   * 获取当前激活的模型名称
   * @returns {{provider_id: string, model_name: string}|null}
   */
  getActiveModel() {
    const active = this.getActiveProvider();
    if (!active) return null;
    const activeModel = active.models?.find((m) => m.active);
    return activeModel
      ? { provider_id: active.id, model_name: activeModel.name }
      : null;
  }

  // ─── Provider 增删改 ───────────────────────────────────────

  /**
   * 添加 provider
   * 主键 = provider + ":" + api_key，重复则拒绝
   * @param {object} opts
   * @param {string} opts.provider - provider 类型，如 "siliconflow"
   * @param {string} opts.api_key  - API key
   * @param {string} [opts.label]    - 显示名称
   * @param {string} [opts.base_url] - 自定义 base URL
   * @param {string[]} [opts.models]  - 初始模型名称列表
   * @returns {{success: boolean, message?: string, id?: string}}
   */
  addProvider({ provider, api_key, label, base_url, models } = {}) {
    if (!provider) return { success: false, message: 'provider 类型不能为空' };
    if (!api_key) return { success: false, message: 'api_key 不能为空' };

    const id = `${provider}:${api_key}`;
    const existing = this._engine.findProvider(id);
    if (existing) {
      return { success: false, message: `Provider "${id}" 已存在（相同 provider 类型 + 相同 api_key）` };
    }

    const modelList = (models || ['deepseek-ai/DeepSeek-V4-Pro']).map((name, i) => ({
      name,
      active: i === 0, // 首个模型默认激活
    }));

    /** @type {import('./types.js').ProviderEntry} */
    const entry = {
      id,
      provider,
      label: label || getProviderLabel(provider),
      api_key,
      base_url: base_url || getDefaultBaseUrl(provider),
      models: modelList,
      active: false,
    };

    const all = this._engine.getProviders();
    all.push(entry);
    this._engine.setProviders(all);

    return { success: true, id, message: `Provider "${id}" 添加成功` };
  }

  /**
   * 更新 provider 基础信息（provider 类型和 api_key 不可改）
   * @param {string} id - 主键
   * @param {object} opts
   * @param {string} [opts.label]
   * @param {string} [opts.base_url]
   * @returns {{success: boolean, message?: string}}
   */
  updateProvider(id, opts = {}) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { success: false, message: `Provider "${id}" 不存在` };
    }

    const p = all[idx];
    if (opts.label !== undefined) p.label = opts.label;
    if (opts.base_url !== undefined) p.base_url = opts.base_url;

    this._engine.setProviders(all);
    return { success: true };
  }

  /**
   * 删除 provider
   * @param {string} id - 主键
   * @returns {{success: boolean, message?: string}}
   */
  removeProvider(id) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { success: false, message: `Provider "${id}" 不存在` };
    }

    all.splice(idx, 1);
    this._engine.setProviders(all);
    return { success: true, message: `Provider "${id}" 已删除` };
  }

  // ─── 模型管理 ──────────────────────────────────────────────

  /**
   * 为指定 provider 添加模型
   * @param {string} providerId - provider 主键
   * @param {string} modelName  - 模型名称
   * @returns {{success: boolean, message?: string}}
   */
  addModel(providerId, modelName) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === providerId);
    if (idx === -1) {
      return { success: false, message: `Provider "${providerId}" 不存在` };
    }

    const p = all[idx];
    if (!p.models) p.models = [];

    if (p.models.some((m) => m.name === modelName)) {
      return { success: false, message: `模型 "${modelName}" 已存在` };
    }

    p.models.push({ name: modelName, active: false });
    this._engine.setProviders(all);
    return { success: true };
  }

  /**
   * 删除指定 provider 下的模型
   * @param {string} providerId - provider 主键
   * @param {string} modelName  - 模型名称
   * @returns {{success: boolean, message?: string}}
   */
  removeModel(providerId, modelName) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === providerId);
    if (idx === -1) {
      return { success: false, message: `Provider "${providerId}" 不存在` };
    }

    const p = all[idx];
    if (!p.models || p.models.length <= 1) {
      return { success: false, message: '至少保留一个模型' };
    }

    const modelIdx = p.models.findIndex((m) => m.name === modelName);
    if (modelIdx === -1) {
      return { success: false, message: `模型 "${modelName}" 不存在` };
    }

    const wasActive = p.models[modelIdx].active;
    p.models.splice(modelIdx, 1);

    // 如果删除的是激活模型，自动激活第一个
    if (wasActive && p.models.length > 0) {
      p.models[0].active = true;
    }

    this._engine.setProviders(all);
    return { success: true };
  }

  /**
   * 设置指定 provider 下的某个模型为当前激活模型
   * @param {string} providerId - provider 主键
   * @param {string} modelName  - 模型名称
   * @returns {{success: boolean, message?: string}}
   */
  setActiveModel(providerId, modelName) {
    const all = this._engine.getProviders();
    const idx = all.findIndex((p) => p.id === providerId);
    if (idx === -1) {
      return { success: false, message: `Provider "${providerId}" 不存在` };
    }

    const p = all[idx];
    if (!p.models) {
      return { success: false, message: '该 provider 下没有模型' };
    }

    const target = p.models.find((m) => m.name === modelName);
    if (!target) {
      return { success: false, message: `模型 "${modelName}" 不存在` };
    }

    // 取消所有模型的激活，只激活指定的
    p.models.forEach((m) => (m.active = m.name === modelName));

    this._engine.setProviders(all);
    return { success: true };
  }

  // ─── 激活管理 ──────────────────────────────────────────────

  /**
   * 设置指定 provider 为全局激活（开启第三方模式）
   * 自动激活该 provider 下第一个模型
   * @param {string} providerId - provider 主键
   * @returns {{success: boolean, message?: string}}
   */
  activateProvider(providerId) {
    const all = this._engine.getProviders();
    const target = all.find((p) => p.id === providerId);
    if (!target) {
      return { success: false, message: `Provider "${providerId}" 不存在` };
    }

    // 取消所有 provider 的激活
    all.forEach((p) => (p.active = p.id === providerId));

    // 确保该 provider 下有激活模型
    if (target.models && target.models.length > 0) {
      const hasActive = target.models.some((m) => m.active);
      if (!hasActive) {
        target.models[0].active = true;
      }
    }

    this._engine.setProviders(all);
    return { success: true };
  }

  /**
   * 关闭第三方模式（取消所有 provider 的激活）
   * @returns {{success: boolean}}
   */
  deactivateThirdParty() {
    const all = this._engine.getProviders();
    all.forEach((p) => (p.active = false));
    this._engine.setProviders(all);
    return { success: true };
  }

  /**
   * 批量设置 provider 的 active 状态（供 sync 使用）
   * @param {Array<{id: string, active: boolean}>} states
   */
  batchSetActive(states) {
    const all = this._engine.getProviders();
    for (const s of states) {
      const p = all.find((x) => x.id === s.id);
      if (p) p.active = s.active;
    }
    this._engine.setProviders(all);
  }

  /**
   * 批量替换 provider 列表（供 sync 合并使用）
   * @param {import('./types.js').ProviderEntry[]} providers
   */
  replaceAll(providers) {
    this._engine.setProviders(providers);
  }
}

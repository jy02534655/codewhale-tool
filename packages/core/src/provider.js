/**
 * ProviderManager — 模型管理
 *
 * 管理两部分：
 *   1. DeepSeek 官方 API key（始终生效）
 *   2. 第三方 provider 列表（通过开关控制是否启用）
 *
 * 每个 provider 是一个扁平结构：
 *   [providers.siliconflow]
 *   api_key  = "sk-xxx"
 *   base_url = "https://..."
 *   model    = "deepseek-ai/DeepSeek-V4-Pro"
 *
 * 无需嵌套 api_keys，一个 provider 一个 api_key + model。
 *
 * @module provider
 */

import { ConfigEngine } from './config.js';

/** 掩码显示 API key（前5位 + ... + 后4位） */
function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}

export class ProviderManager {
  /**
   * @param {ConfigEngine} engine - 配置读写引擎实例
   */
  constructor(engine) {
    /** @type {ConfigEngine} */
    this._engine = engine;
  }

  // ─── 模型整体配置 ──────────────────────────────────────────

  /**
   * 获取完整模型配置
   * @returns {{official_api_key: string, use_third_party: boolean, active_provider: string}}
   */
  getConfig() {
    return this._engine.getModelConfig();
  }

  // ─── 官方 API key ──────────────────────────────────────────

  /**
   * 更新官方 DeepSeek API key
   * @param {string} apiKey
   * @returns {{success: boolean}}
   */
  setOfficialApiKey(apiKey) {
    this._engine.setModelConfig({ official_api_key: apiKey });
    return { success: true };
  }

  // ─── 第三方开关 ────────────────────────────────────────────

  /**
   * 切换第三方 provider 模式
   * @param {boolean} enabled - 是否启用
   * @param {string} [providerName] - 启用时指定的 provider 名称；关闭时忽略
   * @returns {{success: boolean, message?: string}}
   */
  setUseThirdParty(enabled, providerName) {
    if (enabled && providerName) {
      const providers = this._engine.getProviders();
      if (!providers[providerName]) {
        return { success: false, message: `Provider "${providerName}" 不存在` };
      }
      this._engine.setModelConfig({ use_third_party: true, active_provider: providerName });
    } else if (enabled) {
      this._engine.setModelConfig({ use_third_party: true });
    } else {
      this._engine.setModelConfig({ use_third_party: false, active_provider: '' });
    }
    return { success: true };
  }

  /**
   * 切换当前激活的第三方 provider（不改变开关状态）
   * @param {string} providerName
   * @returns {{success: boolean, message?: string}}
   */
  switchProvider(providerName) {
    const providers = this._engine.getProviders();
    if (!providers[providerName]) {
      return { success: false, message: `Provider "${providerName}" 不存在` };
    }
    this._engine.setModelConfig({ active_provider: providerName });
    return { success: true };
  }

  // ─── Provider 列表 ─────────────────────────────────────────

  /**
   * 列出所有第三方 provider（不暴露完整 API key）
   * @returns {{name: string, label: string, api_key_preview: string, base_url: string, model: string}[]}
   */
  listProviders() {
    const providers = this._engine.getProviders();
    return Object.entries(providers).map(([name, cfg]) => ({
      name,
      label: cfg.label || name,
      api_key_preview: maskKey(cfg.api_key),
      base_url: cfg.base_url || '',
      model: cfg.model || '',
    }));
  }

  /**
   * 获取单个 provider 完整信息（含完整 API key，供编辑用）
   * @param {string} name
   * @returns {{name: string, label: string, api_key: string, base_url: string, model: string}|null}
   */
  getProvider(name) {
    const providers = this._engine.getProviders();
    const cfg = providers[name];
    if (!cfg) return null;
    return {
      name,
      label: cfg.label || name,
      api_key: cfg.api_key || '',
      base_url: cfg.base_url || '',
      model: cfg.model || '',
    };
  }

  // ─── 增删改 ────────────────────────────────────────────────

  /**
   * 添加一个新的第三方 provider
   * @param {string} name     - provider 唯一标识（如 "siliconflow"）
   * @param {object} opts
   * @param {string} [opts.label]    - 显示名称
   * @param {string} opts.api_key    - API key
   * @param {string} [opts.base_url] - 自定义 base URL
   * @param {string} [opts.model]    - 模型名称
   * @returns {{success: boolean, message?: string}}
   */
  addProvider(name, { label, api_key, base_url, model } = {}) {
    const providers = this._engine.getProviders();
    if (providers[name]) {
      return { success: false, message: `Provider "${name}" 已存在` };
    }
    providers[name] = {
      label: label || name,
      api_key: api_key || '',
      base_url: base_url || '',
      model: model || '',
    };
    this._engine.setProviders(providers);
    return { success: true };
  }

  /**
   * 更新已有 provider 的配置（名称不可改）
   * @param {string} name
   * @param {object} opts
   * @param {string} [opts.label]
   * @param {string} [opts.api_key]
   * @param {string} [opts.base_url]
   * @param {string} [opts.model]
   * @returns {{success: boolean, message?: string}}
   */
  updateProvider(name, opts = {}) {
    const providers = this._engine.getProviders();
    if (!providers[name]) {
      return { success: false, message: `Provider "${name}" 不存在` };
    }
    const cfg = providers[name];
    if (opts.label !== undefined) cfg.label = opts.label;
    if (opts.api_key !== undefined) cfg.api_key = opts.api_key;
    if (opts.base_url !== undefined) cfg.base_url = opts.base_url;
    if (opts.model !== undefined) cfg.model = opts.model;
    this._engine.setProviders(providers);
    return { success: true };
  }

  /**
   * 删除一个 provider
   * @param {string} name
   * @returns {{success: boolean, message?: string}}
   */
  removeProvider(name) {
    const providers = this._engine.getProviders();
    if (!providers[name]) {
      return { success: false, message: `Provider "${name}" 不存在` };
    }
    delete providers[name];
    this._engine.setProviders(providers);

    // 如果删除的是当前激活的 provider，清空
    const model = this._engine.getModelConfig();
    if (model.active_provider === name) {
      this._engine.setModelConfig({ active_provider: '' });
    }
    return { success: true };
  }
}
/**
 * ProviderManager — 管理 provider / API key / model 三级配置
 *
 * 核心能力：
 *   - 列出所有 provider 及其下属 key 和 model
 *   - 三级切换：provider → api_key → model（任意层级）
 *   - 增删 provider / api_key
 *   - API 连通性探测（委托给 probe 模块）
 *   - 兼容 CodeWhale 旧格式：自动将 provider 下的直接 api_key 提升为 api_keys.default
 *
 * @module provider
 */

import { ConfigEngine } from './config.js';

export class ProviderManager {
  /**
   * @param {ConfigEngine} engine - 配置读写引擎实例
   */
  constructor(engine) {
    /** @type {ConfigEngine} */
    this._engine = engine;
  }

  // ─── 内部：格式规范化 ────────────────────────────────────────

  /**
   * 获取规范化后的 providers（将旧格式 provider.api_key 自动包装为 provider.api_keys.default）
   *
   * CodeWhale 旧格式：
   *   [providers.deepseek]
   *   api_key = "sk-xxx"
   *   model   = "deepseek-ai/DeepSeek-V4-Pro"
   *
   * 自动规范化为：
   *   [providers.deepseek.api_keys.default]
   *   key = "sk-xxx"
   *   models = ["deepseek-ai/DeepSeek-V4-Pro"]
   *
   * @returns {Record<string, import('./types.js').ProviderConfig>}
   * @private
   */
  _normalizedProviders() {
    const raw = this._engine.getProviders();
    const result = {};
    for (const [name, cfg] of Object.entries(raw)) {
      const provider = { ...cfg };
      // 旧格式兼容：provider 下有直接 api_key 但没有 api_keys
      if (provider.api_key && !provider.api_keys) {
        provider.api_keys = {
          default: {
            key: provider.api_key,
            label: provider.label || '默认',
            models: provider.model ? [provider.model] : [],
            default_model: provider.model || '',
            base_url: provider.base_url || '',
          },
        };
      }
      // 旧格式兼容：新格式下每个 key 也可能缺 models
      if (provider.api_keys) {
        for (const [alias, entry] of Object.entries(provider.api_keys)) {
          if (!entry.models || entry.models.length === 0) {
            // 如果 key 有直接的 model 字段（旧格式残留），用它
            if (entry.model) {
              entry.models = [entry.model];
              if (!entry.default_model) entry.default_model = entry.model;
            }
          }
          if (!entry.default_model && entry.models && entry.models.length > 0) {
            entry.default_model = entry.models[0];
          }
        }
      }
      result[name] = provider;
    }
    return result;
  }

  // ─── 列表查询 ───────────────────────────────────────────────

  /**
   * 列出所有已配置的 provider（不含 key 和 model 详情）
   * @returns {{name: string, label: string}[]}
   */
  listProviders() {
    const providers = this._normalizedProviders();
    return Object.entries(providers).map(([name, cfg]) => ({
      name,
      label: cfg.label || name,
    }));
  }

  /**
   * 列出指定 provider 下的所有 API key 别名
   * @param {string} providerName - provider 名称
   * @returns {{alias: string, label: string, models: string[]}[]}
   */
  listApiKeys(providerName) {
    const provider = this._getProvider(providerName);
    if (!provider) return [];
    const keys = provider.api_keys || {};
    return Object.entries(keys).map(([alias, entry]) => ({
      alias,
      label: entry.label || alias,
      models: entry.models || [],
    }));
  }

  /**
   * 获取完整的 provider 树（provider → key → model 三级嵌套）
   * 过滤掉没有配置任何 api_key 的 provider
   * @returns {object} 完整树形结构
   */
  getTree() {
    const providers = this._normalizedProviders();
    const result = {};
    for (const [name, cfg] of Object.entries(providers)) {
      const keys = cfg.api_keys || {};
      // 过滤：没有 api_keys 的 provider 不展示
      if (Object.keys(keys).length === 0) continue;
      result[name] = {
        label: cfg.label || name,
        api_keys: {},
      };
      for (const [alias, entry] of Object.entries(keys)) {
        result[name].api_keys[alias] = {
          label: entry.label || alias,
          models: entry.models || [],
          default_model: entry.default_model || (entry.models && entry.models[0]) || '',
          base_url: entry.base_url || '',
          // 不暴露实际 key 值
          key_preview: entry.key ? entry.key.slice(0, 5) + '...' + entry.key.slice(-4) : '',
        };
      }
    }
    return result;
  }

  // ─── 当前活动配置 ───────────────────────────────────────────

  /**
   * 获取当前激活的 provider / key / model
   * @returns {import('./types.js').ActiveConfig}
   */
  getActive() {
    return this._engine.getActive();
  }

  // ─── 切换 ───────────────────────────────────────────────────

  /**
   * 切换到指定的 provider / api_key / model
   *
   * 切换规则：
   *   - 只传 provider：切换 provider，同时自动选择该 provider 下第一个 key 和它的 default_model
   *   - 传 provider + apiKey：切换 provider 和 key，model 自动回退到该 key 的 default_model
   *   - 三个都传：完整切换
   *
   * @param {object} opts
   * @param {string} [opts.provider] - 目标 provider 名称
   * @param {string} [opts.apiKey]   - 目标 API key 别名
   * @param {string} [opts.model]    - 目标模型标识符
   * @returns {{success: boolean, active: import('./types.js').ActiveConfig, message?: string}}
   */
  switch({ provider, apiKey, model } = {}) {
    const active = this.getActive();
    const targetProvider = provider || active.active_provider;
    const targetApiKey = apiKey || active.active_api_key;

    const providerCfg = this._getProvider(targetProvider);
    if (!providerCfg) {
      return { success: false, active, message: `Provider "${targetProvider}" 不存在` };
    }

    const keys = providerCfg.api_keys || {};

    let resolvedKey = targetApiKey;
    if (provider) {
      const keyNames = Object.keys(keys);
      if (keyNames.length === 0) {
        return { success: false, active, message: `Provider "${targetProvider}" 没有配置任何 API key` };
      }
      if (apiKey) {
        if (!keys[apiKey]) {
          return { success: false, active, message: `API key "${apiKey}" 在 provider "${targetProvider}" 下不存在` };
        }
      } else {
        resolvedKey = keys[active.active_api_key] ? active.active_api_key : keyNames[0];
      }
    } else {
      if (apiKey && !keys[apiKey]) {
        return { success: false, active, message: `API key "${apiKey}" 在 provider "${targetProvider}" 下不存在` };
      }
    }

    const keyCfg = keys[resolvedKey];
    let resolvedModel = model || active.active_model;
    if (model) {
      const models = keyCfg?.models || [];
      if (models.length > 0 && !models.includes(model)) {
        return { success: false, active, message: `模型 "${model}" 在此 key 下不可用。可用模型: ${models.join(', ')}` };
      }
    } else {
      if (apiKey || provider) {
        resolvedModel = keyCfg?.default_model || (keyCfg?.models && keyCfg.models[0]) || '';
      }
    }

    const newActive = {
      active_provider: targetProvider,
      active_api_key: resolvedKey,
      active_model: resolvedModel,
    };
    this._engine.setActive(newActive);
    return { success: true, active: newActive };
  }

  // ─── 增删 ───────────────────────────────────────────────────

  /**
   * 添加一个新 provider
   * @param {string} name  - provider 唯一名称（如 "deepseek"）
   * @param {string} label - 显示名称（如 "DeepSeek"）
   * @returns {{success: boolean, message?: string}}
   */
  addProvider(name, label) {
    const providers = this._engine.getProviders();
    if (providers[name]) {
      return { success: false, message: `Provider "${name}" 已存在` };
    }
    providers[name] = {
      label: label || name,
      api_keys: {},
    };
    this._engine.setProviders(providers);
    return { success: true };
  }

  /**
   * 为指定 provider 添加一个 API key
   * @param {string}   providerName - provider 名称
   * @param {string}   alias        - key 别名（如 "personal"）
   * @param {string}   key          - 实际 API key 字符串
   * @param {string}   [label]      - 显示名称
   * @param {string[]} [models]     - 可用模型列表（不传则需后续通过 probe 获取）
   * @param {string}   [baseUrl]    - 自定义 API 基础 URL（可选）
   * @returns {{success: boolean, message?: string}}
   */
  addApiKey(providerName, alias, key, label, models = [], baseUrl = '') {
    const provider = this._getProvider(providerName);
    if (!provider) {
      return { success: false, message: `Provider "${providerName}" 不存在，请先创建 provider` };
    }
    if (!provider.api_keys) provider.api_keys = {};
    // 允许覆盖更新（用户可能重复添加以刷新模型列表）
    const isUpdate = !!provider.api_keys[alias];
    provider.api_keys[alias] = {
      key,
      label: label || alias,
      models,
      default_model: models.length > 0 ? models[0] : (provider.api_keys[alias]?.default_model || ''),
      base_url: baseUrl || provider.api_keys[alias]?.base_url || '',
    };
    const allProviders = this._engine.getProviders();
    allProviders[providerName] = provider;
    this._engine.setProviders(allProviders);
    return { success: true, message: isUpdate ? `已更新 "${providerName}/${alias}"` : undefined };
  }

  /**
   * 删除一个 provider 及其所有 key
   * @param {string} providerName
   * @returns {{success: boolean, message?: string}}
   */
  removeProvider(providerName) {
    const providers = this._engine.getProviders();
    if (!providers[providerName]) {
      return { success: false, message: `Provider "${providerName}" 不存在` };
    }
    delete providers[providerName];
    this._engine.setProviders(providers);

    const active = this.getActive();
    if (active.active_provider === providerName) {
      this._engine.setActive({ active_provider: '', active_api_key: '', active_model: '' });
    }
    return { success: true };
  }

  /**
   * 删除指定 provider 下的一个 API key
   * @param {string} providerName
   * @param {string} alias
   * @returns {{success: boolean, message?: string}}
   */
  removeApiKey(providerName, alias) {
    const provider = this._getProvider(providerName);
    if (!provider) {
      return { success: false, message: `Provider "${providerName}" 不存在` };
    }
    const keys = provider.api_keys || {};
    if (!keys[alias]) {
      return { success: false, message: `API key "${alias}" 不存在` };
    }
    delete keys[alias];
    const allProviders = this._engine.getProviders();
    allProviders[providerName] = provider;
    this._engine.setProviders(allProviders);

    const active = this.getActive();
    if (active.active_provider === providerName && active.active_api_key === alias) {
      const remaining = Object.keys(keys);
      if (remaining.length > 0) {
        const firstKey = keys[remaining[0]];
        this._engine.setActive({
          active_provider: providerName,
          active_api_key: remaining[0],
          active_model: firstKey.default_model || (firstKey.models && firstKey.models[0]) || '',
        });
      } else {
        this._engine.setActive({ active_provider: providerName, active_api_key: '', active_model: '' });
      }
    }
    return { success: true };
  }

  // ─── 私有辅助 ───────────────────────────────────────────────

  /**
   * 获取指定 provider 的规范化配置对象
   * @param {string} name
   * @returns {import('./types.js').ProviderConfig|null}
   * @private
   */
  _getProvider(name) {
    return this._normalizedProviders()[name] || null;
  }
}
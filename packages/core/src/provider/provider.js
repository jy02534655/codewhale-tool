/**
 * provider/provider.js — 第三方供应商管理
 *
 * Provider（供应商）指除了官方 DeepSeek 之外的第三方 AI 服务，例如：
 *   - SiliconFlow
 *   - OpenRouter
 *   - 任何兼容 OpenAI API 格式的服务
 *
 * 每个 Provider 包含以下核心信息：
 *   - id：全局唯一标识，格式为 '{provider}:{api_key}'，由 provider 类型和 api_key 组合而成
 *   - provider：供应商类型，如 'siliconflow'、'openrouter'
 *   - api_key：供应商的 API key
 *   - base_url：API 基础 URL
 *   - models：该供应商下的模型列表
 *   - active：是否当前激活的供应商
 *
 * 模型管理：
 *   - 每个供应商下可以有多个模型（如 deepseek-ai/DeepSeek-V4-Pro）
 *   - 同一时间只有一个模型处于 active 状态
 *   - 模型 active 状态受供应商 active 状态影响：供应商激活时，其下的第一个模型自动激活
 *
 * @module provider/provider
 */
import { getProviderI18nLabel, getDefaultBaseUrl, getLocale } from '../utils/i18n.js';
import { ok, okMsg, failMsg } from '../utils/result.js';
import { maskKey } from './officialKey.js';
/**
 * 校验 URL 格式
 *
 * base_url 是可填字段，但如果填写了，必须是合法的 http/https URL。
 * 这个校验在 addProvider 和 updateProvider 中使用。
 *
 * @param {string} str - 要校验的 URL 字符串
 * @returns {boolean} true 表示合法（包括空字符串），false 表示非法
 */
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
 * Provider 与模型管理器
 *
 * 职责：
 *   1. 管理第三方供应商的完整生命周期（增删改查 + 激活切换）
 *   2. 管理每个供应商下的模型（增删改查 + 激活切换）
 *   3. 保证同一时间只有一个供应商处于 active 状态
 *   4. 保证每个供应商下同一时间只有一个模型处于 active 状态
 *
 * 存储设计：
 *   - 数据存储在 ConfigEngine 的 providers 字段中
 *   - id 格式固定为 '{provider}:{api_key}'，由供应商类型和 api_key 组合
 *   - 如果 provider 类型变更，需要重建 id（因为 id 包含了 provider 类型）
 *
 * 与 OfficialKeyManager 的区别：
 *   - OfficialKeyManager 管理的是官方 key，id 格式为 'official:' + api_key
 *   - ProviderManager 管理的是第三方供应商，每个供应商可以有多个模型
 *   - ProviderManager 的 id 包含 provider 类型，变更类型时需要重建 id
 *
 * @module ProviderManager
 */
export class ProviderManager {
  /**
   * 创建 provider 管理器实例
   *
   * @param {import('../utils/config.js').ConfigEngine} engine - 配置引擎，提供通用 get/set/find 访问
   */
  constructor(engine) {
    this._engine = engine;
  }
  // ─── 内部辅助 ────────────────────────────────────────────────
  /**
   * 查找 provider 并执行修改回调，自动处理查找失败和持久化。
   *
   * 这是 ProviderManager 的"模板方法"模式：
   *   1. 读取完整 providers 列表
   *   2. 按 id 查找目标 provider
   *   3. 如果找不到，直接返回错误
   *   4. 调用回调函数执行修改逻辑
   *   5. 将修改后的列表写回存储
   *
   * 设计意图：避免在 updateProvider/removeProvider/addModel/removeModel/setActiveModel 中
   * 重复写"查找失败处理 + set"的样板代码。
   *
   * 与 OfficialKeyManager._mutateKey 的区别：
   *   - 参数名不同：all/p  vs  keys/k
   *   - 但职责完全相同：查找-修改-保存
   *
   * @param {string} id - 要操作的 provider id
   * @param {(all: Array, idx: number, p: object) => any} fn - 修改回调
   * @private
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  _mutate(id, fn) {
    const all = this._engine.get('providers');
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return failMsg('providerNotFound');
    const result = fn(all, idx, all[idx]);
    this._engine.set('providers', all);
    return result;
  }
  // ─── Provider 列表查询 ─────────────────────────────────────
  /**
   * 列出所有第三方 provider
   *
   * 返回的列表中 api_key 字段是明文，但前端应使用 api_key_preview 展示给用户。
   * 这个字段由 maskKey 生成，避免完整 key 泄露。
   *
   * @returns {{success: boolean, data: Array, message: string}}
   */
   listProviders() {
     return ok(this._engine.get('providers').map((p) => ({
       id: p.id,
       provider: p.provider,
      label: p.label || getProviderI18nLabel(p.provider, getLocale()),
      api_key_preview: maskKey(p.api_key),
      base_url: p.base_url || '',
      models: p.models || [],
      active: !!p.active,
    })));
  }
  /**
   * 按 id 获取单个 provider
   *
   * @param {string} id - provider id
   * @returns {{success: boolean, data: object|null, message: string}}
   */
  getProvider(id) {
    return ok(this._engine.find('providers', p => p.id === id) || null);
  }
  /**
   * 获取当前激活的第三方 provider
   *
   * 注意：如果当前激活的是官方 key，则没有激活的第三方 provider，返回 null。
   *
   * @returns {{success: boolean, data: import('../types.js').ProviderEntry|null, message: string}}
   */
  getActiveProvider() {
    return ok(this._engine.get('providers').find((p) => p.active) || null);
  }
  /**
   * 获取当前激活的模型（跨供应商）
   *
   * 先调用 getActiveProvider() 获取当前激活的供应商，再从中获取 active model。
   * 如果供应商激活了但其下没有 active model，则返回 null。
   *
   * @returns {{success: boolean, data: {provider_id:string,model_name:string}|null, message: string}}
   */
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
    const active = this._engine.get('providers').find((p) => p.active) || null;
    if (!active) return ok({ active: null, active_model: null });
    const model = active.models?.find((x) => x.active);
    return ok({
      active,
      active_model: model ? { provider_id: active.id, model_name: model.name } : null,
    });
  }
  // ─── Provider 增删改 ──────────────────────────────────────
  /**
   * 新增第三方 provider
   *
   * 业务规则：
   *   - provider 类型必填（如 'siliconflow'）
   *   - api_key 必填
   *   - base_url 可填，但必须是合法的 http/https URL
   *   - id 自动生成：'{provider}:{api_key}'，确保同一供应商 + 同一 key 不会重复
   *   - 如果提供了 models 列表，使用用户指定的模型；否则默认使用 'deepseek-ai/DeepSeek-V4-Pro'
   *   - 第一个模型默认 active: true，其余 active: false
   *   - 新增 provider 默认 active: false（不会自动激活）
   *
   * 为什么默认模型是 'deepseek-ai/DeepSeek-V4-Pro'：
   *   这是 DeepSeek 的旗舰模型，作为默认值可以覆盖大多数场景。
   *
   * @param {object} opts
   * @param {string} opts.provider - 供应商类型，必填
   * @param {string} opts.api_key - API key，必填
   * @param {string} [opts.label] - 显示名称，默认使用 i18n 翻译
   * @param {string} [opts.base_url] - API 基础 URL，默认使用供应商默认值
   * @param {string[]|string} [opts.models] - 模型列表，逗号分隔字符串或数组
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  addProvider({ provider, api_key, label, base_url, models } = {}) {
    if (!provider) return failMsg('providerRequired');
    if (!api_key) return failMsg('keyRequired');
    if (base_url && !isValidUrl(base_url)) return failMsg('invalidBaseUrl');
    const id = `${provider}:${api_key}`;
    if (this._engine.find('providers', p => p.id === id)) {
      return failMsg('providerDuplicate');
    }
    const modelsArr = typeof models === 'string'
      ? models.split(',').map(s => s.trim()).filter(Boolean)
      : models;
    const modelList = (modelsArr && modelsArr.length > 0 ? modelsArr : ['deepseek-ai/DeepSeek-V4-Pro']).map((name, i) => ({
      name, active: i === 0,
    }));
    this._engine.set('providers', [
      ...this._engine.get('providers'),
      { id, provider, label: label || getProviderI18nLabel(provider, getLocale()), api_key, base_url: base_url || getDefaultBaseUrl(provider), models: modelList, active: false },
    ]);
    return okMsg('added', { id });
  }
  /**
   * 更新第三方 provider
   *
   * 两种更新场景：
   *   1. 供应商类型不变：只更新 label、base_url 等常规字段
   *   2. 供应商类型变更：需要重建 id（因为 id 包含 provider 类型）
   *      - 新 id = 新 provider 类型 + 原 api_key
   *      - 检查新 id 是否已存在（防止重复）
   *      - 原 provider 标记为删除，新 provider 追加到列表末尾
   *
   * id 重建逻辑的存在原因：
   *   id 是 '{provider}:{api_key}' 格式，如果 provider 类型变了，
   *   id 也必须跟着变，否则会导致数据不一致。
   *
   * @param {{id: string, provider?: string, label?: string, base_url?: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
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
  /**
   * 删除第三方 provider
   *
   * 业务规则：
   *   - 如果删除的是当前 active provider，则将列表中所有 provider 的 active 设为 false
   *     这意味着删除 active 后，没有供应商会被激活
   *   - 与官方 key 不同，删除 active provider 不会自动 fallback 到另一个 provider
   *
   * @param {string} id - 要删除的 provider id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  removeProvider(id) {
    return this._mutate(id, (all, idx, p) => {
      const wasActive = p.active;
      all.splice(idx, 1);
      if (wasActive) all.forEach((pp) => (pp.active = false));
      return okMsg('deleted');
    });
  }
  // ─── 模型管理 ──────────────────────────────────────────────
  /**
   * 为指定 provider 添加模型
   *
   * 业务规则：
   *   - 模型名称必须唯一（同一 provider 下不能有重复名称）
   *   - 新增的模型默认 active: false
   *   - 一个 provider 至少需要一个模型（由 removeModel 保证）
   *
   * @param {{id: string, name: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  addModel({ id, name }) {
    return this._mutate(id, (all, idx, p) => {
      if (!p.models) p.models = [];
      if (p.models.some((m) => m.name === name)) return failMsg('modelDuplicate');
      p.models.push({ name, active: false });
      return okMsg('modelAdded');
    });
  }
  /**
   * 删除指定 provider 下的模型
   *
   * 业务规则：
   *   - 每个 provider 至少保留一个模型（不允许删除最后一个）
   *   - 如果删除的是当前 active model，则将该 provider 下的第一个模型设为 active
   *   - 如果 provider 没有 active model（极端情况），也强制将第一个设为 active
   *
   * @param {{id: string, name: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
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
  /**
   * 设置指定 provider 下的激活模型
   *
   * 这是"集合内单选"模式：
   *   1. 将目标模型的 active 设为 true
   *   2. 同时将该 provider 下其他所有模型的 active 设为 false
   *
   * 模型 active 状态是供应商级的：供应商激活时，其下的某个模型才可能是 active。
   * 如果供应商本身不是 active，设置 model active 没有实际意义，但代码不阻止此操作。
   *
   * @param {{id: string, name: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
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
  /**
   * 激活指定 provider
   *
   * 激活逻辑：
   *   1. 将目标 provider 的 active 设为 true
   *   2. 同时将列表中其他所有 provider 的 active 设为 false
   *   3. 如果该 provider 下有模型但没有 active model，自动将第一个模型设为 active
   *
   * 这是"集合内单选"模式：同一时间只有一个 provider 可以 active。
   *
   * @param {string} providerId - 要激活的 provider id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activateProvider(providerId) {
    return this._mutate(providerId, (all, idx, p) => {
      all.forEach((pp) => (pp.active = pp.id === providerId));
      if (p.models && p.models.length > 0 && !p.models.some((m) => m.active)) {
        p.models[0].active = true;
      }
      return okMsg('activated');
    });
  }
  /**
   * 取消所有第三方 provider 的激活状态
   *
   * 使用场景：用户选择使用官方 key 时，需要将所有第三方 provider 设为 inactive。
   * 注意：此方法直接操作数组，不通过 _mutate（因为不需要查找特定 provider）。
   *
   * @returns {{success:boolean, data:null, message:string}}
   */
  deactivateThirdParty() {
    const all = this._engine.get('providers');
    all.forEach((p) => (p.active = false));
    this._engine.set('providers', all);
    return ok(null);
  }
  /**
   * 批量设置 provider 的激活状态
   *
   * 使用场景：从外部同步激活状态时使用（如 sync.js 的 initSync）。
   * 与 activateProvider 不同：这里不保证"只有一个 active"，允许同时激活多个。
   *
   * @param {Array<{id:string,active:boolean}>} states - 状态列表
   */
  batchSetActive(states) {
    const all = this._engine.get('providers');
    for (const s of states) {
      const p = all.find((x) => x.id === s.id);
      if (p) p.active = s.active;
    }
    this._engine.set('providers', all);
  }
  /**
   * 完全替换所有 providers
   *
   * 使用场景：从 CodeWhale config.toml 同步时，用本地数据完全覆盖。
   * 注意：此方法直接覆盖，不检查数据合法性。
   *
   * @param {import('../types.js').ProviderEntry[]} providers - 新的 providers 列表
   */
  replaceAll(providers) {
    this._engine.set('providers', providers);
  }
}

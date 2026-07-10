/**
 * provider/officialKey.js — 官方 API key 管理
 *
 * CodeWhale 支持同时管理多个官方 DeepSeek API key。
 * 用户可以在 Web UI 中新增、编辑别名、删除 key，并一键切换当前激活的 key。
 *
 * 核心概念：
 *   - 每个 key 有一个全局唯一的 id，格式为 'official:' + api_key
 *   - 同一时间只有一个 key 处于 active 状态
 *   - api_key 本身不会暴露给前端，只返回 api_key_preview（掩码显示）
 *
 * @module provider/officialKey
 */
import { ok, okMsg, failMsg } from '../utils/result.js';
import { Store } from '../utils/store.js';
/**
 * 掩码显示 API key，避免在前端或日志中泄露完整 key。
 *
 * 规则：
 *   - key 长度 < 9：返回前 3 位 + '...'
 *   - key 长度 >= 9：返回前 5 位 + '...' + 后 4 位
 *
 * 示例：
 *   'sk-1234567890abcdef' -> 'sk-12...cdef'
 *
 * @param {string} key - 原始 API key
 * @returns {string} 掩码后的 key
 */
export function maskKey(key) {
  if (!key || key.length < 9) return key ? key.slice(0, 3) + '...' : '';
  return key.slice(0, 5) + '...' + key.slice(-4);
}
// ════════════════════════════════════════════════════════════════
// OfficialKeyManager — 官方 API key 管理
// ════════════════════════════════════════════════════════════════
/**
 * 官方 API key 管理器
 *
 * 职责：
 *   1. 管理官方 API key 的完整生命周期（增删改查 + 激活切换）
 *   2. 保证同一时间只有一个 key 处于 active 状态
 *   3. 删除 active key 时自动 fallback 到第一个剩余 key
 *   4. 所有操作返回统一格式的结果对象 { success, data, message }
 *
 * 存储设计：
 *   - 数据存储在 ConfigEngine 的 official_keys 字段中
 *   - id 格式固定为 'official:' + api_key，确保全局唯一
 *   - 列表中每个 key 有 active 布尔字段，标记是否为当前激活 key
 *
 * @module OfficialKeyManager
 */
export class OfficialKeyManager {
  /**
   * 创建官方 key 管理器实例
   *
   * @param {import('../utils/config.js').ConfigEngine} engine - 配置引擎，提供 getOfficialKeys/setOfficialKeys 访问
   */
  constructor(engine) {
    this._engine = engine;
    // 组合通用 Store，复用 add/update 的校验、构建与 message 返回逻辑
    // 不继承 Store 的原因：activate/remove 需要特殊的 active 状态管理
    this._store = new Store(
      engine,
      () => this._engine.getOfficialKeys(),
      (keys) => this._engine.setOfficialKeys(keys),
      'official:'
    );
  }
  /**
   * 列出所有官方 key
   *
   * 注意：返回的列表中 api_key 字段是明文，但前端应使用 api_key_preview 展示给用户。
   * 这个字段由 maskKey 生成，避免完整 key 泄露。
   *
   * @returns {{success: boolean, data: import('../types.js').OfficialKeyEntry[], message: string}}
   */
  list() {
    return ok(this._engine.getOfficialKeys().map((k) => ({
      ...k,
      api_key_preview: maskKey(k.api_key),
    })));
  }
  /**
   * 获取当前激活的官方 key
   *
   * 同一时间应该只有一个 active key，但代码不强制这一点，由业务逻辑保证。
   *
   * @returns {{success: boolean, data: import('../types.js').OfficialKeyEntry|null, message: string}}
   */
  getActive() {
    return ok(this._engine.getOfficialKeys().find((k) => k.active) || null);
  }
  /**
   * 内部方法：查找 key 并执行修改回调，自动处理查找失败和持久化。
   *
   * 这是一个"模板方法"模式的简化实现：
   *   1. 读取完整 key 列表
   *   2. 按 id 查找目标 key
   *   3. 如果找不到，直接返回错误
   *   4. 调用回调函数执行修改逻辑
   *   5. 将修改后的列表写回存储
   *
   * 设计意图：避免在 activate/remove 等方法中重复写"查找失败处理 + set"的样板代码。
   *
   * @param {string} id - 要操作的 key id
   * @param {(keys: Array, idx: number, k: object) => any} fn - 修改回调，接收完整列表、索引和目标元素
   * @private
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  _mutateKey(id, fn) {
    const keys = this._engine.getOfficialKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) return failMsg('keyNotFound');
    const result = fn(keys, idx, keys[idx]);
    this._engine.setOfficialKeys(keys);
    return result;
  }
  /**
   * 添加新的官方 key
   *
   * 业务规则：
   *   - api_key 必填，重复的 api_key 不允许添加
   *   - 新增的 key 如果没有其他 key，自动设为 active（首个 key 自动激活）
   *   - 否则 active 为 false，需要用户手动激活
   *   - alias 默认值为 '默认'，用户可自定义
   *
   * 注意：api_key 以明文存储在本地，仅通过 maskKey 在前端做掩码展示。
   *
   * @param {object} opts
   * @param {string} [opts.alias] - 用户自定义别名，默认 '默认'
   * @param {string} opts.api_key - 官方 API key，必填
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  add({ alias, api_key } = {}) {
    // 委托给通用 Store，复用 validate/build/okMsg 流程
    return this._store.add(
      { alias, api_key },
      {
        validate: (input) => {
          if (!input.api_key) return failMsg('keyRequired');
          const keys = this._engine.getOfficialKeys();
          if (keys.some((k) => k.id === 'official:' + input.api_key)) {
            return failMsg('keyDuplicate');
          }
          return null;
        },
        build: (input, existing) => ({
          id: 'official:' + input.api_key,
          alias: input.alias || '默认',
          api_key: input.api_key,
          active: existing.length === 0,
        }),
      }
    );
  }
  /**
   * 激活指定官方 key
   *
   * 激活逻辑：
   *   1. 将目标 key 的 active 设为 true
   *   2. 同时将列表中其他所有 key 的 active 设为 false
   *
   * 这是"集合内单选"模式：同一时间只有一个 key 可以 active。
   * 不能使用 Store.setDefault，因为 setDefault 只设置单个字段，不负责批量取消其他。
   *
   * @param {string} id - 要激活的 key id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activate(id) {
    return this._mutateKey(id, (keys) => {
      keys.forEach((kk) => (kk.active = kk.id === id));
      return okMsg('activated');
    });
  }
  /**
   * 更新官方 key 的别名
   *
   * 委托给通用 Store.update，复用：
   *   - 按 id 查找并处理 not-found 错误
   *   - 合并更新字段
   *   - 自动写回存储
   *   - 返回带 message 的统一结果
   *
   * @param {{id: string, alias: string}} param
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  updateAlias({ id, alias }) {
    return this._store.update(id, { alias }, 'keyNotFound', undefined, 'aliasUpdated');
  }
  /**
   * 删除官方 key
   *
   * 业务规则：
   *   1. 如果删除的是当前 active key，且列表中还有其他 key
   *      则自动将第一个剩余 key 设为 active（保证始终有 active key）
   *   2. 如果删除的是最后一个 key，列表为空，没有 active key
   *
   * 不能使用 Store.remove，因为 Store.remove 只负责删除元素，不处理 active fallback。
   *
   * @param {string} id - 要删除的 key id
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

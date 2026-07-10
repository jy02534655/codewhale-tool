/**
 * 通用列表管理器基类
 *
 * 抽取 project / proxy / token 等模块的增删改查 + 设为默认共性逻辑。
 * 子类只需提供：存储访问器、id 前缀、校验/构建/掩码等差异片段。
 *
 * 这个类的作用是避免重复代码。比如 project、proxy、token 这三个模块
 * 都有“新增、更新、删除、设为默认、列表”这些操作，但存储位置和
 * 数据格式不同。Store 类把这些共同逻辑抽出来，子类只需要告诉它
 * “数据存在哪里”、“id 怎么生成”、“怎么验证”。
 */

import { ok, okMsg, failMsg } from './result.js';

export class Store {
  /**
   * 创建通用列表管理器
   *
   * @param {import('./config.js').ConfigEngine} engine 配置引擎，用于读写 store.json
   * @param {() => any[]} getter 读取当前列表的函数，如 () => engine.read().projects
   * @param {(list: any[]) => void} setter 写入整个列表的函数，如 (list) => engine.update(d => { d.projects = list; return d; })
   * @param {string} idPrefix 条目 id 的前缀，如 'project_'、'proxy_'、'token_'
   */
  constructor(engine, getter, setter, idPrefix) {
    this._engine = engine;
    this._getter = getter;
    this._setter = setter;
    this._idPrefix = idPrefix;
  }

  /**
   * 列出所有条目
   *
   * 如果传入了 maskFn，会对每个条目执行掩码处理后再返回。
   * 掩码通常用于把敏感信息（如 API Key）替换成星号或脱敏格式。
   *
   * @param {(item: any) => any} [maskFn] 可选掩码函数，用于脱敏处理
   * @returns {{ success: true, data: any[], message: string }}
   */
  list(maskFn) {
    const items = this._getter();
    if (!maskFn) return ok(items);
    return ok(items.map(maskFn));
  }

  /**
   * 新增条目
   *
   * 流程：
   * 1. 如果有校验函数，先执行校验；校验失败直接返回错误
   * 2. 读取当前列表
   * 3. 调用 build 函数构建新条目（包括生成 id、设置默认值等）
   * 4. 把新条目追加到列表末尾
   * 5. 写回存储
   * 6. 返回带成功消息的响应
   *
   * @param {any} input 用户输入的原始数据
   * @param {{
   *   validate?: (input: any) => { success: boolean; message?: string; errorCode?: string } | null,
   *   build: (input: any, existing: any[]) => any
   * }} opts 配置对象
   * @param {string} [messageKey='added'] 成功消息 key，默认 'added'（已添加）
   * @returns {{ success: boolean, data?: any, message: string, errorCode?: string }}
   */
  add(input, { validate, build }, messageKey = 'added') {
    if (validate) {
      const err = validate(input);
      if (err && !err.success) return err;
    }
    const items = this._getter();
    const entry = build(input, items);
    this._setter([...items, entry]);
    return okMsg(messageKey, entry);
  }

  /**
   * 更新条目
   *
   * 流程：
   * 1. 根据 id 查找目标条目
   * 2. 如果找不到，返回"未找到"错误
   * 3. 过滤掉不允许修改的字段（如 id）
   * 4. 把新值合并到旧条目上
   * 5. 如果有 sanitize 函数，执行数据清理
   * 6. 写回存储
   * 7. 返回带成功消息的响应
   *
   * @param {string} id 要更新的条目 id
   * @param {Partial<any>} updates 要更新的字段和值
   * @param {string} [notFoundCode='NOT_FOUND'] 未找到时的错误码
   * @param {(entry: any) => void} [sanitize] 可选的数据清理函数
   * @param {string} [messageKey='updated'] 成功消息 key，默认 'updated'（已更新）
   * @returns {{ success: boolean, data?: any, message: string, errorCode?: string }}
   */
  update(id, updates, notFoundCode = 'NOT_FOUND', sanitize, messageKey = 'updated') {
    const items = this._getter();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return failMsg(notFoundCode);

    // 不允许修改 id
    // eslint-disable-next-line no-unused-vars
    const { id: _id, ...safe } = updates;
    items[idx] = { ...items[idx], ...safe };
    if (sanitize) sanitize(items[idx]);
    this._setter(items);
    return okMsg(messageKey, items[idx]);
  }

  /**
   * 删除条目
   *
   * 流程：
   * 1. 根据 id 筛选出不包含该 id 的新列表
   * 2. 如果筛选后长度不变，说明该 id 不存在，返回"未找到"错误
   * 3. 否则写回新列表
   * 4. 返回带成功消息的响应
   *
   * @param {string} id 要删除的条目 id
   * @param {string} [notFoundCode='NOT_FOUND'] 未找到时的错误码
   * @param {string} [messageKey='deleted'] 成功消息 key，默认 'deleted'（已删除）
   * @returns {{ success: boolean, data?: any, message: string, errorCode?: string }}
   */
  remove(id, notFoundCode = 'NOT_FOUND', messageKey = 'deleted') {
    const items = this._getter();
    const next = items.filter((i) => i.id !== id);
    if (next.length === items.length) return failMsg(notFoundCode);
    this._setter(next);
    return okMsg(messageKey, { removed: true });
  }

  /**
   * 设为默认
   *
   * 将列表中某个条目标记为默认项，同时取消其他条目的默认标记。
   * 常用于：设置默认代理、设置默认 Token 等场景。
   *
   * 流程：
   * 1. 根据 id 查找目标条目
   * 2. 如果找不到，返回"未找到"错误
   * 3. 遍历列表，只给目标条目设置 default = true
   * 4. 写回存储
   * 5. 返回带成功消息的响应
   *
   * @param {string} id 要设为默认的条目 id
   * @param {string} [notFoundCode='NOT_FOUND'] 未找到时的错误码
   * @param {string} [messageKey='defaultSet'] 成功消息 key，默认 'defaultSet'（已设为默认）
   * @returns {{ success: boolean, data?: any, message: string, errorCode?: string }}
   */
  setDefault(id, notFoundCode = 'NOT_FOUND', messageKey = 'defaultSet') {
    const items = this._getter();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return failMsg(notFoundCode);
    items.forEach((i) => (i.default = i.id === id));
    this._setter(items);
    return okMsg(messageKey, items[idx]);
  }

  /**
   * 生成带前缀的唯一 id
   *
   * 子类通常在 build 函数里调用此方法生成新条目的 id。
   * 例如：makeId('abc123') 在 proxy 模块会返回 'proxy_abc123'
   *
   * @param {string} raw 原始标识字符串
   * @returns {string} 带前缀的完整 id
   */
  makeId(raw) {
    return this._idPrefix + raw;
  }
}

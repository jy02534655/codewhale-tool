/**
 * SyncManager — 双向同步：store.json ↔ CodeWhale config.toml
 *
 * 启动时从 CodeWhale 配置合并到本地 JSON 存储（按 api_key 去重合并），
 * 修改时实时写回 CodeWhale 标准格式。
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * 通俗理解：
 * CodeWhale 本身用一个 TOML 配置文件存设置，而本工具用一个 JSON 文件存设置。
 * 这个类负责让两个文件“互相抄作业”：
 * - 启动时：把 CodeWhale 里的供应商、API key 抄到本工具的 JSON 里
 * - 修改时：把本工具里的修改写回 CodeWhale 的 TOML 里
 *
 * CodeWhale 原生格式示例：
 *   api_key              = "sk-xxx"         # 官方 API key（当前激活的）
 *   auth_mode            = "api_key"
 *   default_text_model   = "deepseek-v4-pro"
 *   provider             = "siliconflow"    # 非空=使用第三方
 *
 *   [providers.siliconflow]
 *   api_key  = "sk-yrz..."
 *   base_url = "https://api.siliconflow.cn/v1"
 *   model    = "deepseek-ai/DeepSeek-V4-Pro"
 *
 * @module sync
 */

import { parse, stringify } from 'smol-toml';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { getServerMessage } from './utils/i18n.js';
import { okMsg, failMsg } from './utils/result.js';

/**
 * 获取 CodeWhale 配置文件的路径
 *
 * CodeWhale 的配置文件固定存放在用户主目录下的 .codewhale/config.toml
 *
 * @returns {string} config.toml 的完整路径
 */
function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

export class SyncManager {
  /**
   * 创建同步管理器实例
   *
   * @param {import('./config.js').ConfigEngine} engine 配置引擎，用于读写本地 store.json
   * @param {import('./provider/provider.js').ProviderManager} providerMgr 供应商管理器
   * @param {import('./provider/officialKey.js').OfficialKeyManager} [officialKeyMgr] 官方 Key 管理器（可选）
   */
  constructor(engine, providerMgr, officialKeyMgr) {
    this._engine = engine;
    this._providerMgr = providerMgr;
    this._officialKeyMgr = officialKeyMgr || null;
  }

  // ─── 内部辅助 ────────────────────────────────────────────────

  /**
   * 执行操作，成功则自动同步到 CodeWhale
   *
   * 这是一个包装器，用于简化组合操作。
   * 先执行 fn()，如果成功（success = true），则自动调用 syncToCodeWhale()
   * 把最新的本地配置写回 CodeWhale。
   *
   * 使用场景：
   *   return this._syncAfter(() => this._providerMgr.activateProvider(id));
   *   这样在激活供应商后，自动同步到 CodeWhale，不用再手动调用一次 syncToCodeWhale
   *
   * @template T
   * @param {() => T} fn 要执行的操作函数
   * @returns {T} 操作结果
   * @private
   */
  _syncAfter(fn) {
    const r = fn();
    if (!r.success) return r;
    return this.syncToCodeWhale();
  }

  // ─── 启动时合并：CodeWhale → 本地 ─────────────────────────────

  /**
   * 从 CodeWhale config.toml 读取并合并到本地 store.json
   *
   * 这是程序启动时执行的同步逻辑，目的是把 CodeWhale 中已有的配置
   * “导入”到本工具的 JSON 存储中，避免用户需要重复录入。
   *
   * 合并规则：
   *   1. 官方 key：从 codewhale 的 api_key 字段读取，按 api_key 合并到 official_keys
   *   2. 第三方 provider：按 api_key 匹配，本地有则保留不改，本地无则新增
   *   3. 过滤 http_headers 等无 api_key 的空 provider
   *   4. 根据 provider 字段和 [providers.xxx].model 确定激活状态
   *
   * @returns {{success: boolean, data?: {merged?: number}, message?: string, errorCode?: string}}
   */
  initSync() {
    const cwPath = codeWhalePath();
    // 如果 CodeWhale 配置文件不存在，直接返回，不执行合并
    if (!existsSync(cwPath)) {
      return okMsg('configNotExists', { merged: 0 });
    }

    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cwCfg = parse(raw);

      let mergedCount = 0;

      // ── 官方 API key ──
      // CodeWhale 的 api_key 字段存储的是当前激活的官方 key
      if (cwCfg.api_key && this._officialKeyMgr) {
        const existingKeys = this._engine.getOfficialKeys();
        // 检查这个 key 是否已经存在于本地
        const alreadyExists = existingKeys.some((k) => k.api_key === cwCfg.api_key);
        if (!alreadyExists) {
          // 本地不存在，新增并设为激活
          existingKeys.forEach((k) => (k.active = false));
          existingKeys.push({
            id: 'official:' + cwCfg.api_key,
            alias: getServerMessage('importedAlias'),
            api_key: cwCfg.api_key,
            active: true,
          });
          this._engine.setOfficialKeys(existingKeys);
          mergedCount++;
        } else {
          // 本地已存在，只更新激活状态
          existingKeys.forEach((k) => (k.active = k.api_key === cwCfg.api_key));
          this._engine.setOfficialKeys(existingKeys);
        }
      }

      // ── 第三方 provider ──
      const cwProviders = cwCfg.providers || {};
      const cwActiveProviderType = cwCfg.provider || '';

      // 过滤掉没有 api_key 的空 provider（如 http_headers）
      const validCwProviders = {};
      for (const [name, cfg] of Object.entries(cwProviders)) {
        if (cfg && typeof cfg === 'object' && cfg.api_key) {
          validCwProviders[name] = cfg;
        }
      }

      const localProviders = this._engine.getProviders();
      // 建立本地 provider 的 api_key 索引，方便快速查找
      const localByApiKey = new Map();
      localProviders.forEach((p) => localByApiKey.set(p.api_key, p));

      // 遍历 CodeWhale 中的有效 provider，合并到本地
      for (const [providerType, cwCfg_] of Object.entries(validCwProviders)) {
        const existing = localByApiKey.get(cwCfg_.api_key);

        if (!existing) {
          // 本地没有这个 api_key 的 provider，新增
          const modelName = cwCfg_.model || 'deepseek-ai/DeepSeek-V4-Pro';
          localProviders.push({
            id: `${providerType}:${cwCfg_.api_key}`,
            provider: providerType,
            label: providerType,
            api_key: cwCfg_.api_key,
            base_url: cwCfg_.base_url || '',
            models: [{ name: modelName, active: false }],
            active: false,
          });
          mergedCount++;
        }
      }

      // ── 确定激活状态 ──
      // 先把所有 provider 设为未激活
      localProviders.forEach((p) => (p.active = false));

      // 如果 CodeWhale 中指定了激活的 provider 类型，且本地存在该 provider
      if (cwActiveProviderType && validCwProviders[cwActiveProviderType]) {
        const activeApiKey = validCwProviders[cwActiveProviderType].api_key;
        const activeModel = validCwProviders[cwActiveProviderType].model || '';

        // 找到匹配的 provider
        const target = localProviders.find(
          (p) => p.provider === cwActiveProviderType && p.api_key === activeApiKey
        );
        if (target) {
          target.active = true;
          // 设置激活模型
          if (target.models && target.models.length > 0) {
            target.models.forEach((m) => (m.active = m.name === activeModel));
            // 如果没有模型被激活，默认激活第一个
            if (!target.models.some((m) => m.active)) {
              target.models[0].active = true;
            }
          }
        }
      }

      // 写回本地存储
      this._engine.setProviders(localProviders);

      return okMsg('syncMerged', { merged: mergedCount }, { count: mergedCount });
    } catch {
      // 如果解析 TOML 失败，返回解析错误
      return failMsg('configParseError');
    }
  }

  // ─── 实时同步：本地 → CodeWhale ────────────────────────────────

  /**
   * 将本地配置实时写入 CodeWhale config.toml
   *
   * 这是修改配置后的同步逻辑，把本工具中的最新状态写回 CodeWhale。
   *
   * 写入策略：
   *   - 官方 API key：写入激活的 official_key
   *   - 第三方 providers：完全用本地数据重建（清空后重写），解决删除不同步问题
   *   - 同类型多 provider：每种 provider 类型只保留激活的那个，其余仅存本地
   *   - 保留 auth_mode、default_text_model 等非管理字段
   *
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  syncToCodeWhale() {
    const cwPath = codeWhalePath();

    // 如果 CodeWhale 配置文件已存在，先读取保留非管理字段
    let cwCfg = {};
    if (existsSync(cwPath)) {
      try {
        cwCfg = parse(readFileSync(cwPath, 'utf-8'));
      } catch { /* 如果解析失败，从头开始 */ }
    }

    // ── 官方 API key ──
    // 写入当前激活的官方 key，如果没有激活的则为空
    if (this._officialKeyMgr) {
      const r = this._officialKeyMgr.getActive();
      const activeKey = r.data;
      cwCfg.api_key = activeKey ? activeKey.api_key : '';
    }

    // 确保这些字段存在，避免 CodeWhale 读取时缺字段
    if (!cwCfg.auth_mode) cwCfg.auth_mode = 'api_key';
    if (!cwCfg.default_text_model) cwCfg.default_text_model = 'deepseek-v4-pro';

    // ── 第三方 provider ──
    // 从本地读取所有 provider，重建 CodeWhale 的 providers 配置
    const providers = this._engine.getProviders();
    const activeProvider = providers.find((p) => p.active);

    // 清空 CodeWhale 的 providers，准备重建
    cwCfg.providers = {};

    // 按 provider 类型分组，每种类型只保留一个写入 CodeWhale
    const byType = new Map();
    for (const p of providers) {
      if (!byType.has(p.provider)) byType.set(p.provider, []);
      byType.get(p.provider).push(p);
    }

    // 每种类型优先选激活的，没有激活的选第一个
    for (const [type, group] of byType) {
      const pick = group.find((p) => p.active) || group[0];
      const pModel = pick.models?.find((m) => m.active)?.name || pick.models?.[0]?.name || '';
      cwCfg.providers[type] = {
        api_key: pick.api_key,
        base_url: pick.base_url || '',
        model: pModel,
      };
    }

    // 设置当前激活的 provider 类型
    if (activeProvider) {
      cwCfg.provider = activeProvider.provider;
    } else {
      // 没有激活的 provider，删除这个字段
      delete cwCfg.provider;
    }

    // 确保目录存在
    const dir = dirname(cwPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // 写入文件，顶部加上注释标记
    writeFileSync(
      cwPath,
      '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwCfg),
      'utf-8'
    );

    return okMsg('synced');
  }

  // ─── 组合操作 ────────────────────────────────────────────────

  /**
   * 激活供应商并同步到 CodeWhale
   *
   * 这是一个便捷方法，把“激活供应商”和“同步到 CodeWhale”两步合并成一步。
   *
   * @param {string} providerId 要激活的供应商 id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activateAndSync(providerId) {
    return this._syncAfter(() => this._providerMgr.activateProvider(providerId));
  }

  /**
   * 设置激活模型并同步到 CodeWhale
   *
   * 便捷方法，把“设置激活模型”和“同步到 CodeWhale”两步合并成一步。
   *
   * @param {{id: string, name: string}} param 供应商 id 和模型名称
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  setActiveModelAndSync({ id, name }) {
    return this._syncAfter(() => this._providerMgr.setActiveModel({ id, name }));
  }

  /**
   * 停用第三方 provider 并同步到 CodeWhale
   *
   * 便捷方法，把“停用第三方 provider”和“同步到 CodeWhale”两步合并成一步。
   * 停用后，CodeWhale 会回退到使用官方 API key。
   *
   * @returns {{success:boolean, data?:any, message?:string}}
   */
  deactivateAndSync() {
    return this._syncAfter(() => this._providerMgr.deactivateThirdParty());
  }

  /**
   * 激活官方 key 并同步到 CodeWhale
   *
   * 便捷方法，把“激活官方 key”和“同步到 CodeWhale”两步合并成一步。
   *
   * @param {string} id 要激活的官方 key id
   * @returns {{success: boolean, data?: any, message?: string, errorCode?: string}}
   */
  activateOfficialAndSync(id) {
    return this._syncAfter(() => {
      if (!this._officialKeyMgr) {
        return failMsg('officialMgrNotReady');
      }
      return this._officialKeyMgr.activate(id);
    });
  }
}

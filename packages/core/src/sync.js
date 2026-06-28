/**
 * SyncManager — 双向同步：store.json ↔ CodeWhale config.toml
 *
 * 启动时从 CodeWhale 配置合并到本地 JSON 存储（按 api_key 去重合并），
 * 修改时实时写回 CodeWhale 标准格式。
 * 所有消息已本地化，内部使用 getLocale() 获取当前语言。
 *
 * CodeWhale 原生格式：
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

function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

export class SyncManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   * @param {import('./provider.js').ProviderManager} providerMgr
   * @param {import('./provider.js').OfficialKeyManager} [officialKeyMgr]
   */
  constructor(engine, providerMgr, officialKeyMgr) {
    this._engine = engine;
    this._providerMgr = providerMgr;
    this._officialKeyMgr = officialKeyMgr || null;
  }

  // ─── 内部辅助 ────────────────────────────────────────────────

  /**
   * 执行操作，成功则自动同步到 CodeWhale
   * @template T
   * @param {() => T} fn
   * @returns {T}
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
    if (!existsSync(cwPath)) {
      return okMsg('CONFIG_NOT_EXISTS', { merged: 0 });
    }

    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cwCfg = parse(raw);

      let mergedCount = 0;

      // ── 官方 API key ──
      if (cwCfg.api_key && this._officialKeyMgr) {
        const existingKeys = this._engine.getOfficialKeys();
        const alreadyExists = existingKeys.some((k) => k.api_key === cwCfg.api_key);
        if (!alreadyExists) {
          existingKeys.forEach((k) => (k.active = false));
          existingKeys.push({
            id: 'official:' + cwCfg.api_key,
            alias: getServerMessage('IMPORTED_ALIAS'),
            api_key: cwCfg.api_key,
            active: true,
          });
          this._engine.setOfficialKeys(existingKeys);
          mergedCount++;
        } else {
          existingKeys.forEach((k) => (k.active = k.api_key === cwCfg.api_key));
          this._engine.setOfficialKeys(existingKeys);
        }
      }

      // ── 第三方 provider ──
      const cwProviders = cwCfg.providers || {};
      const cwActiveProviderType = cwCfg.provider || '';

      const validCwProviders = {};
      for (const [name, cfg] of Object.entries(cwProviders)) {
        if (cfg && typeof cfg === 'object' && cfg.api_key) {
          validCwProviders[name] = cfg;
        }
      }

      const localProviders = this._engine.getProviders();
      const localByApiKey = new Map();
      localProviders.forEach((p) => localByApiKey.set(p.api_key, p));

      for (const [providerType, cwCfg_] of Object.entries(validCwProviders)) {
        const existing = localByApiKey.get(cwCfg_.api_key);

        if (!existing) {
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
      localProviders.forEach((p) => (p.active = false));

      if (cwActiveProviderType && validCwProviders[cwActiveProviderType]) {
        const activeApiKey = validCwProviders[cwActiveProviderType].api_key;
        const activeModel = validCwProviders[cwActiveProviderType].model || '';

        const target = localProviders.find(
          (p) => p.provider === cwActiveProviderType && p.api_key === activeApiKey
        );
        if (target) {
          target.active = true;
          if (target.models && target.models.length > 0) {
            target.models.forEach((m) => (m.active = m.name === activeModel));
            if (!target.models.some((m) => m.active)) {
              target.models[0].active = true;
            }
          }
        }
      }

      this._engine.setProviders(localProviders);

      return okMsg('SYNC_MERGED', { merged: mergedCount }, { count: mergedCount });
    } catch {
      return failMsg('CONFIG_PARSE_ERROR');
    }
  }

  // ─── 实时同步：本地 → CodeWhale ────────────────────────────────

  /**
   * 将本地配置实时写入 CodeWhale config.toml
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

    let cwCfg = {};
    if (existsSync(cwPath)) {
      try {
        cwCfg = parse(readFileSync(cwPath, 'utf-8'));
      } catch { /* 从头开始 */ }
    }

    // ── 官方 API key ──
    if (this._officialKeyMgr) {
      const r = this._officialKeyMgr.getActive();
      const activeKey = r.data;
      cwCfg.api_key = activeKey ? activeKey.api_key : '';
    }

    if (!cwCfg.auth_mode) cwCfg.auth_mode = 'api_key';
    if (!cwCfg.default_text_model) cwCfg.default_text_model = 'deepseek-v4-pro';

    // ── 第三方 provider ──
    const providers = this._engine.getProviders();
    const activeProvider = providers.find((p) => p.active);

    cwCfg.providers = {};

    const byType = new Map();
    for (const p of providers) {
      if (!byType.has(p.provider)) byType.set(p.provider, []);
      byType.get(p.provider).push(p);
    }

    for (const [type, group] of byType) {
      const pick = group.find((p) => p.active) || group[0];
      const pModel = pick.models?.find((m) => m.active)?.name || pick.models?.[0]?.name || '';
      cwCfg.providers[type] = {
        api_key: pick.api_key,
        base_url: pick.base_url || '',
        model: pModel,
      };
    }

    if (activeProvider) {
      cwCfg.provider = activeProvider.provider;
    } else {
      delete cwCfg.provider;
    }

    const dir = dirname(cwPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(
      cwPath,
      '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwCfg),
      'utf-8'
    );

    return okMsg('synced');
  }

  // ─── 组合操作 ────────────────────────────────────────────────

  /** @param {string} providerId */
  activateAndSync(providerId) {
    return this._syncAfter(() => this._providerMgr.activateProvider(providerId));
  }

  /** @param {{id: string, name: string}} param */
  setActiveModelAndSync({ id, name }) {
    return this._syncAfter(() => this._providerMgr.setActiveModel({ id, name }));
  }

  /** @returns {{success:boolean, data?:any, message?:string}} */
  deactivateAndSync() {
    return this._syncAfter(() => this._providerMgr.deactivateThirdParty());
  }

  /** 激活官方 key 并同步 */
  activateOfficialAndSync(id) {
    return this._syncAfter(() => {
      if (!this._officialKeyMgr) {
        return failMsg('OFFICIAL_MGR_NOT_READY');
      }
      return this._officialKeyMgr.activate(id);
    });
  }
}
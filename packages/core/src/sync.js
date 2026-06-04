/**
 * SyncManager — 双向同步：store.json ↔ CodeWhale config.toml
 *
 * 启动时从 CodeWhale 配置合并到本地 JSON 存储（按 api_key 去重合并），
 * 修改时实时写回 CodeWhale 标准格式。
 *
 * CodeWhale 原生格式：
 *   api_key              = "sk-xxx"         # 官方 API key
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


/** CodeWhale 全局配置文件路径 */
function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

export class SyncManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine     - 本地 JSON 存储引擎
   * @param {import('./provider.js').ProviderManager} providerMgr - Provider 管理器
   */
  constructor(engine, providerMgr) {
    this._engine = engine;
    this._providerMgr = providerMgr;
  }

  // ─── 启动时合并：CodeWhale → 本地 ─────────────────────────────

  /**
   * 从 CodeWhale config.toml 读取 provider 并合并到本地 store.json
   *
   * 合并规则：
   *   1. 以 api_key 为主键，本地有则用本地数据更新，本地无则新增
   *   2. 过滤没有 api_key 配置的空 provider（如 http_headers）
   *   3. 根据 codewhale 的 provider 字段和 [providers.xxx].model 确定激活状态
   *
   * @returns {{success: boolean, message: string, merged?: number}}
   */
  initSync() {
    const cwPath = codeWhalePath();
    if (!existsSync(cwPath)) {
      return { success: true, message: 'CodeWhale 配置不存在，跳过同步', merged: 0 };
    }

    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cwCfg = parse(raw);

      // 提取官方 API key
      const officialApiKey = cwCfg.api_key || '';
      this._engine.setOfficialApiKey(officialApiKey);

      // 提取 CodeWhale 中配置的第三方 provider
      const cwProviders = cwCfg.providers || {};
      const cwActiveProviderType = cwCfg.provider || '';

      // 过滤：只保留有 api_key 的有效 provider
      const validCwProviders = {};
      for (const [name, cfg] of Object.entries(cwProviders)) {
        if (cfg && typeof cfg === 'object' && cfg.api_key) {
          validCwProviders[name] = cfg;
        }
        // 跳过 http_headers、空对象等无 api_key 的 provider
      }

      // 读取本地 providers，建立 api_key → 索引 映射
      const localProviders = this._engine.getProviders();
      const localByApiKey = new Map();
      localProviders.forEach((p, i) => {
        localByApiKey.set(p.api_key, { entry: p, index: i });
      });

      let mergedCount = 0;

      // 遍历 codewhale 中的有效 provider，合并到本地
      for (const [providerType, cwCfg] of Object.entries(validCwProviders)) {
        const existing = localByApiKey.get(cwCfg.api_key);

        if (existing) {
          // 本地已有 → 用 codewhale 数据更新 provider 类型和 base_url
          existing.entry.provider = providerType;
          if (cwCfg.base_url && !existing.entry.base_url) {
            existing.entry.base_url = cwCfg.base_url;
          }
          // 如果 codewhale 有 model 而本地没有对应模型，补充
          if (cwCfg.model && existing.entry.models && existing.entry.models.length > 0) {
            const hasModel = existing.entry.models.some((m) => m.name === cwCfg.model);
            if (!hasModel) {
              existing.entry.models.push({ name: cwCfg.model, active: false });
            }
          }
          mergedCount++;
        } else {
          // 本地没有 → 从 codewhale 新建
          const modelName = cwCfg.model || 'deepseek-ai/DeepSeek-V4-Pro';
          localProviders.push({
            id: `${providerType}:${cwCfg.api_key}`,
            provider: providerType,
            label: providerType,
            api_key: cwCfg.api_key,
            base_url: cwCfg.base_url || '',
            models: [{ name: modelName, active: false }],
            active: false,
          });
          mergedCount++;
        }
      }

      // ── 确定激活状态 ──
      if (cwActiveProviderType && validCwProviders[cwActiveProviderType]) {
        const activeApiKey = validCwProviders[cwActiveProviderType].api_key;
        const activeModel = validCwProviders[cwActiveProviderType].model || '';

        // 遍历所有 provider，设置激活状态
        for (const p of localProviders) {
          if (p.api_key === activeApiKey && p.provider === cwActiveProviderType) {
            p.active = true;
            // 设置激活模型
            if (p.models && p.models.length > 0) {
              p.models.forEach((m) => (m.active = m.name === activeModel));
              // 如果 activeModel 没匹配到任何模型，激活第一个
              if (!p.models.some((m) => m.active)) {
                p.models[0].active = true;
              }
            }
          }
          // 其他 provider 保持非激活（不强制改 false，保留本地已有状态）
        }
      }

      this._engine.setProviders(localProviders);

      return {
        success: true,
        message: `已从 CodeWhale 同步 ${mergedCount} 个 provider`,
        merged: mergedCount,
      };
    } catch (err) {
      return { success: false, message: `读取 CodeWhale 配置失败: ${err.message}` };
    }
  }

  // ─── 实时同步：本地 → CodeWhale ────────────────────────────────

  /**
   * 将本地配置实时写入 CodeWhale config.toml
   *
   * 写入策略：
   *   - 官方 API key（始终写入）
   *   - 激活的第三方 provider 信息
   *   - 保留 CodeWhale 现有的所有 provider 块（非管理字段不丢失）
   *
   * @returns {{success: boolean, message: string}}
   */
  syncToCodeWhale() {
    const cwPath = codeWhalePath();

    // 读取现有 CodeWhale 配置（保留 auth_mode、default_text_model 等非管理字段）
    let cwCfg = {};
    if (existsSync(cwPath)) {
      try {
        const raw = readFileSync(cwPath, 'utf-8');
        cwCfg = parse(raw);
      } catch {
        // 无法读取则从零开始
      }
    }

    // ── 官方 API key ──
    cwCfg.api_key = this._engine.getOfficialApiKey();

    // 保留元数据
    if (!cwCfg.auth_mode) cwCfg.auth_mode = 'api_key';
    if (!cwCfg.default_text_model) cwCfg.default_text_model = 'deepseek-v4-pro';

    // ── 第三方 provider ──
    const providers = this._engine.getProviders();
    const activeProvider = providers.find((p) => p.active);

    if (activeProvider) {
      // 第三方模式开启
      cwCfg.provider = activeProvider.provider;

      // 获取激活的模型
      const activeModel = activeProvider.models?.find((m) => m.active);
      const modelName = activeModel?.name || (activeProvider.models?.[0]?.name || '');

      // 写入/更新 active provider 的配置块
      if (!cwCfg.providers) cwCfg.providers = {};
      cwCfg.providers[activeProvider.provider] = {
        api_key: activeProvider.api_key,
        base_url: activeProvider.base_url || '',
        model: modelName,
      };

      // 保留 codewhale 中已有的其他 provider 块（不清除）
      // 同时把所有本地 provider 也写进去（保持一致）
      for (const p of providers) {
        if (p.id !== activeProvider.id) {
          const pModel = p.models?.find((m) => m.active)?.name || p.models?.[0]?.name || '';
          cwCfg.providers[p.provider] = {
            api_key: p.api_key,
            base_url: p.base_url || '',
            model: pModel,
          };
        }
      }
    } else {
      // 第三方模式关闭 → 删除 provider 字段
      delete cwCfg.provider;
      // 但仍保留 [providers.xxx] 块（数据不丢失）
    }

    // ── 写入 ──
    const dir = dirname(cwPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const toml =
      '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' +
      stringify(cwCfg);

    writeFileSync(cwPath, toml, 'utf-8');

    return {
      success: true,
      message: activeProvider
        ? `已同步到 CodeWhale：使用 ${activeProvider.provider}`
        : '已同步到 CodeWhale：使用官方 DeepSeek API',
    };
  }

  /**
   * 激活 provider 后立即同步到 CodeWhale
   * @param {string} providerId - 要激活的 provider 主键
   * @returns {{success: boolean, message?: string}}
   */
  activateAndSync(providerId) {
    const result = this._providerMgr.activateProvider(providerId);
    if (!result.success) return result;

    return this.syncToCodeWhale();
  }

  /**
   * 切换模型后立即同步到 CodeWhale
   * @param {string} providerId
   * @param {string} modelName
   * @returns {{success: boolean, message?: string}}
   */
  setActiveModelAndSync(providerId, modelName) {
    const result = this._providerMgr.setActiveModel(providerId, modelName);
    if (!result.success) return result;

    return this.syncToCodeWhale();
  }

  /**
   * 关闭第三方后立即同步
   * @returns {{success: boolean, message?: string}}
   */
  deactivateAndSync() {
    this._providerMgr.deactivateThirdParty();
    return this.syncToCodeWhale();
  }
}

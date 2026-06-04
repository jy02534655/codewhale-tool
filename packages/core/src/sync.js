/**
 * SyncManager — 双向同步：工具配置 ↔ CodeWhale 全局配置
 *
 * 工具使用自己的 config.toml（项目目录），CodeWhale 使用 ~/.codewhale/config.toml。
 * 导入：从 CodeWhale 配置读取并转换为工具格式
 * 同步：将工具中配置写入 CodeWhale 格式（合并写入，保留非管理字段）
 *
 * CodeWhale 原生格式（参考）：
 *
 *   api_key = "sk-xxx"
 *   auth_mode = "api_key"
 *   default_text_model = "deepseek-v4-pro"
 *   provider = "siliconflow"           ← 非空 = 使用第三方
 *
 *   [providers.siliconflow]
 *   api_key  = "sk-yrz..."
 *   base_url = "https://api.siliconflow.cn/v1"
 *   model    = "deepseek-ai/DeepSeek-V4-Pro"
 *
 *   [providers.siliconflow.http_headers]   ← 保留
 *
 * @module sync
 */

import { parse, stringify } from 'smol-toml';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { ConfigEngine } from './config.js';

/** CodeWhale 全局配置文件路径 */
function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

export class SyncManager {
  /**
   * @param {ConfigEngine} engine - 工具的配置引擎
   */
  constructor(engine) {
    /** @type {ConfigEngine} */
    this._engine = engine;
  }

  // ─── 导入：CodeWhale → 工具 ──────────────────────────────────

  /**
   * 从 CodeWhale 全局配置导入到工具配置
   *
   * 提取：
   *   - api_key              → 工具的 official_api_key
   *   - provider（非空时）    → 工具的 use_third_party + active_provider
   *   - [providers.xxx] 块   → 工具的 providers 列表
   *
   * 合并写入，不覆盖工具中已有的其他 provider。
   *
   * @returns {{success: boolean, message: string}}
   */
  importFromCodeWhale() {
    const cwPath = codeWhalePath();
    if (!existsSync(cwPath)) {
      return { success: false, message: 'CodeWhale 全局配置不存在（~/.codewhale/config.toml）' };
    }

    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cwCfg = parse(raw);

      // 提取官方 API key
      const officialApiKey = cwCfg.api_key || '';

      // 提取第三方 provider 信息
      const cwProvider = cwCfg.provider || '';
      const useThirdParty = !!cwProvider;

      // 导入 provider 配置
      if (cwProvider && cwCfg.providers?.[cwProvider]) {
        const pCfg = cwCfg.providers[cwProvider];
        const providers = this._engine.getProviders();
        providers[cwProvider] = {
          label: cwProvider,
          api_key: pCfg.api_key || '',
          base_url: pCfg.base_url || '',
          model: pCfg.model || '',
        };
        this._engine.setProviders(providers);
      }

      // 写入模型配置
      this._engine.setModelConfig({
        official_api_key: officialApiKey,
        use_third_party: useThirdParty,
        active_provider: cwProvider,
      });

      return {
        success: true,
        message: cwProvider
          ? `已导入：官方 API key + 第三方 provider "${cwProvider}"`
          : '已导入官方 API key（未启用第三方 provider）',
      };
    } catch (err) {
      return { success: false, message: `读取 CodeWhale 配置失败: ${err.message}` };
    }
  }

  // ─── 同步：工具 → CodeWhale ──────────────────────────────────

  /**
   * 将工具配置同步写入 CodeWhale 全局配置
   *
   * 合并写入策略：先读取 CodeWhale 现有配置，只更新工具管理的字段，
   * 保留 auth_mode、default_text_model、http_headers 等非管理字段。
   *
   * 写入内容：
   *   - api_key = official_api_key（始终写入）
   *   - provider = active_provider（开关开启时）或删除（关闭时）
   *   - [providers.xxx] 块（开关开启时写入对应 provider 的配置）
   *
   * @returns {{success: boolean, message: string}}
   */
  syncToCodeWhale() {
    const modelConfig = this._engine.getModelConfig();
    const cwPath = codeWhalePath();

    // 读取现有 CodeWhale 配置（保留非管理字段）
    let cwCfg = {};
    if (existsSync(cwPath)) {
      try {
        const raw = readFileSync(cwPath, 'utf-8');
        cwCfg = parse(raw);
      } catch (_err) {
        // 无法读取则从零开始
      }
    }

    // ── 更新顶层字段 ──

    // 官方 API key（始终写入）
    cwCfg.api_key = modelConfig.official_api_key || '';

    // 保留 auth_mode 和 default_text_model（如果已有则不动，没有则补默认值）
    if (!cwCfg.auth_mode) cwCfg.auth_mode = 'api_key';
    if (!cwCfg.default_text_model) cwCfg.default_text_model = 'deepseek-v4-pro';

    // ── 处理第三方 provider ──

    if (modelConfig.use_third_party && modelConfig.active_provider) {
      cwCfg.provider = modelConfig.active_provider;

      const providers = this._engine.getProviders();
      const activeCfg = providers[modelConfig.active_provider];
      if (activeCfg) {
        if (!cwCfg.providers) cwCfg.providers = {};
        cwCfg.providers[modelConfig.active_provider] = {
          api_key: activeCfg.api_key || '',
          base_url: activeCfg.base_url || '',
          model: activeCfg.model || '',
        };
      }
    } else {
      // 关闭第三方 → 删除 provider 字段（使用 DeepSeek 官方）
      delete cwCfg.provider;
    }

    // ── 写入 ──

    const dir = dirname(cwPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const toml = '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwCfg);
    writeFileSync(cwPath, toml, 'utf-8');

    return {
      success: true,
      message: modelConfig.use_third_party
        ? `已同步到 CodeWhale：使用第三方 provider "${modelConfig.active_provider}"`
        : '已同步到 CodeWhale：使用 DeepSeek 官方 API',
    };
  }

  /**
   * 预览将要同步到 CodeWhale 的内容
   * @returns {{success: boolean, preview: object}}
   */
  previewSync() {
    const modelConfig = this._engine.getModelConfig();
    const preview = {
      api_key: modelConfig.official_api_key
        ? modelConfig.official_api_key.slice(0, 8) + '...'
        : '(未设置)',
      auth_mode: 'api_key',
      default_text_model: 'deepseek-v4-pro',
      third_party_enabled: modelConfig.use_third_party,
      provider: modelConfig.use_third_party ? modelConfig.active_provider : '(使用官方 DeepSeek)',
    };
    return { success: true, preview };
  }

  /**
   * 修复被污染的 CodeWhale 全局配置（删除工具特有的字段）
   * @returns {{success: boolean, message: string}}
   */
  static repairCodeWhaleConfig() {
    const cwPath = codeWhalePath();
    if (!existsSync(cwPath)) {
      return { success: false, message: 'CodeWhale 全局配置不存在' };
    }
    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cfg = parse(raw);

      // 删除工具特有字段
      if (cfg.model) {
        delete cfg.model.active_provider;
        delete cfg.model.active_api_key;
        delete cfg.model.active_model;
        delete cfg.model.official_api_key;
        delete cfg.model.use_third_party;
      }

      // 清理 providers 中的非标准字段
      if (cfg.providers) {
        for (const [, pCfg] of Object.entries(cfg.providers)) {
          delete pCfg.label;
          delete pCfg.api_keys;
        }
      }

      delete cfg.skills;

      const toml = '# CodeWhale Configuration\n# Repaired by codewhale-tool\n\n' + stringify(cfg);
      writeFileSync(cwPath, toml, 'utf-8');
      return { success: true, message: 'CodeWhale 全局配置已修复' };
    } catch (err) {
      return { success: false, message: `修复失败: ${err.message}` };
    }
  }
}
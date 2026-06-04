/**
 * SyncManager — 双向同步：工具配置 ↔ CodeWhale 全局配置
 *
 * 工具使用自己的 config.toml（项目目录），CodeWhale 使用 ~/.codewhale/config.toml。
 * 导入：从 CodeWhale 配置读取并转换为工具格式
 * 同步：将工具中激活的配置写入 CodeWhale 格式
 *
 * CodeWhale 原生格式：
 *   [model]
 *   provider = "deepseek"
 *   model    = "deepseek-ai/DeepSeek-V4-Pro"
 *
 *   [providers.deepseek]
 *   api_key  = "sk-xxx"
 *   base_url = "https://..."
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
   * 从 CodeWhale 全局配置导入 provider 和 key
   *
   * 只导入 CodeWhale 当前激活的 provider（[model].provider），
   * 如果该 provider 已有对应的 [providers.xxx] 配置，一并导入 api_key 和 base_url。
   *
   * @returns {{success: boolean, message: string, imported?: {provider: string, key_alias: string}}}
   */
  importFromCodeWhale() {
    const cwPath = codeWhalePath();
    if (!existsSync(cwPath)) {
      return { success: false, message: 'CodeWhale 全局配置不存在（~/.codewhale/config.toml）' };
    }

    try {
      const raw = readFileSync(cwPath, 'utf-8');
      const cwCfg = parse(raw);

      // 提取 CodeWhale 当前使用的 provider 和 model
      const cwModel = cwCfg.model || {};
      const cwProvider = cwModel.provider || '';
      const cwModelName = cwModel.model || '';

      if (!cwProvider) {
        return { success: false, message: 'CodeWhale 配置中未设置当前 provider（[model].provider 为空）' };
      }

      // 提取对应 provider 的 api_key 和 base_url
      const cwProviderCfg = cwCfg.providers?.[cwProvider] || {};

      // 写入工具配置
      const toolCfg = this._engine.read();

      // 添加 provider
      if (!toolCfg.providers) toolCfg.providers = {};
      if (!toolCfg.providers[cwProvider]) {
        toolCfg.providers[cwProvider] = { label: cwProvider, api_keys: {} };
      }

      const keyAlias = 'imported-' + Date.now().toString(36);
      // 如果已经有同 key 的配置则覆盖
      toolCfg.providers[cwProvider].api_keys[keyAlias] = {
        key: cwProviderCfg.api_key || '',
        label: '从 CodeWhale 导入',
        models: cwModelName ? [cwModelName] : [],
        default_model: cwModelName || '',
        base_url: cwProviderCfg.base_url || '',
      };

      // 设置为当前活动
      toolCfg.model = {
        active_provider: cwProvider,
        active_api_key: keyAlias,
        active_model: cwModelName || '',
      };

      this._engine.write(toolCfg);

      return {
        success: true,
        message: `已从 CodeWhale 导入 provider "${cwProvider}"，模型 "${cwModelName}"`,
        imported: { provider: cwProvider, key_alias: keyAlias },
      };
    } catch (err) {
      return { success: false, message: `读取 CodeWhale 配置失败: ${err.message}` };
    }
  }

  // ─── 同步：工具 → CodeWhale ──────────────────────────────────

  /**
   * 将工具中当前激活的配置同步写入 CodeWhale 全局配置
   *
   * 写入 CodeWhale 原生格式（不覆盖工具自己的字段）：
   *   [model]          → provider + model
   *   [providers.xxx]  → api_key + base_url
   *
   * @returns {{success: boolean, message: string, active?: {provider: string, key_alias: string, model: string}}}
   */
  syncToCodeWhale() {
    const toolCfg = this._engine.read();
    const active = toolCfg.model || {};
    const activeProvider = active.active_provider || '';
    const activeApiKey = active.active_api_key || '';
    const activeModel = active.active_model || '';

    if (!activeProvider || !activeApiKey) {
      return { success: false, message: '工具中未设置激活的 provider 或 API key' };
    }

    const providerCfg = toolCfg.providers?.[activeProvider];
    const keyCfg = providerCfg?.api_keys?.[activeApiKey];
    if (!keyCfg) {
      return { success: false, message: `找不到 "${activeProvider}/${activeApiKey}" 的配置` };
    }

    // 构建 CodeWhale 格式
    const cwConfig = {
      model: {
        provider: activeProvider,
        model: activeModel || keyCfg.default_model || (keyCfg.models?.[0]) || '',
      },
      providers: {
        [activeProvider]: {
          api_key: keyCfg.key || '',
        },
      },
    };

    // 只在有值时添加 base_url
    if (keyCfg.base_url) {
      cwConfig.providers[activeProvider].base_url = keyCfg.base_url;
    }

    // 写入
    const cwPath = codeWhalePath();
    const dir = dirname(cwPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const toml = '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n' + stringify(cwConfig);
    writeFileSync(cwPath, toml, 'utf-8');

    return {
      success: true,
      message: `已同步到 CodeWhale: provider="${activeProvider}", model="${cwConfig.model.model}"`,
      active: { provider: activeProvider, key_alias: activeApiKey, model: cwConfig.model.model },
    };
  }

  /**
   * 预览将要同步到 CodeWhale 的内容（不实际写入）
   * @returns {{content: string, provider: string, model: string}}
   */
  previewSync() {
    const toolCfg = this._engine.read();
    const active = toolCfg.model || {};

    const cwConfig = {
      model: {
        provider: active.active_provider || '',
        model: active.active_model || '',
      },
      providers: {}
    };

    const keyCfg = toolCfg.providers?.[active.active_provider]?.api_keys?.[active.active_api_key];
    if (keyCfg) {
      cwConfig.providers[active.active_provider] = {
        api_key: keyCfg.key || '',
      };
      if (keyCfg.base_url) {
        cwConfig.providers[active.active_provider].base_url = keyCfg.base_url;
      }
    }

    return {
      content: '# 预览：将写入 ~/.codewhale/config.toml 的内容\n\n' + stringify(cwConfig),
      provider: cwConfig.model.provider,
      model: cwConfig.model.model,
    };
  }

  /**
   * 从工具配置中删除 CodeWhale 不兼容的字段（修复被污染的全局配置）
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

      // 删除工具特有的字段
      if (cfg.model) {
        delete cfg.model.active_provider;
        delete cfg.model.active_api_key;
        delete cfg.model.active_model;
      }

      // 清理 providers 中的工具格式（嵌套 api_keys）
      if (cfg.providers) {
        for (const [name, pCfg] of Object.entries(cfg.providers)) {
          delete pCfg.label;
          // 如果有嵌套 api_keys 且格式不兼容，尝试提取第一个 key
          if (pCfg.api_keys && !pCfg.api_key) {
            const firstKey = Object.values(pCfg.api_keys)[0];
            if (firstKey) {
              pCfg.api_key = firstKey.key || '';
              if (firstKey.base_url) pCfg.base_url = firstKey.base_url;
            }
            delete pCfg.api_keys;
          }
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
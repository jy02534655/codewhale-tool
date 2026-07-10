/**
 * provider/index.js — provider 模块入口
 *
 * provider 层负责管理 AI 服务配置，分为两类：
 *   1. 官方 API key：DeepSeek 官方提供的 API key，支持多 key 切换
 *   2. 第三方供应商：如 SiliconFlow、OpenAI 兼容服务等，每个供应商可配置多个模型
 *
 * 本文件作为统一入口，外部模块应只 import 本文件，不应直接 import 子模块。
 *
 * 子模块职责：
 *   - officialKey.js：官方 API key 的增删改查、激活切换、别名管理
 *   - provider.js：第三方供应商的增删改查、模型管理、激活状态管理
 *
 * @module provider
 */
export { OfficialKeyManager, maskKey } from './officialKey.js';
export { ProviderManager } from './provider.js';

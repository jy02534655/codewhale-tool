/**
 * download/index.js — 下载模块 facade
 *
 * 统一导出所有下载策略和工具，保持稳定的外部接口面。
 * 业务逻辑委托到各子模块：
 *   - orchestrator.js  编排层：策略路由、Tar/API 回退
 *   - shared.js        共享基础设施：writeSkillLog
 *   - utils.js         工具函数、阶段常量
 *   - http.js          HTTP 下载策略（Tar 流式 + API 并发）
 *   - zip.js           ZIP 下载 + 解压策略
 *
 * 外部调用只 import 本文件，不需知道内部重构。
 *
 * @module download/index
 */

export { writeSkillLog } from './shared.js';
export { downloadSkillFromGitHub } from './orchestrator.js';
export { DOWNLOAD_STAGES, createAgent, emitProgress, parseRepoUrl, ProgressEmitter, proxyToUrl, applyRenameMap } from './utils.js';
export { downloadViaTar, downloadViaApi, detectTarballSize, detectSkillPrefix } from './http.js';
export { downloadAndExtractZip } from './zip.js';

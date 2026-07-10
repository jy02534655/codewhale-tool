/**
 * download/index.js — 下载模块 facade（外观 / 入口）
 *
 * 这是 download 层的唯一对外入口。外部模块（如 skill/install.js）
 * 不应该直接 import download 内部的子模块，而应该只 import 本文件。
 *
 * 职责：
 *   1. 统一导出所有下载策略和工具函数，保持稳定的外部接口面
 *   2. 隐藏内部模块拆分细节，未来重构子模块结构时外部代码无需改动
 *   3. 将具体实现委托给各子模块，本文件只做转发
 *
 * 子模块职责一览：
 *   - orchestrator.js  编排层：策略路由、Tar/API 回退、最终验证
 *   - shared.js        共享基础设施：writeSkillLog（日志文件写入）
 *   - utils.js         工具函数、阶段常量、代理配置、进度发射器
 *   - http.js          HTTP 下载策略（Tar 流式解压 + Octokit API 并发下载）
 *   - zip.js           ZIP 下载 + 解压策略
 *
 * @module download/index
 */
export { writeSkillLog } from './shared.js';
export { downloadSkillFromGitHub } from './orchestrator.js';
export { DOWNLOAD_STAGES, createAgent, emitProgress, parseRepoUrl, ProgressEmitter, proxyToUrl, applyRenameMap } from './utils.js';
export { downloadViaTar, downloadViaApi, detectTarballSize, detectSkillPrefix } from './http.js';
export { downloadAndExtractZip } from './zip.js';

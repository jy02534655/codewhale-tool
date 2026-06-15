/**
 * @codewhale/server — Express API 服务入口
 *
 * 纯 API 服务。组合中间件、各领域路由模块并启动 HTTP 监听。
 * 错误捕获由 @codewhale/core 的 guard/guardAsync 统一处理，
 * 语言由 langMiddleware 自动提取并挂载到 req.lang，
 * 所有消息在核心层统一本地化，Server 层直接透传。
 * 监听端口 3456，统一 JSON 响应格式 { success, data, message }。
 */

import express from 'express';
import {
  ConfigEngine,
  ProjectSkillEngine,
  ProviderManager,
  OfficialKeyManager,
  SkillManager,
  SyncManager,
} from '@codewhale/core';
import { noCache, langMiddleware } from './src/middleware.js';
import { createOfficialKeyRouter } from './src/routes/officialKey.js';
import { createProviderRouter } from './src/routes/provider.js';
import { createSkillRouter } from './src/routes/skill.js';
import { createSyncRouter } from './src/routes/sync.js';

// ─── 初始化核心管理器 ──────────────────────────────────────────

const engine = new ConfigEngine();
const projectSkillEngine = new ProjectSkillEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const skillMgr = new SkillManager(engine, projectSkillEngine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);

// 启动时从 CodeWhale 配置同步到 store.json
syncMgr.initSync();

// 自动发现本机已有 skill
skillMgr.discover();

// ─── 创建 Express 应用 ─────────────────────────────────────────

const app = express();

app.use(express.json());
app.use('/api', noCache);
app.use('/api', langMiddleware);

// ─── 挂载路由模块 ──────────────────────────────────────────────

app.use('/api/official-key', createOfficialKeyRouter(officialKeyMgr, syncMgr));
app.use('/api/provider', createProviderRouter(providerMgr, syncMgr));
app.use('/api/skill', createSkillRouter(skillMgr));
app.use('/api', createSyncRouter(syncMgr));

// ─── 启动服务 ──────────────────────────────────────────────────

const PORT = 3456;
app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
  console.log('Project skill file: ' + projectSkillEngine.path);
});
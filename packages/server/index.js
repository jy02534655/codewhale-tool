/**
 * @codewhale/server — Express API 服务入口
 *
 * 纯 API 服务。组合中间件、各领域路由模块并启动 HTTP 监听。
 * 错误捕获由 @codewhale/core 的 guard/guardAsync 统一处理。
 * 语言偏好持久化到 store.json，启动时自动恢复。
 * 监听端口 7000，统一 JSON 响应格式 { success, data, message }。
 */

import express from 'express';
import {
  ConfigEngine,
  ProviderManager,
  OfficialKeyManager,
  ProxyManager,
  TokenManager,
  SkillManager,
  SyncManager,
  setLocale,
  FileManager,
  ProjectManager,
} from '@codewhale/core';
import { createLangRouter } from './src/routes/lang.js';
import { createOfficialKeyRouter } from './src/routes/officialKey.js';
import { createProviderRouter } from './src/routes/provider/index.js';
import { createProxyRouter } from './src/routes/proxy.js';
import { createTokenRouter } from './src/routes/token.js';
import { createSkillRouter } from './src/routes/skill/index.js';
import { createSyncRouter } from './src/routes/sync.js';
import { createProjectRouter } from './src/routes/project.js';
import { createFileRouter } from './src/routes/file.js';

/**
 * 全局禁用 API 缓存中间件
 */
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
}

// ─── 初始化核心管理器 ──────────────────────────────────────────

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const proxyMgr = new ProxyManager(engine);
const tokenMgr = new TokenManager(engine);
const projectMgr = new ProjectManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);
const fileMgr = new FileManager();
engine.projectManager = projectMgr;

// 从持久化存储恢复语言偏好
const savedLocale = engine.getLocale();
if (savedLocale) setLocale(savedLocale);

// 启动时从 CodeWhale 配置同步到 store.json
syncMgr.initSync();

// 自动发现本机已有 skill
skillMgr.discover();

// ─── 创建 Express 应用 ─────────────────────────────────────────

const app = express();

app.use(express.json());
app.use('/api', noCache);

// ─── 挂载路由模块 ──────────────────────────────────────────────

app.use('/api', createLangRouter(engine));
app.use('/api/official-key', createOfficialKeyRouter(officialKeyMgr, syncMgr));
app.use('/api/provider', createProviderRouter(providerMgr, syncMgr));
app.use('/api/proxy', createProxyRouter(proxyMgr));
app.use('/api/token', createTokenRouter(tokenMgr));
app.use('/api/project', createProjectRouter(projectMgr));
app.use('/api/files', createFileRouter(fileMgr));
app.use('/api/skill', createSkillRouter(skillMgr));
app.use('/api', createSyncRouter(syncMgr));

// ─── 启动服务 ──────────────────────────────────────────────────

const PORT = 7000;
const server = app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
});

// 端口被占用时给出提示而非静默崩溃
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ 端口 ' + PORT + ' 已被占用，请先关闭旧进程（netstat -ano | findstr :' + PORT + '）');
    process.exit(1);
  }
});
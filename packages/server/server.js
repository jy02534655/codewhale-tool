/**
 * @codewhale/server — Express API server for codewhale-tool
 *
 * 纯 API 服务。错误捕获由 @codewhale/core 的 guard/guardAsync 统一处理，
 * 服务器消息由 @codewhale/core 的 getServerMessage 统一提供。
 * 监听端口 3456，统一 JSON 响应格式 { success, data, message }。
 */
import express from 'express';
import {
  ConfigEngine,
  ProviderManager,
  OfficialKeyManager,
  SkillManager,
  SyncManager,
  probeProvider,
  guard,
  guardAsync,
  getServerMessage,
} from '@codewhale/core';

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);

syncMgr.initSync();

const app = express();
app.use(express.json());

// 全局禁用 API 缓存
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
});

// ─── 响应辅助 ──────────────────────────────────────────────────

function ok(data, message) {
  return { success: true, data: data !== undefined ? data : null, message: message || '' };
}
function fail(message) {
  return { success: false, data: null, message };
}

// ─── 语言提取 ──────────────────────────────────────────────────

function langOf(req) {
  return req.query.lang || req.body?.lang || 'zh-Hans';
}

// ════════════════════════════════════════════════════════════════
// 官方 API Key API
// ════════════════════════════════════════════════════════════════

app.get('/api/official-key/list', (_req, res) => {
  res.json(guard(() => ok(officialKeyMgr.list())));
});

app.post('/api/official-key/add', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = officialKeyMgr.add(req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, r.message || getServerMessage(l, 'keyAdded')) : fail(r.message);
  }));
});

app.put('/api/official-key/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
    return r.success ? ok(null, getServerMessage(l, 'aliasUpdated')) : fail(r.message);
  }));
});

app.put('/api/official-key/:id/alias', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
    return r.success ? ok(null, getServerMessage(l, 'aliasUpdated')) : fail(r.message);
  }));
});

app.post('/api/official-key/:id/activate', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = syncMgr.activateOfficialAndSync(req.params.id);
    return r.success ? ok(null, getServerMessage(l, 'keyActivated')) : fail(r.message);
  }));
});

app.delete('/api/official-key/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = officialKeyMgr.remove(req.params.id);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'deleted')) : fail(r.message);
  }));
});

// ════════════════════════════════════════════════════════════════
// Provider API
// ════════════════════════════════════════════════════════════════

app.get('/api/provider/list', (_req, res) => {
  res.json(guard(() => ok(providerMgr.listProviders())));
});

app.get('/api/provider/active', (_req, res) => {
  res.json(guard(() => ok({
    active: providerMgr.getActiveProvider(),
    active_model: providerMgr.getActiveModel(),
  })));
});

// ════════════════════════════════════════════════════════════════
// 模型管理 API（必须在 :id 路由之前）
// ════════════════════════════════════════════════════════════════

app.post('/api/provider/models/add', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = providerMgr.addModel(req.body.id, req.body.name);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'modelAdded')) : fail(r.message);
  }));
});

app.post('/api/provider/models/delete', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = providerMgr.removeModel(req.body.id, req.body.name);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'modelDeleted')) : fail(r.message);
  }));
});

app.post('/api/provider/models/activate', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = syncMgr.setActiveModelAndSync(req.body.id, req.body.name);
    return r.success ? ok(null, getServerMessage(l, 'modelSet')) : fail(r.message);
  }));
});

app.get('/api/provider/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const p = providerMgr.getProvider(req.params.id);
    return p ? ok(p) : fail(getServerMessage(l, 'providerNotFound'));
  }));
});

app.post('/api/provider/add', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = providerMgr.addProvider(req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, r.message || getServerMessage(l, 'added')) : fail(r.message);
  }));
});

app.put('/api/provider/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = providerMgr.updateProvider(req.params.id, req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'updated')) : fail(r.message);
  }));
});

app.delete('/api/provider/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = providerMgr.removeProvider(req.params.id);
    if (r.success) syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'deleted')) : fail(r.message);
  }));
});

app.post('/api/provider/:id/activate', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = syncMgr.activateAndSync(req.params.id);
    return r.success ? ok(null, getServerMessage(l, 'activated')) : fail(r.message);
  }));
});

app.post('/api/provider/deactivate', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = syncMgr.deactivateAndSync();
    return r.success ? ok(null, getServerMessage(l, 'deactivated')) : fail(r.message);
  }));
});

app.post('/api/provider/probe', async (req, res) => {
  res.json(await guardAsync(async () =>
    ok(await probeProvider(req.body.provider, req.body.api_key, req.body.base_url))
  ));
});

// ════════════════════════════════════════════════════════════════
// 同步 API
// ════════════════════════════════════════════════════════════════

app.post('/api/sync', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = syncMgr.syncToCodeWhale();
    return r.success ? ok(null, getServerMessage(l, 'synced')) : fail(r.message);
  }));
});

app.post('/api/init-sync', (req, res) => {
  res.json(guard(() => {
    const r = syncMgr.initSync();
    return r.success ? ok(null, r.message) : fail(r.message);
  }));
});

// ════════════════════════════════════════════════════════════════
// Skill API
// ════════════════════════════════════════════════════════════════

app.get('/api/skill/list', (_req, res) => {
  res.json(guard(() => ok(skillMgr.listInstalled())));
});

app.get('/api/skill/show/:id', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const { entry, readme } = skillMgr.show(req.params.id);
    return entry ? ok({ entry, readme }) : fail(getServerMessage(l, 'notFound'));
  }));
});

app.post('/api/skill/install', async (req, res) => {
  res.json(await guardAsync(async () => ok(await skillMgr.install(req.body.id))));
});

app.post('/api/skill/enable/:id', (req, res) => {
  res.json(guard(() => ok(skillMgr.enable(req.params.id))));
});

app.post('/api/skill/disable/:id', (req, res) => {
  res.json(guard(() => ok(skillMgr.disable(req.params.id))));
});

app.delete('/api/skill/remove/:id', (req, res) => {
  res.json(guard(() => ok(skillMgr.remove(req.params.id))));
});

app.get('/api/skill/search', async (req, res) => {
  res.json(await guardAsync(async () => {
    const result = await skillMgr.searchCommunity();
    if (result.success) {
      const q = (req.query.q || '').toLowerCase();
      result.skills = q
        ? result.skills.filter((s) => s.id.toLowerCase().includes(q))
        : result.skills;
    }
    return ok(result.skills || []);
  }));
});

// ─── 启动 ──────────────────────────────────────────────────────

const PORT = 3456;
app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
});
/**
 * Express API server for codewhale-tool Web UI.
 *
 * Port: 3456
 */

import express from 'express';
import {
  ConfigEngine,
  ProviderManager,
  OfficialKeyManager,
  SkillManager,
  SyncManager,
  probeProvider,
} from '@codewhale/core';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);

// 启动时从 CodeWhale 同步
syncMgr.initSync();

const app = express();
app.use(express.json());

const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Static files: ' + distPath);
}

// ════════════════════════════════════════════════════════════════
// 官方 API Key API
// ════════════════════════════════════════════════════════════════

app.get('/api/official-key/list', (_req, res) => {
  try {
    res.json({ success: true, keys: officialKeyMgr.list() });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/official-key/add', (req, res) => {
  try {
    const result = officialKeyMgr.add(req.body);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.put('/api/official-key/:id/alias', (req, res) => {
  try {
    res.json(officialKeyMgr.updateAlias(req.params.id, req.body.alias));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/official-key/:id/activate', (req, res) => {
  try {
    const result = syncMgr.activateOfficialAndSync(req.params.id);
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/official-key/:id', (req, res) => {
  try {
    const result = officialKeyMgr.remove(req.params.id);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// Provider API
// ════════════════════════════════════════════════════════════════

app.get('/api/provider/list', (_req, res) => {
  try {
    res.json({ success: true, providers: providerMgr.listProviders() });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/provider/active', (_req, res) => {
  try {
    const active = providerMgr.getActiveProvider();
    const activeModel = providerMgr.getActiveModel();
    res.json({ success: true, active, active_model: activeModel });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/provider/:id', (req, res) => {
  try {
    const p = providerMgr.getProvider(req.params.id);
    res.json(p ? { success: true, provider: p } : { success: false, message: 'Provider 不存在' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/provider/add', (req, res) => {
  try {
    const result = providerMgr.addProvider(req.body);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.put('/api/provider/:id', (req, res) => {
  try {
    const result = providerMgr.updateProvider(req.params.id, req.body);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/provider/:id', (req, res) => {
  try {
    const result = providerMgr.removeProvider(req.params.id);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/provider/:id/activate', (req, res) => {
  try {
    res.json(syncMgr.activateAndSync(req.params.id));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/provider/deactivate', (_req, res) => {
  try {
    res.json(syncMgr.deactivateAndSync());
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/provider/probe', async (req, res) => {
  try {
    res.json(await probeProvider(req.body.provider, req.body.api_key, req.body.base_url));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 模型管理 API
// ════════════════════════════════════════════════════════════════

app.post('/api/provider/:id/models', (req, res) => {
  try {
    const result = providerMgr.addModel(req.params.id, req.body.name);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/provider/:id/models/:modelName', (req, res) => {
  try {
    const modelName = decodeURIComponent(req.params.modelName);
    const result = providerMgr.removeModel(req.params.id, modelName);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.put('/api/provider/:id/models/:modelName/activate', (req, res) => {
  try {
    const modelName = decodeURIComponent(req.params.modelName);
    res.json(syncMgr.setActiveModelAndSync(req.params.id, modelName));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 同步 API
// ════════════════════════════════════════════════════════════════

app.post('/api/sync', (_req, res) => {
  try { res.json(syncMgr.syncToCodeWhale()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/init-sync', (_req, res) => {
  try { res.json(syncMgr.initSync()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// Skill API（保留但不暴露前端入口）
// ════════════════════════════════════════════════════════════════

app.get('/api/skill/list', (_req, res) => {
  try { res.json({ success: true, skills: skillMgr.listInstalled() }); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/skill/show/:id', (req, res) => {
  try {
    const { entry, readme } = skillMgr.show(req.params.id);
    res.json(entry ? { success: true, entry, readme } : { success: false, message: 'Not found' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/skill/install', async (req, res) => {
  try { res.json(await skillMgr.install(req.body.id)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/skill/enable/:id', (req, res) => {
  try { res.json(skillMgr.enable(req.params.id)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/skill/disable/:id', (req, res) => {
  try { res.json(skillMgr.disable(req.params.id)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.delete('/api/skill/remove/:id', (req, res) => {
  try { res.json(skillMgr.remove(req.params.id)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/skill/search', async (req, res) => {
  try {
    const result = await skillMgr.searchCommunity();
    if (result.success) {
      const q = (req.query.q || '').toLowerCase();
      result.skills = q
        ? result.skills.filter((s) => s.id.toLowerCase().includes(q))
        : result.skills;
    }
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// SPA fallback
// ════════════════════════════════════════════════════════════════

if (existsSync(distPath)) {
  app.get('*', (_req, res) => { res.sendFile(join(distPath, 'index.html')); });
}

const PORT = 3456;
app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
});

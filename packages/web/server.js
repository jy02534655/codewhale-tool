/**
 * Express API server for codewhale-tool Web UI.
 *
 * Port: 3456
 */

import express from 'express';
import { ConfigEngine, ProviderManager, SkillManager, SyncManager, probeProvider } from '@codewhale/core';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine);

const app = express();
app.use(express.json());

const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Static files: ' + distPath);
}

// ---- Provider API ----

app.get('/api/provider/tree', (_req, res) => {
  try { res.json({ success: true, tree: providerMgr.getTree() }); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/provider/active', (_req, res) => {
  try { res.json({ success: true, active: providerMgr.getActive() }); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/provider/switch', (req, res) => {
  try {
    var p = req.body.provider, k = req.body.apiKey, m = req.body.model;
    var result = providerMgr.switch({ provider: p, apiKey: k, model: m });
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/provider/add', (req, res) => {
  try {
    var result = providerMgr.addProvider(req.body.name, req.body.label);
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/provider/add-key', (req, res) => {
  try {
    var result = providerMgr.addApiKey(
      req.body.provider, req.body.alias, req.body.key,
      req.body.label, req.body.models || [], req.body.baseUrl || ''
    );
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.delete('/api/provider/remove/:name', (req, res) => {
  try { res.json(providerMgr.removeProvider(req.params.name)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.delete('/api/provider/remove-key/:provider/:alias', (req, res) => {
  try { res.json(providerMgr.removeApiKey(req.params.provider, req.params.alias)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/provider/probe/:provider/:alias', async (req, res) => {
  try {
    var prov = providerMgr._getProvider(req.params.provider);
    if (!prov) return res.json({ success: false, message: 'Provider not found' });
    var entry = prov.api_keys[req.params.alias];
    if (!entry) return res.json({ success: false, message: 'API key not found' });
    var result = await probeProvider(req.params.provider, entry.key);
    if (result.success) {
      providerMgr.addApiKey(req.params.provider, req.params.alias, entry.key, entry.label, result.models, entry.base_url);
    }
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ---- Sync / Import / Repair API ----

app.post('/api/provider/import', (req, res) => {
  try { res.json(syncMgr.importFromCodeWhale()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/provider/sync', (req, res) => {
  try { res.json(syncMgr.syncToCodeWhale()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/provider/preview-sync', (req, res) => {
  try { res.json(syncMgr.previewSync()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/provider/repair', (req, res) => {
  try { res.json(SyncManager.repairCodeWhaleConfig()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// ---- 模型管理 API (新) ----

// 获取完整模型配置
app.get('/api/model/config', (_req, res) => {
  try {
    var config = providerMgr.getConfig();
    var providers = providerMgr.listProviders();
    var active = providerMgr.getProvider(config.active_provider);
    res.json({ success: true, config: config, providers: providers, active_detail: active });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// 更新官方 API key
app.post('/api/model/official', (req, res) => {
  try { res.json(providerMgr.setOfficialApiKey(req.body.api_key || '')); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 切换第三方开关 / 激活 provider
app.post('/api/model/toggle', (req, res) => {
  try { res.json(providerMgr.setUseThirdParty(!!req.body.enabled, req.body.provider || '')); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 切换当前激活的第三方 provider
app.post('/api/model/switch', (req, res) => {
  try { res.json(providerMgr.switchProvider(req.body.provider || '')); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 添加第三方 provider
app.post('/api/model/provider', (req, res) => {
  try {
    res.json(providerMgr.addProvider(req.body.name, {
      label: req.body.label,
      api_key: req.body.api_key,
      base_url: req.body.base_url,
      model: req.body.model,
    }));
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// 更新第三方 provider
app.put('/api/model/provider/:name', (req, res) => {
  try {
    res.json(providerMgr.updateProvider(req.params.name, {
      label: req.body.label,
      api_key: req.body.api_key,
      base_url: req.body.base_url,
      model: req.body.model,
    }));
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// 删除第三方 provider
app.delete('/api/model/provider/:name', (req, res) => {
  try { res.json(providerMgr.removeProvider(req.params.name)); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 获取单个 provider 完整信息（含 API key，供编辑）
app.get('/api/model/provider/:name', (req, res) => {
  try {
    var prov = providerMgr.getProvider(req.params.name);
    if (prov) res.json({ success: true, provider: prov });
    else res.json({ success: false, message: 'Provider 不存在' });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// 同步到 CodeWhale
app.post('/api/model/sync', (_req, res) => {
  try { res.json(syncMgr.syncToCodeWhale()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 预览同步内容
app.get('/api/model/sync-preview', (_req, res) => {
  try { res.json(syncMgr.previewSync()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// 从 CodeWhale 导入
app.post('/api/model/import', (_req, res) => {
  try { res.json(syncMgr.importFromCodeWhale()); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

// ---- Skill API ----

app.get('/api/skill/list', (_req, res) => {
  try { res.json({ success: true, skills: skillMgr.listInstalled() }); }
  catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/skill/show/:id', (req, res) => {
  try {
    var result = skillMgr.show(req.params.id);
    res.json(result.entry ? { success: true, entry: result.entry, readme: result.readme } : { success: false, message: 'Not found' });
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
    var result = await skillMgr.searchCommunity();
    if (result.success) {
      var q = (req.query.q || '').toLowerCase();
      result.skills = q ? result.skills.filter(function(s) { return s.id.toLowerCase().indexOf(q) !== -1; }) : result.skills;
    }
    res.json(result);
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ---- SPA fallback ----

if (existsSync(distPath)) {
  app.get('*', function(_req, res) {
    res.sendFile(join(distPath, 'index.html'));
  });
}

var PORT = 3456;
app.listen(PORT, function() {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Config file: ' + engine.path);
});
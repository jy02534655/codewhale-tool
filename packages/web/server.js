/**
 * Express API server for codewhale-tool Web UI.
 *
 * Port: 3456
 */

import express from 'express';
import {
  ConfigEngine,
  ProviderManager,
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
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr);

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
// Provider API
// ════════════════════════════════════════════════════════════════

// 列出所有 provider（掩码 API key）
app.get('/api/provider/list', (_req, res) => {
  try {
    const providers = providerMgr.listProviders();
    res.json({ success: true, providers });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 获取当前激活的 provider 和模型
app.get('/api/provider/active', (_req, res) => {
  try {
    const active = providerMgr.getActiveProvider();
    const activeModel = providerMgr.getActiveModel();
    res.json({ success: true, active, active_model: activeModel });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 获取单个 provider 详情（含完整 API key，供编辑）
app.get('/api/provider/:id', (req, res) => {
  try {
    const p = providerMgr.getProvider(req.params.id);
    if (p) res.json({ success: true, provider: p });
    else res.json({ success: false, message: 'Provider 不存在' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 添加 provider
app.post('/api/provider/add', (req, res) => {
  try {
    const { provider, api_key, label, base_url, models } = req.body;
    const result = providerMgr.addProvider({ provider, api_key, label, base_url, models });
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 更新 provider 基础信息
app.put('/api/provider/:id', (req, res) => {
  try {
    const result = providerMgr.updateProvider(req.params.id, req.body);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 删除 provider
app.delete('/api/provider/:id', (req, res) => {
  try {
    const result = providerMgr.removeProvider(req.params.id);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 激活 provider（开启第三方模式）
app.post('/api/provider/:id/activate', (req, res) => {
  try {
    const result = syncMgr.activateAndSync(req.params.id);
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 关闭第三方模式
app.post('/api/provider/deactivate', (_req, res) => {
  try {
    const result = syncMgr.deactivateAndSync();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Provider 连通性探测
app.post('/api/provider/probe', async (req, res) => {
  try {
    const { provider, api_key, base_url } = req.body;
    const result = await probeProvider(provider, api_key, base_url);
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 模型管理 API
// ════════════════════════════════════════════════════════════════

// 添加模型
app.post('/api/provider/:id/models', (req, res) => {
  try {
    const result = providerMgr.addModel(req.params.id, req.body.name);
    if (result.success) syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// 删除模型
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

// 设置当前激活模型
app.put('/api/provider/:id/models/:modelName/activate', (req, res) => {
  try {
    const modelName = decodeURIComponent(req.params.modelName);
    const result = syncMgr.setActiveModelAndSync(req.params.id, modelName);
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 官方 API Key API
// ════════════════════════════════════════════════════════════════

app.get('/api/official-key', (_req, res) => {
  try {
    const key = engine.getOfficialApiKey();
    const masked = key ? key.slice(0, 5) + '...' + key.slice(-4) : '';
    res.json({ success: true, has_key: !!key, api_key_preview: masked });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/official-key', (req, res) => {
  try {
    engine.setOfficialApiKey(req.body.api_key || '');
    syncMgr.syncToCodeWhale();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 同步 API
// ════════════════════════════════════════════════════════════════

app.post('/api/sync', (_req, res) => {
  try {
    const result = syncMgr.syncToCodeWhale();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/init-sync', (_req, res) => {
  try {
    const result = syncMgr.initSync();
    res.json(result);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// Skill API
// ════════════════════════════════════════════════════════════════

app.get('/api/skill/list', (_req, res) => {
  try {
    res.json({ success: true, skills: skillMgr.listInstalled() });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/skill/show/:id', (req, res) => {
  try {
    const { entry, readme } = skillMgr.show(req.params.id);
    res.json(
      entry
        ? { success: true, entry, readme }
        : { success: false, message: 'Not found' }
    );
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/skill/install', async (req, res) => {
  try {
    res.json(await skillMgr.install(req.body.id));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/skill/enable/:id', (req, res) => {
  try {
    res.json(skillMgr.enable(req.params.id));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/skill/disable/:id', (req, res) => {
  try {
    res.json(skillMgr.disable(req.params.id));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/skill/remove/:id', (req, res) => {
  try {
    res.json(skillMgr.remove(req.params.id));
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
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
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// SPA fallback
// ════════════════════════════════════════════════════════════════

if (existsSync(distPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = 3456;
app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
});

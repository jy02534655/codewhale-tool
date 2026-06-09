/**
 * @codewhale/server — Express API server for codewhale-tool
 *
 * 纯 API 服务，不托管静态文件。
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
} from '@codewhale/core';

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);

syncMgr.initSync();

const app = express();
app.use(express.json());

// 全局禁用 API 缓存，确保始终返回 200
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

// ─── 多语言消息 ────────────────────────────────────────────────

const MSG = {
  'zh-Hans': {
    providerNotFound: '供应商不存在',
    officialKeyNotFound: 'API key 不存在',
    added: '已添加',
    deleted: '已删除',
    updated: '已更新',
    activated: '已激活',
    deactivated: '已切换回官方 API',
    modelAdded: '模型已添加',
    modelDeleted: '模型已删除',
    modelSet: '当前模型已切换',
    keyAdded: '已添加',
    keyActivated: '已激活',
    aliasUpdated: '别名已更新',
    notFound: '未找到',
    synced: '同步完成',
  },
  'en': {
    providerNotFound: 'Vendor not found',
    officialKeyNotFound: 'API key not found',
    added: 'Added',
    deleted: 'Deleted',
    updated: 'Updated',
    activated: 'Activated',
    deactivated: 'Switched to official API',
    modelAdded: 'Model added',
    modelDeleted: 'Model deleted',
    modelSet: 'Model switched',
    keyAdded: 'Added',
    keyActivated: 'Activated',
    aliasUpdated: 'Alias updated',
    notFound: 'Not found',
    synced: 'Synced',
  },
  'ja': {
    providerNotFound: 'ベンダーが見つかりません',
    officialKeyNotFound: 'APIキーが見つかりません',
    added: '追加しました',
    deleted: '削除しました',
    updated: '更新しました',
    activated: '有効化しました',
    deactivated: '公式APIに切り替えました',
    modelAdded: 'モデルを追加しました',
    modelDeleted: 'モデルを削除しました',
    modelSet: 'モデルを切り替えました',
    keyAdded: '追加しました',
    keyActivated: '有効化しました',
    aliasUpdated: '別名を更新しました',
    notFound: '見つかりません',
    synced: '同期完了',
  },
  'pt-BR': {
    providerNotFound: 'Fornecedor não encontrado',
    officialKeyNotFound: 'Chave não encontrada',
    added: 'Adicionado',
    deleted: 'Excluído',
    updated: 'Atualizado',
    activated: 'Ativado',
    deactivated: 'Alternou para API oficial',
    modelAdded: 'Modelo adicionado',
    modelDeleted: 'Modelo excluído',
    modelSet: 'Modelo alterado',
    keyAdded: 'Adicionado',
    keyActivated: 'Ativado',
    aliasUpdated: 'Apelido atualizado',
    notFound: 'Não encontrado',
    synced: 'Sincronizado',
  },
};

function getLang(req) {
  return req.query.lang || req.body?.lang || 'zh-Hans';
}
function t(req, key) {
  const lang = getLang(req);
  return (MSG[lang] && MSG[lang][key]) || MSG['zh-Hans'][key] || '';
}

// ════════════════════════════════════════════════════════════════
// 官方 API Key API
// ════════════════════════════════════════════════════════════════

app.get('/api/official-key/list', (_req, res) => {
  try { res.json(ok(officialKeyMgr.list())); }
  catch (err) { res.json(fail(err.message)); }
});

app.post('/api/official-key/add', (req, res) => {
  try {
    const r = officialKeyMgr.add(req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, r.message || t(req, 'keyAdded')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

// 统一编辑接口：接受完整 body { alias, api_key }，仅更新 alias
app.put('/api/official-key/:id', (req, res) => {
  try {
    const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
    res.json(r.success ? ok(null, t(req, 'aliasUpdated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.put('/api/official-key/:id/alias', (req, res) => {
  try {
    const r = officialKeyMgr.updateAlias(req.params.id, req.body.alias);
    res.json(r.success ? ok(null, t(req, 'aliasUpdated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/official-key/:id/activate', (req, res) => {
  try {
    const r = syncMgr.activateOfficialAndSync(req.params.id);
    res.json(r.success ? ok(null, t(req, 'keyActivated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.delete('/api/official-key/:id', (req, res) => {
  try {
    const r = officialKeyMgr.remove(req.params.id);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'deleted')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

// ════════════════════════════════════════════════════════════════
// Provider API
// ════════════════════════════════════════════════════════════════

app.get('/api/provider/list', (_req, res) => {
  try { res.json(ok(providerMgr.listProviders())); }
  catch (err) { res.json(fail(err.message)); }
});

app.get('/api/provider/active', (_req, res) => {
  try {
    res.json(ok({
      active: providerMgr.getActiveProvider(),
      active_model: providerMgr.getActiveModel(),
    }));
  } catch (err) { res.json(fail(err.message)); }
});

// ════════════════════════════════════════════════════════════════
// 模型管理 API（必须在 :id 路由之前，避免 models 被 :id 捕获）
// ════════════════════════════════════════════════════════════════

app.post('/api/provider/models/add', (req, res) => {
  try {
    const r = providerMgr.addModel(req.body.id, req.body.name);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'modelAdded')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/models/delete', (req, res) => {
  try {
    const r = providerMgr.removeModel(req.body.id, req.body.name);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'modelDeleted')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/models/activate', (req, res) => {
  try {
    const r = syncMgr.setActiveModelAndSync(req.body.id, req.body.name);
    res.json(r.success ? ok(null, t(req, 'modelSet')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.get('/api/provider/:id', (req, res) => {
  try {
    const p = providerMgr.getProvider(req.params.id);
    res.json(p ? ok(p) : fail(t(req, 'providerNotFound')));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/add', (req, res) => {
  try {
    const r = providerMgr.addProvider(req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, r.message || t(req, 'added')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.put('/api/provider/:id', (req, res) => {
  try {
    const r = providerMgr.updateProvider(req.params.id, req.body);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'updated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.delete('/api/provider/:id', (req, res) => {
  try {
    const r = providerMgr.removeProvider(req.params.id);
    if (r.success) syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'deleted')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/:id/activate', (req, res) => {
  try {
    const r = syncMgr.activateAndSync(req.params.id);
    res.json(r.success ? ok(null, t(req, 'activated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/deactivate', (req, res) => {
  try {
    const r = syncMgr.deactivateAndSync();
    res.json(r.success ? ok(null, t(req, 'deactivated')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/provider/probe', async (req, res) => {
  try {
    res.json(ok(await probeProvider(req.body.provider, req.body.api_key, req.body.base_url)));
  } catch (err) { res.json(fail(err.message)); }
});

// ════════════════════════════════════════════════════════════════
// 同步 API
// ════════════════════════════════════════════════════════════════

app.post('/api/sync', (req, res) => {
  try {
    const r = syncMgr.syncToCodeWhale();
    res.json(r.success ? ok(null, t(req, 'synced')) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/init-sync', (req, res) => {
  try {
    const r = syncMgr.initSync();
    res.json(r.success ? ok(null, r.message) : fail(r.message));
  } catch (err) { res.json(fail(err.message)); }
});

// ════════════════════════════════════════════════════════════════
// Skill API
// ════════════════════════════════════════════════════════════════

app.get('/api/skill/list', (_req, res) => {
  try { res.json(ok(skillMgr.listInstalled())); }
  catch (err) { res.json(fail(err.message)); }
});

app.get('/api/skill/show/:id', (req, res) => {
  try {
    const { entry, readme } = skillMgr.show(req.params.id);
    res.json(entry ? ok({ entry, readme }) : fail(t(req, 'notFound')));
  } catch (err) { res.json(fail(err.message)); }
});

app.post('/api/skill/install', async (req, res) => {
  try { res.json(ok(await skillMgr.install(req.body.id))); }
  catch (err) { res.json(fail(err.message)); }
});

app.post('/api/skill/enable/:id', (req, res) => {
  try { res.json(ok(skillMgr.enable(req.params.id))); }
  catch (err) { res.json(fail(err.message)); }
});

app.post('/api/skill/disable/:id', (req, res) => {
  try { res.json(ok(skillMgr.disable(req.params.id))); }
  catch (err) { res.json(fail(err.message)); }
});

app.delete('/api/skill/remove/:id', (req, res) => {
  try { res.json(ok(skillMgr.remove(req.params.id))); }
  catch (err) { res.json(fail(err.message)); }
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
    res.json(ok(result.skills || []));
  } catch (err) { res.json(fail(err.message)); }
});

// ─── 启动 ──────────────────────────────────────────────────────

const PORT = 3456;
app.listen(PORT, () => {
  console.log('CodeWhale Config API: http://localhost:' + PORT);
  console.log('Store file: ' + engine.path);
});
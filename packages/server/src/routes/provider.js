/**
 * @codewhale/server — Provider / 模型管理路由
 *
 * 挂载路径: /api/provider
 * 管理第三方供应商及其模型列表，包括激活/停用状态切换。
 * 模型管理子路由（/models/*）必须在 /:id 通配路由之前注册。
 */

import { Router } from 'express';
import { guard, getServerMessage } from '@codewhale/core';
import { ok, fail, langOf } from '../helpers.js';

/**
 * 创建 Provider 路由
 * @param {import('@codewhale/core').ProviderManager} providerMgr
 * @param {import('@codewhale/core').SyncManager} syncMgr
 * @returns {import('express').Router}
 */
export function createProviderRouter(providerMgr, syncMgr) {
  const router = Router();

  // ── 供应商列表与状态 ────────────────

  /** 获取所有供应商 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => ok(providerMgr.listProviders())));
  });

  /** 获取当前激活的供应商和模型 */
  router.get('/active', (_req, res) => {
    res.json(guard(() => ok({
      active: providerMgr.getActiveProvider(),
      active_model: providerMgr.getActiveModel(),
    })));
  });

  // ── 模型管理（必须在 :id 通配路由之前） ─

  /** 为指定供应商添加模型 */
  router.post('/models/add', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = providerMgr.addModel(req.body.id, req.body.name);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'modelAdded')) : fail(r.message);
    }));
  });

  /** 删除指定供应商下的模型 */
  router.post('/models/delete', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = providerMgr.removeModel(req.body.id, req.body.name);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'modelDeleted')) : fail(r.message);
    }));
  });

  /** 激活指定供应商下的某个模型 */
  router.post('/models/activate', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = syncMgr.setActiveModelAndSync(req.body.id, req.body.name);
      return r.success ? ok(null, getServerMessage(l, 'modelSet')) : fail(r.message);
    }));
  });

  // ── 供应商 CRUD ────────────────────

  /** 获取单个供应商详情 */
  router.get('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const p = providerMgr.getProvider(req.params.id);
      return p ? ok(p) : fail(getServerMessage(l, 'providerNotFound'));
    }));
  });

  /** 添加供应商 */
  router.post('/add', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = providerMgr.addProvider(req.body);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, r.message || getServerMessage(l, 'added')) : fail(r.message);
    }));
  });

  /** 更新供应商信息 */
  router.put('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = providerMgr.updateProvider(req.params.id, req.body);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'updated')) : fail(r.message);
    }));
  });

  /** 删除供应商 */
  router.delete('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = providerMgr.removeProvider(req.params.id);
      if (r.success) syncMgr.syncToCodeWhale();
      return r.success ? ok(null, getServerMessage(l, 'deleted')) : fail(r.message);
    }));
  });

  /** 激活指定供应商 */
  router.post('/:id/activate', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = syncMgr.activateAndSync(req.params.id);
      return r.success ? ok(null, getServerMessage(l, 'activated')) : fail(r.message);
    }));
  });

  /** 停用当前激活的供应商 */
  router.post('/deactivate', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = syncMgr.deactivateAndSync();
      return r.success ? ok(null, getServerMessage(l, 'deactivated')) : fail(r.message);
    }));
  });

  return router;
}
/**
 * @codewhale/server — Provider / 模型管理路由
 *
 * 挂载路径: /api/provider
 * 管理第三方供应商及其模型列表，包括激活/停用状态切换。
 * 模型管理子路由（/models/*）必须在 /:id 通配路由之前注册。
 */

import { Router } from 'express';
import { guard, withSync } from '../utils/guard.js';

export function createProviderRouter(providerMgr, syncMgr) {
  const router = Router();

  // ── 供应商列表与状态 ────────────────

  /** 获取所有供应商 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => providerMgr.listProviders()));
  });

  /** 获取当前激活的供应商和模型 */
  router.get('/active', (_req, res) => {
    res.json(guard(() => providerMgr.getActiveInfo()));
  });

  // ── 模型管理（必须在 :id 通配路由之前） ─

  /** 添加模型 */
  router.post('/models/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.addModel(req.body))));
  });

  /** 删除模型 */
  router.post('/models/delete', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.removeModel(req.body))));
  });

  /** 激活模型 */
  router.post('/models/activate', (req, res) => {
    res.json(guard(() => syncMgr.setActiveModelAndSync(req.body)));
  });

  // ── 供应商 CRUD ────────────────────

  /** 获取供应商详情 */
  router.get('/:id', (req, res) => {
    res.json(guard(() => providerMgr.getProvider(req.params.id)));
  });

  /** 添加供应商 */
  router.post('/add', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.addProvider(req.body))));
  });

  /** 更新供应商 */
  router.put('/:id', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.updateProvider({ id: req.params.id, ...req.body }))));
  });

  /** 删除供应商 */
  router.delete('/:id', (req, res) => {
    res.json(guard(() => withSync(syncMgr, () => providerMgr.removeProvider(req.params.id))));
  });

  /** 激活供应商 */
  router.post('/:id/activate', (req, res) => {
    res.json(guard(() => syncMgr.activateAndSync(req.params.id)));
  });

  /** 停用第三方 */
  router.post('/deactivate', (_req, res) => {
    res.json(guard(() => syncMgr.deactivateAndSync()));
  });

  return router;
}
/**
 * @codewhale/server — Provider 供应商列表查询路由
 *
 * 挂载路径: /api/provider
 */

import { guard, withSync } from '../../utils/guard.js';

export function registerProviderRoutes(router, providerMgr, syncMgr) {
  /** 获取所有供应商 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => providerMgr.listProviders()));
  });

  /** 获取当前激活的供应商和模型 */
  router.get('/active', (_req, res) => {
    res.json(guard(() => providerMgr.getActiveInfo()));
  });

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
}

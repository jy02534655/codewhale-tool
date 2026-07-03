/**
 * @codewhale/server — Provider / 模型管理路由
 *
 * 挂载路径: /api/provider
 * 管理第三方供应商及其模型列表，包括激活/停用状态切换。
 * 模型管理子路由（/models/*）必须在 /:id 通配路由之前注册。
 */

import { Router } from 'express';
import { registerProviderRoutes } from './provider.js';
import { registerModelRoutes } from './model.js';

export function createProviderRouter(providerMgr, syncMgr) {
  const router = Router();
  registerProviderRoutes(router, providerMgr, syncMgr);
  registerModelRoutes(router, providerMgr, syncMgr);
  return router;
}

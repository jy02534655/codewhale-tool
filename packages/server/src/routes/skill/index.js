/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 * 只保留从 GitHub 安装（SSE 流式）。
 */

import { Router } from 'express';

import { registerFilesRoutes } from './files.js';
import { registerCmdRoutes } from './cmd.js';
import { registerInstallRoutes } from './install.js';
import { registerLogRoutes } from './log.js';
import { registerRoutes } from './routes.js';

export function createSkillRouter(skillMgr) {
  const router = Router();

  registerFilesRoutes(router, skillMgr);
  registerCmdRoutes(router, skillMgr);
  registerInstallRoutes(router, skillMgr);
  registerLogRoutes(router, skillMgr);
  registerRoutes(router, skillMgr);

  return router;
}

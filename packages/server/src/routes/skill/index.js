/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 * 只保留从 GitHub 安装（SSE 流式）。
 */

import { Router } from 'express';
import { guard, guardAsync } from '../../utils/guard.js';
import multer from 'multer';
import { tmpdir } from 'node:os';

import { registerQueryRoutes } from './query.js';
import { registerMetaRoutes } from './meta.js';
import { registerReadmeRoutes } from './readme.js';
import { registerFilesRoutes } from './files.js';
import { registerCmdRoutes } from './cmd.js';
import { registerInstallRoutes } from './install.js';
import { registerSearchRoutes } from './search.js';
import { registerLogRoutes } from './log.js';
import { registerProjectRoutes } from './project.js';

export function createSkillRouter(skillMgr) {
  const router = Router();

  // 共享上传配置
  const _upload = multer({ dest: tmpdir() });
  const _pendingZipInstalls = new Map();

  registerQueryRoutes(router, skillMgr);
  registerMetaRoutes(router, skillMgr);
  registerReadmeRoutes(router, skillMgr);
  registerFilesRoutes(router, skillMgr);
  registerCmdRoutes(router, skillMgr);
  registerInstallRoutes(router, skillMgr, _upload, _pendingZipInstalls);
  registerSearchRoutes(router, skillMgr);
  registerLogRoutes(router, skillMgr);
  registerProjectRoutes(router, skillMgr);

  return router;
}

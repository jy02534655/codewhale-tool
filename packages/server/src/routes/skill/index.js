/**
 * @codewhale/server - Skill 路由
 *
 * 挂载路径: /api/skill
 * 双层 skill 管理：全局 + 项目。
 * 只保留从 GitHub 安装（SSE 流式）。
 */

import { Router } from 'express';
import multer from 'multer';
import { tmpdir } from 'node:os';

import { registerFilesRoutes } from './files.js';
import { registerCmdRoutes } from './cmd.js';
import { registerInstallRoutes } from './install.js';
import { registerLogRoutes } from './log.js';
import { registerRoutes } from './routes.js';

export function createSkillRouter(skillMgr) {
  const router = Router();

  // 共享上传配置
  const _upload = multer({ dest: tmpdir() });
  const _pendingZipInstalls = new Map();

  registerFilesRoutes(router, skillMgr);
  registerCmdRoutes(router, skillMgr);
  registerInstallRoutes(router, skillMgr, _upload, _pendingZipInstalls);
  registerLogRoutes(router, skillMgr);
  registerRoutes(router, skillMgr);

  return router;
}

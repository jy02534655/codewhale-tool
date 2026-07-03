/**
 * @codewhale/server — Skill 安装日志路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerLogRoutes(router, skillMgr) {
  /** GET /api/skill/install-log — 读取最新安装日志 */
  router.get('/install-log', (_req, res) => {
    res.json(guard(() => skillMgr.getInstallLog()));
  });

  /** DELETE /api/skill/install-log — 清除安装日志 */
  router.delete('/install-log', (_req, res) => {
    res.json(guard(() => skillMgr.clearInstallLog()));
  });
}

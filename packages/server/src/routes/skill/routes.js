/**
 * @codewhale/server — Skill 杂项路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerRoutes(router, skillMgr) {
  /** 获取全局 skill 列表 */
  router.get('/list/global', (_req, res) => {
    res.json(guard(() => skillMgr.listGlobal()));
  });

  /** 获取所有项目 skill 列表 */
  router.get('/list/projects', (_req, res) => {
    res.json(guard(() => skillMgr.listAllProjectSkills()));
  });

  /** 更新 skill 元数据 */
  router.put('/meta/:id', (req, res) => {
    res.json(guard(() => skillMgr.updateMeta({ skillId: req.params.id, ...req.body })));
  });

  /** 读取 skill 的 SKILL.md */
  router.get('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.getReadme({ skillId: req.params.id })));
  });

  /** 保存 skill 的 SKILL.md */
  router.put('/readme/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveReadme({ skillId: req.params.id, ...req.body })));
  });

  /** GET /api/skill/current-project — 返回当前项目工作目录 */
  router.get('/current-project', (_req, res) => {
    res.json(guard(() => skillMgr.getCurrentProject()));
  });
}

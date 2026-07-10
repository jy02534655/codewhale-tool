/**
 * @codewhale/server — Skill 文件浏览路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerFilesRoutes(router, skillMgr) {
  /** POST /api/skill/files/:id — 获取 skill 目录下所有文件列表 */
  router.post('/files/:id', (req, res) => {
    res.json(guard(() => skillMgr.getSkillFiles({ skillId: req.params.id, ...req.body })));
  });

  /** POST /api/skill/file/:id — 读取 skill 目录下的指定文件，path=相对路径 */
  router.post('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.readSkillFile({ skillId: req.params.id, ...req.body })));
  });

  /** PUT /api/skill/file/:id — 保存 skill 目录下的指定文件（body: { path, content }） */
  router.put('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveSkillFile({ skillId: req.params.id, ...req.body })));
  });

  /** DELETE /api/skill/file/:id — 删除 skill 目录下的指定文件（body: { path }） */
  router.delete('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.removeSkillFile({ skillId: req.params.id, ...req.body })));
  });
}

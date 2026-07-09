/**
 * @codewhale/server — Skill 文件浏览路由
 *
 * 挂载路径: /api/skill
 */

import { guard } from '../../utils/guard.js';

export function registerFilesRoutes(router, skillMgr) {
  /** GET /api/skill/files/:id — 获取 skill 目录下所有文件列表 */
  router.get('/files/:id', (req, res) => {
    res.json(guard(() => skillMgr.getSkillFiles(req.params.id, req.query.level, req.query.projectId)));
  });

  /** GET /api/skill/file/:id — 读取 skill 目录下的指定文件，path=相对路径 */
  router.get('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.readSkillFile(req.params.id, req.query.path, req.query.level, req.query.projectId)));
  });

  /** PUT /api/skill/file/:id — 保存 skill 目录下的指定文件（body: { path, content }） */
  router.put('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.saveSkillFile(req.params.id, req.body.path, req.body.content, req.body.level, req.body.projectId)));
  });

  /** DELETE /api/skill/file/:id — 删除 skill 目录下的指定文件（body: { path }） */
  router.delete('/file/:id', (req, res) => {
    res.json(guard(() => skillMgr.removeSkillFile(req.params.id, req.body.path, req.body.level, req.body.projectId)));
  });
}

/**
 * routes/project.js — 项目管理 CRUD REST API
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';

/**
 * @param {import('@codewhale/core').ProjectManager} projectMgr
 * @returns {import('express').Router}
 */
export function createProjectRouter(projectMgr) {
  const router = Router();

  // 列出所有项目
  router.get('/list', (req, res) => {
    res.json(guard(() => projectMgr.list()));
  });

  // 新增项目
  router.post('/add', (req, res) => {
    res.json(guard(() => projectMgr.add(req.body)));
  });

  // 更新项目
  router.put('/edit', (req, res) => {
    res.json(guard(() => projectMgr.update(req.body.id, req.body)));
  });

  // 删除项目
  router.delete('/remove', (req, res) => {
    res.json(guard(() => projectMgr.remove(req.body.id)));
  });

  // 设为默认项目
  router.put('/default', (req, res) => {
    res.json(guard(() => projectMgr.setDefault(req.body.id)));
  });

  return router;
}

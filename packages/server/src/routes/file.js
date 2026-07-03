/**
 * routes/file.js — 文件浏览与读取 REST API
 *
 * Server 层仅做参数透传，不做业务校验。
 * 核心校验与错误码统一由 FileManager 返回，guard 负责捕获异常并包装为标准响应。
 */

import { Router } from 'express';
import { guard } from '../utils/guard.js';

/**
 * @param {import('@codewhale/core').FileManager} fileMgr
 * @returns {import('express').Router}
 */
export function createFileRouter(fileMgr) {
  const router = Router();

  // 列出目录内容
  router.post('/list', (req, res) => {
    const { path, accept, directory } = req.body;
    res.json(guard(() => fileMgr.list(path || process.cwd(), accept, directory)));
  });

  // 读取文件内容
  router.get('/read', (req, res) => {
    res.json(guard(() => fileMgr.read(req.query.path)));
  });

  // 获取可用盘符列表
  router.get('/drives', (req, res) => {
    res.json(guard(() => fileMgr.drives()));
  });

  return router;
}
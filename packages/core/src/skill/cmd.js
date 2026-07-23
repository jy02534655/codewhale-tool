/**
 * Skill 命令模块
 * 提供 update / remove / copyToProject 等变更操作
 */



import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { okMsg, failMsg, fail } from '../utils/result.js';
import { writeSkillLog } from '../download/index.js';
import { clearObject } from '../utils/index.js';

/**
 * 批量更新 skill 元数据
 * 可更新字段：name / description / alias / remark / tags
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {Object} opts.meta - 要更新的元数据字段
 * @param {string} [opts.hintLevel] - 提示的级别
 * @param {string} [opts.projectId] - 项目 ID
 */
export function updateMeta(store, { skillId, level, projectId, ...meta }) {
  return store.mutate(skillId, function (entries, idx) {
    // 只更新传入的非空字段，未传入字段保持不变
    Object.assign(entries[idx], clearObject(meta));
    // 更新修改时间
    entries[idx].updated_at = Date.now();
    return okMsg('updated');
  }, level, projectId);
}

/**
 * 彻底删除 skill（移除配置 + 删除文件）
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} [opts.hintLevel] - 提示的级别
 * @param {string} [opts.projectId] - 项目 ID
 */
export function remove(store, { skillId, level, projectId }) {
  // 手动安装在项目/全局目录但未注册到 store 的 skill（local- 前缀）
  if (String(skillId).startsWith('local-')) {
    const entry = store.findEntry(skillId, level, projectId);
    if (!entry || !entry.path) return failMsg('skillNotFound');
    try {
      // 删除 skill 目录
      if (existsSync(entry.path)) {
        rmSync(entry.path, { recursive: true, force: true });
      }
    } catch {
      // 目录删除失败不阻断流程，只记录警告
    }
    return okMsg('synced');
  }

  // 已注册到 store 的 skill：先删除文件，再从配置中移除
  return store.mutate(skillId, function (entries, idx, entry) {
    try {
      // 删除 skill 目录
      if (existsSync(entry.path)) {
        rmSync(entry.path, { recursive: true, force: true });
      }
    } catch {
      // 文件删除失败不阻塞配置移除操作
    }
    // 从已安装列表中移除该 skill
    entries.splice(idx, 1);
    return okMsg('synced');
  }, level, projectId);
}

/**
 * 将全局 skill 复制到当前项目
 * 复制内容包括 skill 目录文件和 store 配置
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - 全局 skill 的 ID
 * @param {string} [opts.projectId] - 目标项目 ID
 */
export function copyToProject(store, { skillId, projectId }) {
  // 必须在全局已安装列表中找到该 skill
  const entry = store.getGlobalInstalled().find(function (s) { return s.id === skillId; });
  if (!entry) return failMsg('skillNotFound');

  const targetProjectId = projectId || store.getCurrentProjectId();
  if (!targetProjectId) return failMsg('projectNotFound');

  const projectInstalled = store.getProjectInstalled(targetProjectId);
  // 检查项目是否已安装同名 skill
  if (projectInstalled.some(function (s) { return s.slug === entry.slug; })) {
    return failMsg('skillAlreadyInstalled');
  }

  const newId = randomUUID();
  // 目标目录：当前工作目录 / skills / skill-slug
  const targetDir = join(process.cwd(), store.projectSkillsDir, entry.slug);

  try {
    // 如果目标目录已存在，先删除
    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    // 递归复制全局 skill 目录到项目目录
    store.copyDir(entry.path, targetDir);

    // 在项目级配置中注册新 skill
    store.addToConfig({
      id: newId,
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      alias: entry.alias || '',
      remark: entry.remark || '',
      tags: entry.tags || [],
      path: targetDir,
      enabled: true,
      source: entry.source || 'community',
      version: entry.version || 'latest',
      installed_at: Date.now(),
      updated_at: Date.now(),
    }, 'project', targetProjectId);

    return okMsg('synced');
  } catch (err) {
    // 复制失败，清理可能已创建的目标目录
    try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    const failMessage = getServerMessage('skillInstallFailed') + ': ' + err.message;
    writeSkillLog('ERROR', 'skillInstallFailed', { message: failMessage }, { error: err.stack });
    return fail(failMessage);
  }
}

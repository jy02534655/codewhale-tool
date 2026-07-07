/**
 * Skill 命令模块
 * 提供 enable / disable / update / remove / copyToProject 等变更操作
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { okMsg, failMsg, fail } from '../utils/result.js';

/**
 * 启用 skill
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function enable(store, skillId, hintLevel) {
  return store.toggle(skillId, true, hintLevel);
}

/**
 * 禁用 skill
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function disable(store, skillId, hintLevel) {
  return store.toggle(skillId, false, hintLevel);
}

/**
 * 批量更新 skill 元数据
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {Object} meta
 * @param {string} [hintLevel]
 */
export function updateMeta(store, skillId, meta, hintLevel) {
  return store.mutate(skillId, function (entries, idx) {
    if (meta.name != null) entries[idx].name = meta.name;
    if (meta.description != null) entries[idx].description = meta.description;
    if (meta.alias != null) entries[idx].alias = meta.alias;
    if (meta.remark != null) entries[idx].remark = meta.remark;
    if (meta.tags != null) entries[idx].tags = meta.tags;
    entries[idx].updated_at = Date.now();
    return okMsg('updated');
  }, hintLevel);
}

/**
 * 彻底删除 skill（移除配置 + 删除文件）
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function remove(store, skillId, hintLevel) {
  return store.mutate(skillId, function (entries, idx, entry) {
    try {
      if (existsSync(entry.path)) {
        rmSync(entry.path, { recursive: true, force: true });
      }
    } catch {
      // 文件删除失败不阻塞配置移除操作
    }
    entries.splice(idx, 1);
    return okMsg('synced');
  }, hintLevel);
}

/**
 * 将全局 skill 复制到当前项目
 * @param {SkillStore} store
 * @param {string} skillId
 */
export function copyToProject(store, skillId) {
  const entry = store.getGlobalInstalled().find(function (s) { return s.id === skillId; });
  if (!entry) return failMsg('SKILL_NOT_FOUND');

  const projectInstalled = store.getProjectInstalled();
  if (projectInstalled.some(function (s) { return s.id === skillId; })) {
    return failMsg('SKILL_ALREADY_INSTALLED');
  }

  const newId = randomUUID();
  const targetDir = join(process.cwd(), store.projectSkillsDir, entry.slug);

  try {
    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    store.copyDir(entry.path, targetDir);

    store.addToConfig({
      id: newId,
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      path: targetDir,
      enabled: true,
      source: entry.source || 'community',
      version: entry.version || 'latest',
      installed_at: Date.now(),
      updated_at: Date.now(),
    }, 'project');

    return okMsg('synced');
  } catch (err) {
    try { if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true }); } catch { /* ignore */ }
    return fail(getServerMessage('SKILL_INSTALL_FAILED') + ': ' + err.message);
  }
}
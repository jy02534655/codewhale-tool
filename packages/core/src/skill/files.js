/**
 * Skill 文件浏览模块
 * 提供 skill 目录文件列表、读写、删除等操作
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ok, fail, failMsg, okMsg } from '../utils/result.js';

/**
 * 获取 skill 文件列表
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} [level]
 * @param {string} [projectId]
 */
export function getSkillFiles(store, skillId, level, projectId) {
  const entry = store.findEntry(skillId, level, projectId);
  if (!entry) return failMsg('SKILL_NOT_FOUND');

  const files = [];
  const _walk = function (dir, prefix) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const e of items) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      if (e.isDirectory()) {
        _walk(join(dir, e.name), prefix ? prefix + '/' + e.name : e.name);
      } else {
        files.push(prefix ? prefix + '/' + e.name : e.name);
      }
    }
  };

  _walk(entry.path, '');
  return ok(files.sort());
}

/**
 * 读取 skill 文件内容
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} filePath
 * @param {string} [level]
 * @param {string} [projectId]
 */
export function readSkillFile(store, skillId, filePath, level, projectId) {
  const entry = store.findEntry(skillId, level, projectId);
  if (!entry) return failMsg('SKILL_NOT_FOUND');
  const fullPath = join(entry.path, filePath);
  if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');

  try {
    const content = readFileSync(fullPath, 'utf-8');
    return ok(content);
  } catch (err) {
    return fail('Failed to read file: ' + err.message);
  }
}

/**
 * 保存 skill 文件内容
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} filePath
 * @param {string} content
 * @param {string} [level]
 * @param {string} [projectId]
 */
export function saveSkillFile(store, skillId, filePath, content, level, projectId) {
  return store.mutate(skillId, function (entries, idx) {
    const entry = entries[idx];
    const fullPath = join(entry.path, filePath);
    if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');
    writeFileSync(fullPath, content, 'utf-8');
    entry.updated_at = Date.now();
    return okMsg('updated');
  }, level, projectId);
}

/**
 * 删除 skill 文件
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} filePath
 * @param {string} [level]
 * @param {string} [projectId]
 */
export function removeSkillFile(store, skillId, filePath, level, projectId) {
  return store.mutate(skillId, function (entries, idx) {
    const entry = entries[idx];
    const fullPath = join(entry.path, filePath);
    if (!existsSync(fullPath)) return failMsg('SKILL_FILE_NOT_FOUND');
    unlinkSync(fullPath);
    entry.updated_at = Date.now();
    return okMsg('updated');
  }, level, projectId);
}

/**
 * 读取 SKILL.md 内容
 * @param {SkillStore} store
 * @param {string} skillId
 */
export function getReadme(store, skillId) {
  const result = readSkillFile(store, skillId, 'SKILL.md');
  return result.success ? ok(result.data) : ok('');
}

/**
 * 保存 SKILL.md 内容
 * @param {SkillStore} store
 * @param {string} skillId
 * @param {string} content
 */
export function saveReadme(store, skillId, content) {
  return saveSkillFile(store, skillId, 'SKILL.md', content);
}
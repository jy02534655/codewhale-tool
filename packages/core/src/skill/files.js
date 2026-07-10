/**
 * Skill 文件浏览模块
 * 提供 skill 目录文件列表、读写、删除等操作
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ok, fail, failMsg, okMsg } from '../utils/result.js';

/**
 * 获取 skill 文件列表
 * 递归遍历 skill 目录，返回所有非隐藏、非 node_modules 的文件路径
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} [opts.level] - 'global' 或 'project'
 * @param {string} [opts.projectId] - 项目 ID
 */
export function getSkillFiles(store, { skillId, level, projectId }) {
  const entry = store.findEntry(skillId, level, projectId);
  if (!entry) return failMsg('skillNotFound');

  const files = [];
  // 递归遍历 skill 目录
  const _walk = function (dir, prefix) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const e of items) {
      // 跳过隐藏文件和 node_modules 目录
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      if (e.isDirectory()) {
        // 递归进入子目录，拼接相对路径前缀
        _walk(join(dir, e.name), prefix ? prefix + '/' + e.name : e.name);
      } else {
        // 收集文件相对路径
        files.push(prefix ? prefix + '/' + e.name : e.name);
      }
    }
  };

  _walk(entry.path, '');
  // 返回排序后的文件列表
  return ok(files.sort());
}

/**
 * 读取 skill 文件内容
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} opts.filePath - 文件相对路径
 * @param {string} [opts.level] - 'global' 或 'project'
 * @param {string} [opts.projectId] - 项目 ID
 */
export function readSkillFile(store, { skillId, path: filePath, level, projectId }) {
  const entry = store.findEntry(skillId, level, projectId);
  if (!entry) return failMsg('skillNotFound');
  // 拼接 skill 目录和相对文件路径
  const fullPath = join(entry.path, filePath);
  if (!existsSync(fullPath)) return failMsg('skillFileNotFound');

  try {
    const content = readFileSync(fullPath, 'utf-8');
    return ok(content);
  } catch (err) {
    return fail('Failed to read file: ' + err.message);
  }
}

/**
 * 保存 skill 文件内容
 * 直接覆写文件，并更新 skill 的 updated_at 时间戳
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} opts.filePath - 文件相对路径
 * @param {string} opts.content - 要写入的文件内容
 * @param {string} [opts.level] - 'global' 或 'project'
 * @param {string} [opts.projectId] - 项目 ID
 */
export function saveSkillFile(store, { skillId, path: filePath, content, level, projectId }) {
  return store.mutate(skillId, function (entries, idx, entry) {
    const fullPath = join(entry.path, filePath);
    // 文件不存在时拒绝保存，避免意外创建新文件
    if (!existsSync(fullPath)) return failMsg('skillFileNotFound');
    // 覆写文件内容
    writeFileSync(fullPath, content, 'utf-8');
    // 更新修改时间
    entry.updated_at = Date.now();
    return okMsg('updated');
  }, level, projectId);
}

/**
 * 删除 skill 文件
 * 删除文件后更新 skill 的 updated_at 时间戳
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} opts.filePath - 文件相对路径
 * @param {string} [opts.level] - 'global' 或 'project'
 * @param {string} [opts.projectId] - 项目 ID
 */
export function removeSkillFile(store, { skillId, path: filePath, level, projectId }) {
  return store.mutate(skillId, function (entries, idx, entry) {
    const fullPath = join(entry.path, filePath);
    if (!existsSync(fullPath)) return failMsg('skillFileNotFound');
    unlinkSync(fullPath);
    entry.updated_at = Date.now();
    return okMsg('updated');
  }, level, projectId);
}

/**
 * 读取 SKILL.md 内容
 * 如果读取失败，返回空字符串而不是错误，保证前端总能得到可显示的内容
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 */
export function getReadme(store, { skillId }) {
  const result = readSkillFile(store, { skillId, path: 'SKILL.md' });
  return result.success ? ok(result.data) : ok('');
}

/**
 * 保存 SKILL.md 内容
 * 本质是保存 skill 根目录下的 SKILL.md 文件
 * @param {SkillStore} store - 数据存储层
 * @param {Object} opts - 操作选项
 * @param {string} opts.skillId - skill 唯一标识
 * @param {string} opts.content - SKILL.md 文件内容
 */
export function saveReadme(store, { skillId, content }) {
  return saveSkillFile(store, { skillId, path: 'SKILL.md', content });
}

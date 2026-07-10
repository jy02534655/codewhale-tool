/**
 * Skill 路由查询模块
 * 提供列表、项目信息等只读查询能力
 */

import { ok } from '../utils/result.js';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { _extractMeta } from './shared.js';

/**
 * 扫描项目目录下手动安装的 skill（不写入 store，仅用于列表补充）
 * 这类 skill 是用户直接放到项目目录的 skills/ 文件夹里的，没有经过安装流程注册
 * @param {SkillStore} store - 数据存储层
 * @param {string} projectPath - 项目根目录路径
 * @param {string} projectId - 项目 ID
 * @returns {Object[]} 扫描到的本地 skill 条目数组
 */
function _scanProjectSkills(store, projectPath, projectId) {
  const skillsDir = join(projectPath, store.projectSkillsDir);
  if (!existsSync(skillsDir)) return [];
  const entries = [];
  let names;
  try {
    names = readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    // 目录读取失败，返回空数组
    return [];
  }
  for (const dirent of names) {
    // 只处理子目录
    if (!dirent.isDirectory()) continue;
    const skillPath = join(skillsDir, dirent.name);
    // 只有包含 SKILL.md 的目录才被认为是 skill
    if (!existsSync(join(skillPath, 'SKILL.md'))) continue;
    const meta = _extractMeta(skillPath);
    entries.push({
      // local- 前缀 + 项目 ID + 目录名，作为唯一标识
      id: 'local-' + projectId + '-' + dirent.name,
      slug: dirent.name,
      name: meta.name,
      description: meta.description,
      path: skillPath,
      enabled: true,
      source: 'local',
      installed_at: Date.now(),
      updated_at: Date.now(),
    });
  }
  return entries;
}

/**
 * 获取全局已安装 skill 列表
 * @param {SkillStore} store - 数据存储层
 * @returns {Object} 包含全局已安装 skill 列表的结果对象
 */
export function listGlobal(store) {
  return ok(store.getGlobalInstalled());
}

/**
 * 获取所有项目的 skill 列表，并在每个 skill 上补充 project 字段
 * 同时合并项目目录下手动安装的 skill（source: 'local'）
 * @param {SkillStore} store - 数据存储层
 * @returns {Object} 包含所有项目 skill 列表的结果对象
 */
export function listAllProjectSkills(store) {
  const projectManager = store.engine.projectManager;
  const projects = projectManager ? projectManager.list().data : [];
  const result = [];
  projects.forEach(function (p) {
    // 获取该项目已注册的 skill
    const registered = store.getProjectInstalled(p.id) || [];
    // 扫描项目目录下手动安装的 skill
    const scanned = _scanProjectSkills(store, p.path, p.id);
    // 构建已注册 skill 的 slug 集合，用于去重
    const registeredSlugs = new Set(registered.map(function (s) { return s.slug; }));
    const merged = registered.slice();
    // 将手动安装的 skill 加入列表（如果未被注册覆盖）
    scanned.forEach(function (s) {
      if (!registeredSlugs.has(s.slug)) {
        merged.push(s);
      }
    });
    // 为每个 skill 补充项目信息
    merged.forEach(function (s) {
      result.push(Object.assign({}, s, { project: p.alias || p.path || p.id, projectId: p.id }));
    });
  });
  return ok(result);
}

/**
 * 获取当前项目信息
 * 包含项目名称、路径和已安装 skill 列表
 * @param {SkillStore} store - 数据存储层
 * @returns {Object} 包含当前项目信息的结果对象
 */
export function getCurrentProject(store) {
  const projectManager = store.engine.projectManager;
  let project = null;
  if (projectManager) {
    const projectResult = projectManager.list();
    const projects = projectResult.success ? projectResult.data : [];
    // 优先取默认项目，否则取第一个项目
    project = projects.find(function (p) { return p.default; }) || projects[0];
  }

  const path = project ? project.path : process.cwd();
  const registered = project ? (store.getProjectInstalled(project.id) || []) : [];
  // 扫描当前项目目录下手动安装的 skill
  const scanned = _scanProjectSkills(store, path, project ? project.id : undefined);
  const registeredSlugs = new Set(registered.map(function (s) { return s.slug; }));
  const merged = registered.slice();
  scanned.forEach(function (s) {
    if (!registeredSlugs.has(s.slug)) {
      merged.push(s);
    }
  });

  return ok({
    name: project?.alias || 'codewhale-tool',
    path: path,
    installed: merged,
  });
}

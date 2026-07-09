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
 * @param {SkillStore} store
 * @param {string} projectPath
 * @returns {Object[]}
 */
function _scanProjectSkills(store, projectPath, projectId) {
  const skillsDir = join(projectPath, store.projectSkillsDir);
  if (!existsSync(skillsDir)) return [];
  const entries = [];
  let names;
  try {
    names = readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const dirent of names) {
    if (!dirent.isDirectory()) continue;
    const skillPath = join(skillsDir, dirent.name);
    if (!existsSync(join(skillPath, 'SKILL.md'))) continue;
    const meta = _extractMeta(skillPath);
    entries.push({
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
 * @param {SkillStore} store
 */
export function listGlobal(store) {
  return ok(store.getGlobalInstalled());
}

/**
 * 获取所有项目的 skill 列表，并在每个 skill 上补充 project 字段
 * 同时合并项目目录下手动安装的 skill（source: 'local'）
 * @param {SkillStore} store
 */
export function listAllProjectSkills(store) {
  const projectManager = store.engine.projectManager;
  const projects = projectManager ? projectManager.list().data : [];
  const result = [];
  projects.forEach(function (p) {
    const registered = store.getProjectInstalled(p.id) || [];
    const scanned = _scanProjectSkills(store, p.path, p.id);
    const registeredSlugs = new Set(registered.map(function (s) { return s.slug; }));
    const merged = registered.slice();
    scanned.forEach(function (s) {
      if (!registeredSlugs.has(s.slug)) {
        merged.push(s);
      }
    });
    merged.forEach(function (s) {
      result.push(Object.assign({}, s, { project: p.alias || p.path || p.id, projectId: p.id }));
    });
  });
  return ok(result);
}

/**
 * 获取当前项目信息
 * @param {SkillStore} store
 */
export function getCurrentProject(store) {
  const projectManager = store.engine.projectManager;
  let project = null;
  if (projectManager) {
    const projectResult = projectManager.list();
    const projects = projectResult.success ? projectResult.data : [];
    project = projects.find(function (p) { return p.default; }) || projects[0];
  }

  const path = project ? project.path : process.cwd();
  const registered = project ? (store.getProjectInstalled(project.id) || []) : [];
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
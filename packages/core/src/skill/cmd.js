/**
 * Skill 命令模块
 * 提供 enable / disable / update / remove / copyToProject 等变更操作
 */

import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { getServerMessage } from '../utils/i18n.js';
import { okMsg, failMsg, fail } from '../utils/result.js';

/**
 * 启用 skill
 * @param {SkillManager} self
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function enable(self, skillId, hintLevel) {
  return self._toggle(skillId, true, hintLevel);
}

/**
 * 禁用 skill
 * @param {SkillManager} self
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function disable(self, skillId, hintLevel) {
  return self._toggle(skillId, false, hintLevel);
}

  /**
   * 批量更新 skill 元数据
   * @param {SkillManager} self
   * @param {string} skillId
   * @param {Object} meta
   * @param {string} [hintLevel]
   */
  export function updateMeta(self, skillId, meta, hintLevel) {
    return self._mutate(skillId, function (entries, idx) {
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
 * @param {SkillManager} self
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export function remove(self, skillId, hintLevel) {
  return self._mutate(skillId, function (entries, idx, entry) {
    try {
      if (existsSync(entry.path)) {
        rmSync(entry.path, { recursive: true, force: true });
      }
    } catch {
      // 文件删除失败不阻塞配置移除操作
    }
    entries.splice(idx, 1);
    self._setLevelInstalled(hintLevel, entries);
    return okMsg('synced');
  }, hintLevel);
}

/**
 * 更新 skill（从 GitHub 重新拉取）
 * @param {SkillManager} self
 * @param {string} skillId
 * @param {string} [hintLevel]
 */
export async function update(self, skillId, hintLevel) {
  const entry = hintLevel
    ? self._getLevelInstalled(hintLevel).find(function (s) { return s.id === skillId; })
    : self._getGlobalInstalled().find(function (s) { return s.id === skillId; });

  if (!entry) return failMsg('SKILL_NOT_FOUND');
  if (entry.source !== 'community') return failMsg('SKILL_NOT_UPDATABLE');

  try {
    const repoUrl = 'https://github.com/deepseek-ai/codewhale-skills';
    const skillPath = skillId;
    const tmpDir = join(tmpdir(), 'skill-update-' + randomUUID());

    const cloneCmd = [
      'git', 'clone', '--depth', '1', '--filter=blob:none', '--sparse', '--no-checkout',
      repoUrl, tmpDir,
    ].join(' ');
    execSync(cloneCmd, { stdio: 'pipe', timeout: 120000 });
    execSync('git -C "' + tmpDir + '" sparse-checkout set "' + skillPath + '"', { stdio: 'pipe', timeout: 60000 });
    execSync('git -C "' + tmpDir + '" checkout', { stdio: 'pipe', timeout: 60000 });

    const sourceDir = join(tmpDir, ...skillId.split('/'));
    const targetDir = entry.path;
    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    self._copyDir(sourceDir, targetDir);

    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

    self._mutate(skillId, function (entries, idx) {
      entries[idx].updated_at = Date.now();
      return okMsg('updated');
    }, hintLevel);
    return okMsg('updated');
  } catch (err) {
    return fail(getServerMessage('update_failed') + ': ' + err.message);
  }
}

/**
 * 将全局 skill 复制到当前项目
 * @param {SkillManager} self
 * @param {string} skillId
 */
export function copyToProject(self, skillId) {
  const entry = self._getGlobalInstalled().find(function (s) { return s.id === skillId; });
  if (!entry) return failMsg('SKILL_NOT_FOUND');

  const projectInstalled = self._getProjectInstalled();
  if (projectInstalled.some(function (s) { return s.id === skillId; })) {
    return failMsg('SKILL_ALREADY_INSTALLED');
  }

  const targetDir = join(process.cwd(), self._projectSkillsDir, skillId);

  try {
    if (existsSync(targetDir)) rmSync(targetDir, { recursive: true, force: true });
    self._copyDir(entry.path, targetDir);

    self._addToConfig({
      id: skillId,
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

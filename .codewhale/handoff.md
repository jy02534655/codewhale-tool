# Handoff — project 级 skill 安装路径修复

> 最后更新: 2026-07-07
> 状态: **进行中**

## 目标
修复 project 级 skill 安装/更新时，总是安装到 `process.cwd()/skills/` 而不是用户选择的项目路径下的问题。

## 根因
- 前端安装 skill 时传递了 `projectPath`（用户选择的项目路径）
- 后端 `_installFromGitHubV2`、`installFromZip`、`update` 在 `level === 'project'` 时仍使用 `process.cwd()` 作为基础目录
- 导致 skill 文件被安装到错误位置，且 `store.json.project_skills` 中记录的 `path` 也是错的

## 实现方案

### 传输字段
- 前端安装/更新 skill 时，`req.body` 中同时传 `projectId` 和 `projectPath`
- 后端优先使用 `projectId`；若前端未传 `projectId`，则退回用 `projectPath` 反查 project id

### 1. SkillStore (`packages/core/src/skill/SkillStore.js`)
- 已新增 `getProjectIdByPath(projectPath)` — 根据路径匹配 project id，供 install 阶段兜底查找 projectId

### 2. install.js (`packages/core/src/skill/install.js`)
- 新增 `_getProjectBaseDir(level, projectPath)` — `level === 'project'` 时返回 `projectPath`，否则返回 `process.cwd()`
- 新增 `_resolveProjectId(level, projectId, projectPath)` — 优先返回 `projectId`，否则退回 `store.getProjectIdByPath(projectPath)`
- 修改 `_finalizeInstall` — 增加 `projectId` 参数，`store.addToConfig` / `store.mutate` 透传 `projectId`
- 修改 `_installFromGitHubV2` — `finalTargetDir` 在 project 级别时走 `_getProjectBaseDir`；`projectId` 走 `_resolveProjectId`
- 修改 `installFromZip` — 从 `_internal._rawOpts.projectPath` 读取 projectPath；`finalTargetDir` 同理修正；`projectId` 走 `_resolveProjectId`
- 修改 `update` — `baseTargetDir` 在 project 级别时走 `_getProjectBaseDir`；`projectId` 走 `_resolveProjectId`；`store.mutate` 透传 `projectId`

## 待修改文件
- `packages/core/src/skill/SkillStore.js` — `getProjectIdByPath(projectPath)` 已完成
- `packages/core/src/skill/install.js` — 上述 install.js 修改点待执行

## 预期结果
- project 级 skill 安装到 `<projectPath>/skills/<slug>/`
- `store.json.project_skills[projectId].installed[].path` 记录正确路径
- global 级 skill 行为不变，仍安装到 `process.cwd()/skills/<slug>/`

## 验证计划
- `npm run lint` 通过
- 后端代码 review：确认 `process.cwd()` 只在 global 级别使用
- 前端代码 review：确认安装/更新时 `projectId` 和 `projectPath` 已一起传递到后端

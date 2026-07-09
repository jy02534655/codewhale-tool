# Handoff — project 级 skill 安装路径修复

> 最后更新: 2026-07-08
> 状态: **已完成**

## 目标
修复 project 级 skill 安装/更新时，总是安装到 `process.cwd()/skills/`（即 codewhale-tool 目录下）而不是用户选择的项目路径下的问题。

## 已完成的修改

### 前端 (`packages/web/src/views/skill/edit/install.vue`)
- `formData` 已包含 `projectId: ''` 和 `projectPath: ''`
- project 下拉框 value 已改为 `p.id`
- `_initDropdowns` 已设置 `formData.projectId = defaultProject.id` 和 `formData.projectPath = defaultProject.path`
- `onLevelChange` 已设置 `formData.projectId = projectList.value[0].id`
- `showDialogByData` 初始化已恢复 `formData.projectId = params.projectId || ''`

### 后端 (`packages/core/src/skill/install.js`)
- 新增 `_getProjectBaseDir(level, projectPath)` 辅助函数
- 新增 `_resolveProjectId(level, projectId, projectPath, store)` 辅助函数
- `_finalizeInstall` 已支持 `projectId` 参数
- `_installFromGitHubV2`：
  - `finalTargetDir` 使用 `_getProjectBaseDir` 替代硬编码
  - 增加 `projectId` 解析并透传给 `_finalizeInstall`
- `installFromZip`：
  - 从 `_internal._rawOpts.projectPath` 读取 `projectPath`
  - `finalTargetDir` 使用 `_getProjectBaseDir` 替代硬编码
  - 增加 `projectId` 解析并透传给 `_finalizeInstall`
- `update`：
  - `baseTargetDir` 使用 `_getProjectBaseDir` 替代硬编码
  - 增加 `projectId` 解析
  - 第二个 `store.mutate` 调用已传入 `projectId`

## 验证结果
- `npm run lint` 通过
- 后端代码 review：`process.cwd()` 仅在 global 级别使用
- 前端代码 review：安装/更新时 `projectId` 和 `projectPath` 已一起传递到后端

## 预期行为
- project 级 skill 安装到 `<projectPath>/skills/<slug>/`
- `store.json.project_skills[projectId].installed[].path` 记录正确路径
- global 级 skill 行为不变，仍安装到 `process.cwd()/skills/<slug>/`

---

# Handoff — project 级 skill 列表展示与旧接口清理

> 最后更新: 2026-07-08
> 状态: **已完成**

## 目标
修复 skill 管理页面切换到"项目" tab 时只展示默认项目 skill 的问题，并清理已废弃的单项目 skill 查询接口。

## 已完成的修改

### 后端 (`packages/core/src/skill/routes.js`)
- 新增 `listAllProjectSkills(store)`：遍历所有项目，汇总 skill 并补充 `project` 字段
- 删除 `listProject(store)`：旧单项目 skill 查询接口已无调用方

### 后端 (`packages/core/src/skill/index.js`)
- 新增 `listAllProjectSkills()` 门面方法
- 删除 `listProject()` 门面方法

### 后端 (`packages/server/src/routes/skill/routes.js`)
- 新增 `GET /skill/list/projects`：返回所有项目的 skill 列表
- 删除 `GET /skill/list/project`：旧单项目接口已废弃

### 前端 (`packages/web/src/api/skill/routes.js`)
- 新增 `getAllProjectSkillList()` 调用 `/skill/list/projects`
- 删除 `getProjectSkillList()`：旧单项目 skill 查询 API 已无调用方

### 前端 (`packages/web/src/views/skill/index.vue`)
- `loadSkills()` 改用 `getAllProjectSkillList()`，project tab 现在展示所有项目的 skill
- `projectTree` 按 `s.project` 字段正确分组

## 验证结果
- `npm run lint` 通过
- 全局搜索确认旧接口无其他调用方

## 预期行为
- 左侧 skill 列表切换到"项目" tab 时，展示所有项目的 skill
- 每个项目下的 skill 按项目分组显示
- global tab 行为不变

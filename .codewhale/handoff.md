# Handoff — 项目 skill 列表合并手动安装的 skill，支持删除，并移除禁用功能

> 最后更新: 2026-07-09
> 状态: **已完成**

## 目标
修复手动在项目下安装 skill 后，项目选项卡不显示这些 skill 的问题。让项目 skill 列表像全局 discover 逻辑一样，自动合并目录中手动安装的 skill。
同时修复：对 `local-*` skill 执行删除时返回 `SKILL_NOT_FOUND` 的问题。
并移除：整个 skill 启用/禁用功能，因为它只改前端状态标记，无法在 CodeWhale 运行时层面真正生效。

## 根因分析
`packages/core/src/skill/routes.js` 中的 `listAllProjectSkills` 和 `getCurrentProject` 只从 store（`store.json`）读取已注册的 project skills。如果用户手动将 skill 文件夹复制到项目目录的 `skills/` 下，这些 skill 不会被扫描和显示。

删除侧根因：`packages/core/src/skill/cmd.js` 的 `remove()` 调用 `store.mutate(skillId, ...)`，而 `SkillStore.mutate()` 只在全局/项目已安装列表里按 `id` 查找。`local-*` 这类手动安装 skill 未写入 store，因此直接返回 `failMsg('SKILL_NOT_FOUND')`。

禁用功能评估：`enable/disable` 只修改 store 中的 `enabled` 字段，但 CodeWhale 实际运行时并不在这个仓库内，不会消费该字段。因此禁用只是 UI 假开关，不如直接删除。

## ID 格式演进
初始方案使用 `local-<slug>` 作为手动安装 skill 的 id。后发现存在跨项目同名冲突风险，且前端多个操作（文件树、readme 编辑、启用/禁用、删除）依赖 skill id 的稳定性，不适合使用随机 UUID。

最终采用 `local-<projectId>-<slug>` 格式：
- **确定性**：同一 skill 每次扫描得到相同 id，前端状态稳定
- **唯一性**：`projectId` 是 UUID，跨项目同名 skill 不会冲突

## 修复与清理方案
### 查询侧（routes.js）
在 `routes.js` 中新增 `_scanProjectSkills` 辅助函数，在返回列表时动态扫描项目目录，将 store 中已注册的 skill 与手动安装的 skill（`source: 'local'`）合并，避免重复 slug。

id 格式：`local-<projectId>-<slug>`。

### 删除侧（cmd.js）
在 `Cmd.remove` 中增加对 `local-*` skillId 的特殊处理：
- 复用 `store.findEntry(skillId, hintLevel, projectId)` 识别本地 skill（store 已有 `_resolveLocalEntry` 能力）
- 如果识别为本地 skill：直接删除 `entry.path` 目录，返回 `okMsg('synced')`，不修改 store 配置
- 如果不是本地 skill：保持原有 `store.mutate` 逻辑不变

### Store 层适配（SkillStore.js）
- `_resolveLocalEntry` 适配新 id 格式：
  - 全局级：保持 `local-<slug>`（目录名即 slug）
  - 项目级：解析 `local-<projectId>-<slug>`，提取出真实 `slug` 用于路径拼接
- `findEntry` 在 `level` 未指定时，依次尝试全局和项目级本地 skill fallback，避免前端未传 level 时找不到本地 skill

### 移除禁用功能
因禁用功能无法在 CodeWhale 运行时层面真正生效，决定彻底移除：
- 删除 `Cmd.enable/disable`
- 删除 `SkillStore.toggle`
- 删除 `SkillManager.enable/disable`
- 删除服务端 `/api/skill/enable/:id` 和 `/api/skill/disable/:id` 路由
- 删除前端 `enableSkill/disableSkill` API
- 删除前端详情页启用/禁用按钮及 `toggleSkillEnabled` 逻辑
- 删除前端列表页 `enabled` 状态标签
- 删除 4 个语言包中的 `enable/disable` 翻译

## 已修改的文件
- `packages/core/src/skill/routes.js`：
  - 新增 `_scanProjectSkills(store, projectPath, projectId)` 函数，id 格式改为 `local-<projectId>-<slug>`
  - 修改 `listAllProjectSkills` 合并手动安装的 skill
  - 修改 `getCurrentProject` 返回的 `installed` 也包含手动安装的 skill
- `packages/core/src/skill/cmd.js`：
  - 修改 `remove` 函数，对 `local-*` skillId 走目录删除分支
  - 删除 `enable/disable` 函数
- `packages/core/src/skill/SkillStore.js`：
  - 修改 `_resolveLocalEntry` 适配 `local-<projectId>-<slug>` 格式
  - 修改 `findEntry` 在未指定 level 时也能 fallback 到本地 skill
  - 删除 `toggle` 方法及其 JSDoc
  - 删除未使用的 `okMsg` 导入
- `packages/core/src/skill/index.js`：
  - 删除 `enable/disable` 公共 API
- `packages/server/src/routes/skill/cmd.js`：
  - 删除 `/enable/:id` 和 `/disable/:id` 路由
- `packages/web/src/api/skill/cmd.js`：
  - 删除 `enableSkill/disableSkill` 函数
- `packages/web/src/views/skill/edit/detail.vue`：
  - 删除启用/禁用按钮和 `toggleSkillEnabled` 逻辑
  - 删除 `Check/CircleClose` 图标导入
- `packages/web/src/views/skill/index.vue`：
  - 删除列表中 `enabled` 状态标签
- `packages/web/src/locales/en.json`、`ja.json`、`pt-BR.json`、`zh-Hans.json`：
  - 删除 `enable/disable` 翻译

## 验证结果
- `npm run lint` 通过 ✅

## 备注
- 手动安装的 skill id 格式：项目级 `local-<projectId>-<slug>`，全局级 `local-<slug>`
- 扫描结果不写入 store，仅在查询时动态合并
- 删除 `local-*` skill 时直接删除物理目录，符合“彻底删除”预期
- 禁用功能已彻底移除；如以后需要真正的禁用，需在 CodeWhale 运行时层面消费 `enabled` 状态

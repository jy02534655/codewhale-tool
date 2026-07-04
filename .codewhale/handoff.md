# Handoff — Skill 更新流程 SSE 化 + 前端编辑模式适配

> 最后更新: 2026-07-04
> 状态: **后端已完成 / 前端已完成 / 待端到端运行验证**

## 完成内容

### 一、install.js 改造完成（方案D）（上一会话遗留）

在 `packages/core/src/skill/install.js` 中完成了以下改造：

#### ✅ 新增内容

1. **`_cleanOpts(raw)`** — 清洗安装参数，持久化为 `installParams` 供前端回填
2. **`_finalizeInstall(store, skillId, level, meta, targetDir, rawOpts)`** — 统一收尾函数
   - `store.addToConfig`（写入 entry）
   - 自动写入 `installParams`（通过 `_cleanOpts`）
3. **`update(store, opts, onProgress, onLog)`** — 安全更新方法
   - `opts.skillId` 必填，查找现有 skill
   - 临时目录 + 临时 ID 方式安装到临时位置
   - 成功后再原子替换（删旧目录 → rename → 清理临时 entry → 回写原 entry）
   - 失败时旧 skill 不受影响，临时目录自动清理

#### ✅ 改造内容

| 函数 | 改动 |
|------|------|
| `_installFromGitHubV2` | 支持 `_skillId`/`_targetDir` 内部字段；替换 `addToConfig` 为 `_finalizeInstall` |
| `installFromZip` | 增加可选末尾参数 `_internal`；支持 `_skillId`/`_targetDir`；替换 `addToConfig` 为 `_finalizeInstall` |
| `installFromZipStream` | 增加可选末尾参数 `_internal`，透传到 `installFromZip` |
| `installFromGithubTreePath` | 增加可选末尾参数 `_extraOpts`，透传到 `_installFromGitHubV2` |
| `install` | 改为 `async`；透传 `_skillId`/`_targetDir` 到各分支 |

#### ✅ 其他文件改动

- **`cmd.js`**: 删除了旧的 `update` 方法
- **`index.js`**:
  - 移除 `update(skillId, hintLevel)` 委托
  - 新增 `updateByOpts(opts, onProgress, onLog)` 委托到 `Install.update`

### 二、GitHub Tree URL 分支修复（本次会话）

修复了安装 GitHub skill 时硬编码 `main` 分支导致 404 的问题。

#### 问题描述

用户安装 `https://github.com/Barry-Liu-888/ai-skills/tree/master/visual-reviewer` 时：
- `orchestrator.js` 第 50 行硬编码 `const branch = 'main'`
- 仓库实际使用 `master` 分支
- Tar 策略和 API 回退都返回 404

#### 修复内容

| 文件 | 改动 |
|------|------|
| `packages/core/src/download/orchestrator.js` | 新增 `branch` 参数；分支解析优先级：显式传入 > tree URL 中提取 > 默认 `main` |
| `packages/core/src/skill/install.js` | `_installFromGitHubV2` 透传 `branch` 到 `downloadSkillFromGitHub`；`installFromGithubTreePath` 透传 `parsed.branch` |
| `packages/web/src/views/skill/edit/install.vue` | `parseSmartInput` 识别 GitHub tree URL，自动切换到 `githubPath` 模式 |

#### 分支解析逻辑

```
显式传入 branch
  → 使用传入值
tree URL 中包含 /tree/<branch>/<path>
  → 从 URL 中提取分支名
两者都没有
  → 默认 main
```

### 三、Skill 更新流程 SSE 化（本次会话）

将 Skill 更新流程改为 SSE 流式进度，与安装流程统一。

#### 问题描述

- 旧 `POST /api/skill/update` 直接同步返回结果，无 SSE 进度
- 前端更新 Skill 时看不到下载/安装进度
- 安装流程已支持 SSE，但更新流程未统一

#### 修复内容

| 文件 | 改动 |
|------|------|
| `packages/server/src/routes/skill/install.js` | `POST /update` 改为创建 pending install 并返回 `streamId`；`GET /install/sse/:streamId` 检查 `pending.skillId`，决定调用 `install` 还是 `updateByOpts` |

#### 后端路由逻辑

```
POST /update
  → 验证 req.body.skillId 必填
  → 创建 pending install（包含 skillId）
  → 返回 { success: true, streamId }

GET /install/sse/:streamId
  → 获取 pending install（原子删除）
  → pending.skillId 存在 → 调用 updateByOpts（更新模式）
  → pending.skillId 不存在 → 调用 install（安装模式）
  → 通过 SSE 推送 progress/log/complete/error 事件
```

### 四、前端 ref 访问修复（本次会话）

修复 `packages/web/src/views/skill/index.vue` 中的 ref 访问错误。

#### 问题

- 第 161 行 `currentSkillId` 在 script setup 中未定义
- 应为 `tableData`（表格数据源）

#### 修复

```
- showDialogByData({ data: currentSkillId })
+ showDialogByData({ data: tableData.value })
```

### 五、未完成 / 未来待办

- [ ] **端到端运行验证**: 验证各种安装类型（github / githubPath / zip）的 update 流程在真实运行中正确。

### 六、参考文件

- `packages/core/src/skill/install.js` — 主要改造文件
- `packages/core/src/skill/cmd.js` — 删除了旧的 update 方法
- `packages/core/src/skill/index.js` — 更新了委托
- `packages/core/src/download/orchestrator.js` — 分支解析逻辑
- `packages/server/src/routes/skill/install.js` — SSE 路由改造
- `packages/web/src/views/skill/edit/install.vue` — tree URL 智能识别 + 更新模式适配（已完成）
- `packages/web/src/views/skill/index.vue` — ref 访问修复

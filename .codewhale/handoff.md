# Handoff — install.js 改造完成（方案D） + GitHub Tree URL 分支修复

> 最后更新: 2026-07-04
> 状态: **已完成（基础架构） / 待前端路由验证**

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

### 三、未完成 / 未来待办

- [ ] **路由层适配**: 前端调用更新时，需要路由层调用 `SkillManager.updateByOpts(opts, onProgress, onLog)`。当前路由层可能还需要调整。
- [ ] **前端适配**: 更新页面传入完整 `opts`（含 `skillId`），利用 `installParams` 实现参数回填。
- [ ] **测试**: 验证各种安装类型（github / githubPath / zip）的 update 流程正确。

### 四、参考文件

- `packages/core/src/skill/install.js` — 主要改造文件
- `packages/core/src/skill/cmd.js` — 删除了旧的 update 方法
- `packages/core/src/skill/index.js` — 更新了委托
- `packages/core/src/download/orchestrator.js` — 分支解析逻辑
- `packages/web/src/views/skill/edit/install.vue` — tree URL 智能识别

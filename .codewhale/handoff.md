# Handoff — Skill 安装配置持久化 + 更新复用安装弹窗

> 最后更新: 2026-07-03
> 状态: **方案已修订，待实施**

## 本次目标
在安装 skill 成功后记录安装配置；更新 skill 时复用安装弹窗回填数据，允许修改后执行覆盖安装；安装/更新共用同一套安装链路；
---

## 核心设计

### 数据存储：新增 `installConfig` 字段
在 `store.json` 的 `skills.installed[]` 中，每个 skill 条目新增可选字段 `installConfig`，记录安装时的配置快照，仅用于下次更新回填：
- `installMode`、`repoUrl`、`skillPath`
- `level`、`projectPath`
- `selectedProxyId`、`selectedTokenId`
- `githubTreeUrl`、`zipUrl`

### 后端 core 层改造
文件：`packages/core/src/skill/index.js`

1. `_addToConfig` 保持原职责不变，只负责把安装结果登记进 store，不接收、不处理 `installConfig`
2. 安装成功后单独回写 `installConfig`：在 `_installFromGitHubV2`、`installFromZip` 等安装成功后的逻辑中，由上层读取本次提交的配置，写回对应 skill 条目的 `installConfig`
3. 安装前/后统一清理旧目录：如果目标 skill 已存在，先删除旧目录，再执行安装；安装失败则保留旧目录
4. 保留 `_addToConfig` 原有调用方式，继续传入 `entry` 对象，不新增透传参数

### 后端 server 层改造
文件：`packages/server/src/routes/skill.js`

- 保留现有 `/skill/install` 接口
- 新增 `/skill/update/:id` 接口，内部读取 skill 的 `installConfig` 回填默认值后，调用与 install 相同的核心安装流程
- 不新增 `/skill/reinstall/:id`

### 前端改造
文件：`packages/web/src/views/skill/edit/install.vue`
- 增加 `updateMode` 支持
- 标题和确认按钮在更新模式下显示“更新 Skill”/“更新”
- 更新模式下回填该 skill 的 `installConfig`
- 更新模式下提交调用 `/skill/update/:id`

文件：`packages/web/src/views/skill/edit/detail.vue`
- 更新按钮打开 `install.vue(updateMode=true)`
- 不再单独维护 `updateCurrentSkill -> git pull` 分支

文件：`packages/web/src/api/skill.js`
- 补充 `updateSkill(id, payload)` 接口定义

---

## 实施步骤

| 步骤 | 文件 | 改动内容 |
|------|------|---------|
| 1 | `packages/core/src/skill/index.js` | `_addToConfig` 保持原样，不新增透传 |
| 2 | `packages/core/src/skill/index.js` | 安装成功后单独回写 `installConfig` |
| 3 | `packages/core/src/skill/index.js` | 安装前若目标已存在则先清理旧目录 |
| 4 | `packages/server/src/routes/skill.js` | 新增 `/skill/update/:id`，复用 install 核心链路 |
| 5 | `packages/web/src/api/skill.js` | 新增 update API |
| 6 | `packages/web/src/views/skill/edit/install.vue` | 支持 `updateMode` |
| 7 | `packages/web/src/views/skill/edit/detail.vue` | 更新按钮走 install 弹窗 + updateMode |

---

## 边界情况

| 场景 | 处理方式 |
|------|---------|
| 旧安装的 skill 无 `installConfig` | 更新弹窗为空表单，用户重新填写后走统一安装链路 |
| ZIP 安装的 skill 更新 | 回填 `installConfig`，用户可修改；提交后统一安装 |
| 本地 skill 更新 | `source !== 'community'`，拒绝更新 |
| 覆盖安装失败 | 保留旧目录（安装流程 catch 已有保护） |
| 用户修改配置后更新 | 以新配置为准，`installConfig` 更新为新值 |
| 代理/Token 变更 | 更新后 `installConfig` 同步更新 |

---

## 待验证
- [ ] 安装后 `store.json` 写入 `installConfig`
- [ ] 更新按钮打开同一安装弹窗并回填配置
- [ ] 修改配置后更新成功，旧文件被替换，新文件生效
- [ ] 无 `installConfig` 的旧 skill 更新时，可正常重新安装
- [ ] ZIP 安装 skill 更新流程正常
- [ ] 本地 skill 更新仍被正确禁用/提示

---

## 修改文件列表
- `packages/core/src/skill/index.js`
- `packages/server/src/routes/skill.js`
- `packages/web/src/views/skill/edit/install.vue`
- `packages/web/src/views/skill/edit/detail.vue`
- `packages/web/src/api/skill.js`

---

## 参考文件
- `packages/web/src/views/skill/index.vue`（install 组件引用）
- `packages/web/src/api/skill.js`（前端 API 层）
- `store.json`（数据存储结构）
- `.codewhale/skill-reinstall-plan.md`（详细方案文档）

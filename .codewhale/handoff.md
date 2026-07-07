# Handoff — Skill id/slug 拆分与安装逻辑改造

> 最后更新: 2026-07-06
> 状态: **已完成**

## 当前状态

### 数据文件（已完成）
- `data/store.json`：所有 `skills.installed[*]` 的 `id` 已替换为 UUID，原 id 值写入 `slug`
- `data/skills.json`：条目结构已纠正为 `id`（UUID）+ `slug`（目录名）

### Core 层（已完成）
- `packages/core/src/skill/index.js`：`discover()` 生成 `id: randomUUID(), slug: dirent.name`
- `packages/core/src/skill/install.js`：`_finalizeInstall()` 生成 UUID 并写入 `slug: skillId`
- `packages/core/src/skill/install.js`：`update()` 通过 `existing.slug` 构建目录路径
- `packages/core/src/skill/cmd.js`：`copyToProject` 生成新 UUID 并复制原 `slug`

### 前端显示调整（已完成）
- `packages/web/src/views/skill/index.vue`：
  - `displayName(s)` 回退顺序为 `s.alias || s.name || s.slug`
  - 比较/搜索逻辑同步使用 `s.alias || s.name || s.slug`
  - `name` 字段去重判断不再回退到 `s.id`
- `packages/web/src/views/skill/edit/detail.vue`：
  - `displayTitle` 回退顺序为 `s.alias || s.name || s.slug`
  - 不再回退到 `s.id`

## 验证项
- `npm run lint`：通过（2 passed, 0 failed）
- 确认安装、更新、复制、启用/禁用等接口仍可基于 UUID 正常路由：待后续功能验证确认

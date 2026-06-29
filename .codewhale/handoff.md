# Handoff — Skill 安装改进 + 文件浏览器

> 最后更新: 2026-06-29
> 状态: **全部完成** ✅

## 本次改动

### 1. Skill 文件浏览器（detail.vue）

**后端新增 API:**
- `GET /api/skill/files/:id?level=` — 返回 skill 目录下所有文件列表
- `GET /api/skill/file/:id?path=xxx&level=` — 读取指定文件内容

**core 新增方法:**
- `getSkillFiles(skillId, level)` — 递归扫描返回相对路径数组
- `readSkillFile(skillId, filePath, level)` — 读取单个文件
- `getReadme(skillId)` — 获取 SKILL.md（补全原 route 缺失的实现）
- `saveReadme(skillId, content)` — 保存 SKILL.md（补全原 route 缺失的实现）
- `_findEntry(skillId, level)` — 统一的条目录入（避免代码重复）

**前端改进:**
- `detail.vue` — 重写 SKILL.md 预览区域为文件浏览器（左侧文件树 + 右侧文件查看器）
- `api/skill.js` — 新增 `getSkillFiles()` 和 `readSkillFile()`
- 4 个 locale 文件 — 新增 `skill.files` / `skill.noFiles` 键

### 2. install.vue 右侧加宽

- `.install-right` 宽度从 240px → 280px

## 建议下一步验证
1. `pnpm install` + `pnpm dev`
2. 选择已安装的 skill 查看文件列表（应显示 SKILL.md 及其他文件）
3. 点击不同文件确认可以切换查看
4. 打开安装弹窗确认右侧宽度合理

## 上一轮已完成的内容
- 三种安装模式（GitHub 仓库 / 上传 ZIP / GitHub Tree 路径）
- SSE 流式安装进度
- install.vue 左右布局
- 多语言全覆盖
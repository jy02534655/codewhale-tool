# Handoff — Skill 详情页 Bug 批量修复

> 最后更新: 2026-07-01
> 状态: **全部完成** ✅

## 本次完整改动

### 1. `Switch` 图标不存在 → 组件崩溃
`@element-plus/icons-vue` 中没有 `Switch` 图标，导入时抛出运行时错误，整个 `<script setup>` 初始化失败，所有按钮不可用。
**修复**：用 `Check`（启用态）和 `CircleClose`（禁用态）替代。

### 2. 内容区无内边距
**修复**：`.detail-panel` 添加 `padding: 16px 18px`

### 3. `default-expand-all` → 目录移除默认展开
**修复**：移除该属性

### 4. 未默认选中 SKILL.md
**修复**：`loadFiles` 后 `nextTick` 自动选中并预加载

### 5. 按钮类型与功能不匹配
**修复**：
- 启用/禁用：`type="warning"` / `type="success"` + 图标动态切换
- 更新：仅 `community` 可见，`type="primary"`
- 编辑 SKILL.md：`type="primary"`
- 删除：`type="danger"`

### 6. Promise 无 catch 处理
**修复**：全部加 `.catch(ElMessage.error(…))`

### 7. `readmeDialogue` → `ReadmeDialogue` PascalCase
**修复**：`import ReadmeDialogue from './readme.vue'`，模板 `<ReadmeDialogue />`

### 8. `readme.vue` 弹窗崩溃
`compositionDialogBase()` 不返回 `loading`，解构后为 `undefined`。
**修复**：移除 `loading` 解构，改用局部 `ref(false)`

### 9. 折叠行为只隐藏左侧文件树
**修复**：`v-show` 仅覆盖 `file-tree-wrap`，预览区始终可见；grid 折叠时自动切换单列

### 10. 切换 skill 时预览区未更新
**修复**：watch 回调先清空 `activeFile`/`fileContent`

### 11. Markdown 预览横线滚动条（根本原因）
- `preview.css` 使用 `:deep()` 作为 Vue scoped 专属伪类，在全局 CSS 中无效 → 所有样式未生效
- 内联 `<code>` 无 `overflow-wrap`
- `.cw-file-preview__body` 使用 `overflow: auto`

**修复**：
- 移除所有 `:deep()`，改用标准后代选择器
- 全部元素添加 `overflow-wrap: break-word` + `word-break: break-word`
- `.cw-file-preview__body` → `overflow-y: auto; overflow-x: hidden`

### 12. 编辑弹窗预览区溢出
**修复**：`.editor-pane` 添加 `overflow: hidden`

### 13. `preview.css` 与 `filePreview.js` 冗余文件已删除
- 样式已内嵌至 `preview.vue`（`<style>` + `<style scoped>`）
- `filePreview.js` 已删除，detail.vue 直接从 `@/composition/file/utils` 导入

### 14. `readme.vue` 重构为复用 `Base.showDialogByData`
**修复**：传入自定义 `initfun`，异步加载文件内容委托给 Base.js 的 `showDialogByData` 触发。

## 建议验证

1. `npm run dev` → 打开 Skill 管理页
2. 切换不同 Skill，预览区自动刷新并显示 SKILL.md
3. 预览 Markdown 文件，确认无任何横向滚动条
4. 编辑 SKILL.md 弹窗正常打开，预览区不溢出
5. 折叠按钮仅隐藏文件列表，预览保持可见
6. 所有按钮正常响应并正确反馈
# Handoff — 前端布局与交互分析（桌面端优先）

> 最后更新: 2026-07-02
> 状态: **修改已完成，待验证**

## 本次目标
对 Vue 3 + Element Plus 前端项目做桌面端布局与交互评估，输出可落地改进建议，并优先推进 CSS 通用化。

## 已完成的修改

### 主题稳定性
1. **index.html** — `<html>` 标签加 `style="transition: background-color .2s, color .2s"`
2. **index.html** — `:root` 块新增 `--log-bg: #1e1e1e; --log-color: #d4d4d4;`
3. **index.html** — `[data-theme="dark"]` 块新增 log 变量 + Element Plus CSS 变量
4. **index.html** — 所有 `html.dark` 选择器改为 `[data-theme="dark"]`（全局变量 + 组件适配）
5. **index.html** — 末尾保留 `html.dark {}` 空回退
6. **App.vue** — `applyTheme` 移除 `html.classList.toggle('dark', ...)`，仅用 `data-theme`
7. **common.css** — `.log-content-dialog` 硬编码颜色改为 `var(--log-bg)` / `var(--log-color)`

### 桌面端布局优化
8. **App.vue** — `.content` 加 `max-width: 1400px; margin: 0 auto; width: 100%;`
9. **common.css** — `.page-view` 加 `max-width: 1400px; margin: 0 auto; width: 100%;`
10. **common.css** — `.page-view` 调整 `gap: 12px; padding: 16px 20px;`（提升密度）
11. **common.css** — `.card-grid` 改为 `minmax(480px, 1fr); gap: 10px;`（更宽卡片）
12. **common.css** — `.card-grid .el-card__body` padding `14px → 12px`（提升密度）
13. **SplitLayout.vue** — `leftWidth` 默认 `'320px' → '38%'`
14. **SplitLayout.vue** — `.split-right` 加 `min-width: 420px`（防挤压）
15. **skill/index.vue** — `<SplitLayout leftWidth="385px">` 改为 `leftWidth="38%"`

### Provider 页面
- 供应商列表使用 `common.css` 的 `.card-grid`，自动继承 `minmax(480px, 1fr)` 宽网格
- 无需单独修改 provider/index.vue

## 待验证
- [ ] 浏览器中切换暗黑模式无闪烁
- [ ] Provider 供应商卡片网格宽度确实变大
- [ ] Skill 分屏左栏占比约 38%，右栏内容不被挤压
- [ ] 日志弹窗背景色在暗黑模式下使用变量
- [ ] `html.dark` 回退场景（旧行为）不破坏样式

## 修改文件列表
- `packages/web/index.html`
- `packages/web/src/App.vue`
- `packages/web/src/styles/common.css`
- `packages/web/src/composition/layout/SplitLayout.vue`
- `packages/web/src/views/skill/index.vue`

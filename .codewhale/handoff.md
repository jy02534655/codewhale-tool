# Handoff — settingsGroups.js 重构与 i18n 清理

> 最后更新: 2026-07-22
> 状态: **收尾中**

## 已完成
- 已确认 `packages/web/src/views/settings/i18n` 中不存在 `label._title` / `help._title` 的情况
- 用户明确指示：**不修改 i18n JSON 中的标题键格式**
- 用户明确指示：**不修改 `label` 和 `help` 的 key**
- 已确认 `security_title/`、`subagents_title/`、`notifications_title/` 目录当前不存在；现有 `_title` 目录保留，不再继续合并
- 已完成 `settingsGroups.js` 重构：
  - 删除旧文件 `packages/web/src/views/settings/cards/settingsGroups.js`
  - 按 `titleKey` 拆分为 14 个文件：`basic_title.js`、`tui_interface_title.js`、`tui_terminal_title.js`、`security.js`、`subagents.js`、`retry_title.js`、`notifications.js`、`features_title.js`、`search_title.js`、`reasoning.js`、`context.js`、`update.js`、`paths.js`、`capacity.js`
  - 创建 `packages/web/src/views/settings/cards/index.js` 统一导出 `groups`
- 已完成消费端修改：
  - `packages/web/src/views/settings/cards/SettingsGroupCard.vue` 标题逻辑兼容对象型翻译返回值
  - `packages/web/src/views/settings/index.vue` 导入改为 `./cards/index.js`
- 已验证：项目中已无 `settingsGroups` 残留引用

## 未完成
- 运行构建/ lint 验证修改结果
- 评估 `packages/web/src/i18n.js` 是否还需要精简 `_title` 兼容逻辑（当前保持 `expandFlatKeys` 不变）

## 关键决策
- **不修改 i18n JSON 中的标题键格式**
- **不修改 `label` 和 `help` 的 key**
- `expandFlatKeys` 的平铺 key 展开功能保留
- `titleKey` 统一改为不带 `._title` 的版本
- `SettingsGroupCard.vue` 已兼容 `titleKey` 返回对象的情况

## 下一步
1. 运行构建/ lint 验证
2. 如需，再评估 `i18n.js` 的精简空间

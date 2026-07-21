# Handoff — 设置页面卡片动态化重构

> 最后更新: 2026-07-21
> 状态: **进行中**

## 目标
参考 `readonlyGroups.js` 的 JSON 配置方式，将 `packages/web/src/views/settings/cards/` 下所有可配置卡片组件改为 JSON 配置，并在 `packages/web/src/views/settings/index.vue` 中通过 `SettingsGroupCard` 动态生成。

## 已完成
- 读取并分析了 9 个可配置卡片组件（BasicSettingsCard、TuiInterfaceCard、TuiTerminalCard、SecurityCard、SubagentsCard、RetryCard、NotificationsCard、FeaturesCard、SearchCard）
- 读取了 `readonlyGroups.js` 和 `SettingsGroupCard.vue` 的实现
- 读取了 `index.vue` 的完整结构和表单逻辑

## 待执行
1. 创建 `packages/web/src/views/settings/cards/editableGroups.js` — 可配置分组的 JSON 配置
2. 修改 `SettingsGroupCard.vue` — 增加 autoSave 事件支持和 label fallback
3. 修改 `index.vue` — 动态渲染所有可配置分组，删除静态卡片导入
4. 验证构建 `npm run build`

## 关键变更文件
- `packages/web/src/views/settings/cards/editableGroups.js` — 新建
- `packages/web/src/views/settings/cards/SettingsGroupCard.vue` — 修改
- `packages/web/src/views/settings/index.vue` — 修改

## 根因
- 当前设置页面有 9 个独立的静态卡片组件，维护成本高
- 只读分组已使用 JSON 配置 + SettingsGroupCard 动态渲染
- 需要统一模式，减少重复代码

## 注意事项
- BasicSettingsCard 中的 locale/default_text_model 等字段有 `emit('save')` 自动保存逻辑，需要在 JSON 中标记 `autoSave: true`
- SubagentsCard 使用 `settings.xxx.label` 格式的 labelKey，需要在 JSON 和 SettingsGroupCard 中正确处理
- formData、rules、onSave/onCancel/onRestoreDefaults 逻辑保持不变

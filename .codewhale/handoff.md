# Handoff — Settings 枚举配置统一抽离

> 最后更新: 2026-07-16
> 状态: **已完成**

## 已确认完成
- 新建 `packages/web/src/utils/i18n/` 目录
- 新建 `packages/web/src/utils/i18n/provider.js`（迁移旧 provider-i18n.js）
- 新建 `packages/web/src/utils/i18n/settings-options.js`，集中管理 12 个 settings 下拉枚举
- 修改 `settings/index.vue`：删除 `getSelectOptions()` 和 12 个 computed 选项列表，改为从独立配置导入，保留 locale 监听
- 修改 `provider.vue` 的导入路径为 `@/utils/i18n/provider`
- 旧文件 `packages/web/src/utils/provider-i18n.js` 已清理（已覆盖为空壳）
- 调整 4 个 locales 文件，移除 settings.*_options 依赖：
  - `packages/web/src/locales/zh-Hans.json` ✓
  - `packages/web/src/locales/en.json` ✓
  - `packages/web/src/locales/ja.json` ✓
  - `packages/web/src/locales/pt-BR.json` ✓
- 验证：
  - settings 页面下拉选项已完全迁移到 `settings-options.js`
  - 语言切换时选项文本随 locale 自动更新（通过 computed + `getSettingsOptions`）
  - provider 页面导入路径已更新为 `@/utils/i18n/provider`，不受影响

## 关键文件
- `packages/web/src/views/settings/index.vue`
- `packages/web/src/utils/i18n/settings-options.js`
- `packages/web/src/utils/i18n/provider.js`
- `packages/web/src/views/provider/edit/provider.vue`
- `packages/web/src/locales/zh-Hans.json`
- `packages/web/src/locales/en.json`
- `packages/web/src/locales/ja.json`
- `packages/web/src/locales/pt-BR.json`

## 注意事项
- settings 下拉已完全迁移到独立配置，locales 中不再依赖 `settings.*_options`

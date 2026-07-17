# Handoff — 通用设置 FormItemLabel 封装 + i18n 分散化

> 最后更新: 2026-07-17
> 状态: **阶段 2 已完成**

## 已完成工作

### 1. tooltip 迁入 locales（i18n 迁移）
- 将 `settingsHelp.js` 中的 94 个 tooltip 文本迁入 4 个 locale 文件的 `settings.help.*` 结构
  - `packages/web/src/locales/zh-Hans.json`
  - `packages/web/src/locales/en.json`
  - `packages/web/src/locales/ja.json`
  - `packages/web/src/locales/pt-BR.json`
- 所有 settings 卡片的 tooltip 现在通过 `$t('settings.help.xxx')` 读取，不再依赖 `getSettingsHelp`

### 2. 组件封装 + 卡片重构
- `FormItemLabel.vue` 组件已存在（`packages/web/src/components/FormItemLabel.vue`）
- 重构了 9 个卡片组件，将重复的 `#label` 插槽替换为 `<FormItemLabel>`：
  - BasicSettingsCard.vue
  - TuiInterfaceCard.vue
  - TuiTerminalCard.vue
  - SecurityCard.vue
  - SubagentsCard.vue
  - RetryCard.vue
  - NotificationsCard.vue
  - FeaturesCard.vue
  - SearchCard.vue
- 移除了上述组件中的 `getSettingsHelp` 导入和 `helpText` computed

### 3. i18n 文件物理拆分
- 已将模块化 key 从集中式 `locales/*.json` 拆分到对应页面目录的 `i18n/` 子目录：
  - `views/provider/i18n/` → official、third_party
  - `views/skill/i18n/` → skill
  - `views/proxy/i18n/` → proxy
  - `views/token/i18n/` → token
  - `views/project/i18n/` → project
  - `views/settings/i18n/` → settings（含 settings.help）
- `locales/*.json` 已收缩为公共部分：app、message、common

### 4. i18n.js 动态合并加载
- 将 `i18n.js` 从静态导入改为 `import.meta.glob(pattern, { eager: true })`
- 动态合并 `./locales/*.json`（公共部分）与 `../views/*/i18n/*.json`（模块化部分）
- 按语言代码分组合并，构建验证通过

### 5. SearchCard.vue placeholder i18n
- `placeholder="https://..."` 改为 `:placeholder="$t('settings.placeholder_search_base_url')"`

### 6. ReadOnlyGroupCard.vue 重构
- 移除 `getSettingsHelp` 导入
- `getHelp` 改为 `t(\`settings.help.${item.key}\`)`

### 7. 清理 settingsHelp.js 和 extract-help.js
- 删除 `packages/web/src/utils/settingsHelp.js`
- 删除 `packages/web/src/locales/extract-help.js`

### 8. 构建验证
- 最后一次 `npm run build` 通过，构建成功

## 当前 git 状态
- 构建验证通过，所有 i18n 分散化改动已完成
- 建议提交前做一次前端功能冒烟测试，确认各页面翻译正常加载

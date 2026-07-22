# CodeWhale Handoff — 2026-07-22

## 当前目标
统一 settings cards 的 labelKey/helpKey 生成规则：去掉冗余显式配置，改由 groupCard.vue 动态生成，并同步调整 i18n 字段名。

## 已完成
- `packages/web/src/views/settings/cards/groupCard.vue`：模板中动态生成 `labelKey` 和 `helpKey`，规则为 `${titleKey}.${item.key}.label` 和 `${titleKey}.${item.key}.help`
- 13 个 cards JS 文件：全部去掉 item 中的显式 `labelKey` 和 `helpKey` 配置
- 52 个 i18n JSON 文件已大部分调整为 `${titleKey}.${key}` 结构
- `final-fix.cjs` 已修正 paths 和 subagents 目录中不符合规则的扁平化/下划线键

## 未完成任务

### 1. 修正 security 目录的 i18n 键
**当前状态**：`security/zh-Hans.json` 中 `permissions_toml` 仍在 `settings.security` 内部，且 `settings.permissions` 存在空对象。
**需要修正为**：`settings.security.permissions.toml`（真正嵌套结构），并删除 `settings.security.permissions_toml` 和 `settings.permissions` 空对象。
**影响文件**：`security/*.json`（4 种语言）

### 2. 全面验证 i18n 键是否符合 `titleKey + key` 规则
**需要检查**：遍历 13 个 cards JS 文件中的每个 item，确认其 `key` 与对应 i18n 目录中的字段名完全匹配 `${titleKey}.${key}`。
**已知可能问题**：
- `paths` 目录中的 `skills_dir`、`mcp_config_path`、`notes_path`、`memory_path` 这些 key 本身不包含点号，动态生成的 i18n 键应为 `settings.paths.skills_dir` 等，需确认 i18n 中是否已正确嵌套
- `tuiInterface` 和 `tuiTerminal` 目录中所有字段名是否已从 `settings` 根下正确移动到 `settings.tuiInterface.*` 和 `settings.tuiTerminal.*`

### 3. 清理临时脚本
`.codewhale/scripts/` 下的临时脚本需要删除：
- `strip-labelhelpkeys.mjs`
- `strip-labelhelpkeys.cjs`
- `test-path.cjs`
- `test-i18n.cjs`
- `update-i18n-keys.cjs`
- `fix-i18n-keys.cjs`
- `final-fix.cjs`

### 4. 最终验证
- 确认 settings 目录中无残留 `labelKey`/`helpKey` 引用
- 确认 i18n 中无孤立旧键
- 确认所有 JSON 文件语法正确
- 确认所有 JS 文件语法正确

## 关键文件
- `packages/web/src/views/settings/cards/groupCard.vue` — 已修改
- `packages/web/src/views/settings/cards/*.js` — 已修改（13 个文件）
- `packages/web/src/views/settings/i18n/**/*.json` — 已修改（52 个文件）
- `.codewhale/scripts/final-fix.cjs` — 待执行 security 修正后删除

## 下一步
1. 修正 security 目录的 i18n 键
2. 全面验证所有 i18n 键是否符合规则
3. 清理临时脚本
4. 运行最终验证

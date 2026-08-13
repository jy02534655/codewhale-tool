# CodeWhale Handoff — 2026-08-13

## 当前目标
通用设置模块对齐 `doc/codewhale_settings_v4.md` 修正方案，并以 `doc/codewhale_configuration.md` 为准绳完成验证。

## 已完成修改

### core 层
- `packages/core/src/settings/defaults.js`：新增 `CODEWHALE_DEFAULTS` 与 `CONFIG_REQUIRED_KEYS`；`max_history` → `max_input_history`；`subagents_token_budget` 设为 `0`（待确认后回填）；`tui_mouse_capture` 等 TUI 偏好保留在 settings.toml。
- `packages/core/src/settings/schema.js`：`SCHEMA` 增加 `isCodeWhaleDefault` / `isConfigRequired`；扩展 `SETTINGS_KEYS` 覆盖全部 UI 键；同步更新 `FIELD_ROUTES` 与 `UI_PATHS`。
- `packages/core/src/settings/reader.js`：增加 `CODEWHALE_DEFAULTS` 兜底填充逻辑，确保 settings.toml 必须存在项始终有值。
- `packages/core/src/settings/writer.js`：手写 `writeToSettings` / `writeToConfig`，实现"必须存在保护"与"智能精简"；修复 `settingsPath` 读写不一致问题。
- `packages/core/src/utils/index.js`：修复 `clearObject` 过度清理（保留空数组和空对象）。
- `packages/core/src/utils/toml.js`：三文件 manager（`config.toml`、`settings.toml`、`permissions.toml`）已就位。

### web 层
- `packages/web/src/views/settings/cards/tuiInterface.js`：`max_history` → `max_input_history`。
- `packages/web/src/views/settings/i18n/tuiInterface/{zh-Hans,en,ja,pt-BR}.json`：键名同步更新，默认值说明从 `1000` 改为 `100`。

### 计划与验证
- 实施计划：`.codewhale/plans/2026-08-13-settings-v4.0.md`
- `npm run lint`：通过
- `npm run build`：成功

## 进行中
- [x] 对齐 v4.0 核心改进（三文件分流、必须存在保护、智能精简）
- [x] 以 `codewhale_configuration.md` 为准绳调整 TUI 键归属
- [x] 修复 writer 读写键名不一致
- [x] 全项目同步 `max_history` → `max_input_history`
- [x] 运行 lint/build 验证

## 下一个动作
- 如需，可补充 reader/writer 单元测试覆盖三文件合并与 permissions 未提交场景。
- `subagents_token_budget` 确认准确默认值后回填。

## 验证结果
- lint：通过
- build：成功

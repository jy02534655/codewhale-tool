# CodeWhale Handoff — 2026-08-12

## 当前目标
通用设置模块对齐 `doc/codewhale_configuration.md` 2026-08-12 修订记录。

## 已完成修改

### core 层
- `packages/core/src/settings/defaults.js`：更新子代理默认值（`subagents_max_concurrent` 20→64、`subagents_launch_concurrency` 20→64、`subagents_api_timeout_secs` 120→600、`subagents_max_admitted` 200→1024）；新增 `update_check_interval_hours`、`approval_default_selection`、通知事件/事件声音/静音、TUI 工作栏/会话栏/启动菜单/聚焦纹理/内联 diff 等字段；删除 context 废弃键（`context_verbatim_window_turns`、`context_l1_threshold`、`context_l2_threshold`、`context_l3_threshold`、`context_seam_model`）。
- `packages/core/src/settings/schema.js`：同步新增字段 PATH_MAP；删除 context 废弃键 PATH_MAP。

### Web 设置卡片
- `packages/web/src/views/settings/cards/subagents.js`：`subagents_max_concurrent` UI 上限 20→128。
- `packages/web/src/views/settings/cards/context.js`：移除已弃用字段，仅保留 `context_enabled` 与 `CODEWHALE_CACHE_MAXIMAL`。
- `packages/web/src/views/settings/cards/notifications.js`：补充 `notifications_quiet`、6 个事件开关、事件声音开关/间隔/静音。
- `packages/web/src/views/settings/cards/basic.js`：补充 `update_check_interval_hours`。
- `packages/web/src/views/settings/cards/security.js`：补充 `approval_default_selection`。
- `packages/web/src/views/settings/cards/tuiInterface.js`：补充 `thinking_default_expanded`、`inline_diffs`、`focus_texture`、`rail_panel`、`work_surface_placement`、`sessions_rail`、`session_auto_resume`、`launch_screen`、`work_surface_top_height`、`work_surface_side_width`。
- `packages/web/src/utils/i18n/settings.js`：新增下拉选项映射。

### Web 视图 i18n（zh-Hans / en 部分完成）
- 已完成 zh-Hans：`basic`、`notifications`、`security`、`tuiInterface`、`subagents`、`context`。
- 已完成 en：`basic`、`notifications`、`security`、`subagents`。
- 待完成 en：`tuiInterface`、`context`。
- 待完成 ja / pt-BR：`basic`、`notifications`、`security`、`tuiInterface`、`subagents`、`context`。

## 关键决策
- **废弃键彻底删除**：context 废弃键从 defaults/schema/UI/i18n 全部移除，不再保留兼容映射。
- **前端新增字段直接透传**：settings 卡片新增项沿用现有 `el-switch` / `el-input-number` / `SettingsSelect` / `el-input` 模式。
- **i18n 分层维护**：`utils/i18n/settings.js` 负责下拉选项映射；`views/settings/i18n/<group>/*.json` 负责 label/help 翻译。

## 进行中
- [x] 从 defaults.js / schema.js 删除 context 废弃键
- [ ] 补充 settings/i18n 各分组新增配置翻译（en: tuiInterface/context；ja/pt-BR: 全部分组）
- [ ] 运行 lint/build 验证

## 下一个动作
1. 继续补充 `packages/web/src/views/settings/i18n/*` 中 ja / pt-BR 及剩余 en 翻译。
2. 运行 `npm run lint` 与 `npm run build` 验证。

## 验证结果
- 待执行

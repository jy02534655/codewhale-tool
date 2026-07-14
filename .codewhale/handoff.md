# Handoff — 通用设置扩展：管理 codewhale_configuration.md 中的配置

> 最后更新: 2026-07-14
> 状态: **计划阶段，待执行**

## 目标
扩展通用设置页面，使其能够管理 `codewhale_configuration.md` 中描述的 CodeWhale 运行时配置，实现 Web UI 对 CodeWhale `~/.codewhale/config.toml` 的可视化管理。

## 当前状态
- 通用设置页面（`packages/web/src/views/settings/index.vue`）仅管理：
  - Web UI 语言（`locale`）
  - 默认模型（`default_text_model`）
  - Instructions（指令路径列表）
- 后端（`packages/server/src/routes/settings.js`）已支持从 CodeWhale `config.toml` 读写上述三项，并与 `store.json` 双向同步
- `codewhale_configuration.md` 中描述了大量 CodeWhale 运行时配置，目前无法通过 Web UI 管理

## 筛选出的 Web 可管理配置
根据配置性质，筛选出适合在 Web 通用设置中集中管理的配置：

| 分类 | 配置项 | 说明 |
|------|--------|------|
| TUI 界面 | `theme` | 主题（system/dark/light/grayscale/catppuccin-mocha/tokyo-night/dracula/gruvbox-dark） |
| TUI 界面 | `default_mode` | 默认模式（agent/plan/yolo） |
| TUI 界面 | `sidebar_focus` | 侧边栏焦点（pinned/auto/tasks/agents/context/hidden） |
| TUI 界面 | `show_thinking` | 显示思考过程（on/off） |
| TUI 界面 | `show_tool_details` | 显示工具详情（on/off） |
| TUI 界面 | `auto_compact` | 自动压缩上下文 |
| TUI 界面 | `auto_compact_threshold_percent` | 自动压缩阈值（10~100） |
| TUI 界面 | `paste_burst_detection` | 粘贴突发检测（on/off） |
| TUI 界面 | `mention_menu_limit` | @提及菜单候选数（默认 128） |
| TUI 界面 | `mention_walk_depth` | @提及遍历深度（默认 6，0 为无限） |
| TUI 界面 | `mention_menu_behavior` | @提及菜单行为（fuzzy/browser） |
| TUI 界面 | `cost_currency` | 成本显示货币（usd/cny/rmb/yuan） |
| TUI 界面 | `background_color` | 自定义背景色（#RRGGBB 或 default） |
| TUI 界面 | `max_history` | 输入历史条数 |
| TUI 界面 | `default_model` | 默认模型覆盖 |
| TUI 界面 | `verbosity` | 输出详细程度（normal/concise） |
| TUI 终端 | `tui.alternate_screen` | 备用屏幕（auto/always/never） |
| TUI 终端 | `tui.mouse_capture` | 鼠标捕获（true/false） |
| TUI 终端 | `tui.terminal_probe_timeout_ms` | 终端探测超时（100~5000，默认 500） |
| TUI 终端 | `tui.stream_chunk_timeout_secs` | 流式块超时（1~3600，默认 300） |
| TUI 终端 | `tui.osc8_links` | OSC 8 超链接（true/false） |
| 安全与审批 | `approval_policy` | 审批策略（on-request/untrusted/never） |
| 安全与审批 | `sandbox_mode` | 沙箱模式（read-only/workspace-write/danger-full-access/external-sandbox） |
| 安全与审批 | `allow_shell` | 是否允许 shell 工具 |
| 子代理 | `[subagents].max_concurrent` | 最大并发子代理数（1~20，默认 20） |
| 子代理 | `[subagents].token_budget` | 令牌预算（0 表示无限制） |
| 子代理 | `[subagents].api_timeout_secs` | API 超时（1~1800，默认 120） |
| 子代理 | `[subagents].heartbeat_timeout_secs` | 心跳超时（30~3600，默认 300） |
| 子代理 | `[subagents].default_model` | 默认子代理模型 |
| 重试 | `[retry].enabled` | 启用重试 |
| 重试 | `[retry].max_retries` | 最大重试次数（默认 3） |
| 重试 | `[retry].initial_delay` | 初始延迟（秒，默认 1.0） |
| 重试 | `[retry].max_delay` | 最大延迟（秒，默认 60.0） |
| 重试 | `[retry].exponential_base` | 指数退避基数（默认 2.0） |
| 通知 | `[notifications].method` | 通知方式（auto/osc9/bel/off） |
| 通知 | `[notifications].threshold_secs` | 触发阈值（秒，默认 30） |
| 通知 | `[notifications].completion_sound` | 完成声音（beep/off/bell/file） |
| 功能开关 | `[features].shell_tool` | Shell 工具开关 |
| 功能开关 | `[features].subagents` | 子代理开关 |
| 功能开关 | `[features].web_search` | 网页搜索开关 |
| 功能开关 | `[features].apply_patch` | 应用补丁开关 |
| 功能开关 | `[features].mcp` | MCP 协议开关 |
| 功能开关 | `[features].exec_policy` | 执行策略开关 |
| 功能开关 | `[features].vision_model` | 视觉模型开关 |
| 搜索 | `[search].provider` | 搜索后端 |
| 搜索 | `[search].base_url` | 自定义搜索端点 |
| 更新 | `[update].check_for_updates` | 启动时检查更新 |

**暂不纳入 Web 管理的配置：**
- `[[hotbar]]` 热键栏（结构复杂，后续可单独扩展）
- `[auto_review]` 自动审查规则（结构复杂，后续可单独扩展）
- `skills_dir`, `mcp_config_path`, `notes_path`, `memory_path` 等路径配置
- `[capacity].*` 容量控制（实验性）
- `[snapshots].*`, `[verifier].*`, `[memory].*` 等运行时机制配置

## 任务清单

### 1. 扩展后端配置读写（`packages/server/src/routes/settings.js`）
- [ ] 扩展 `readSettingsFromCodeWhale()`，将筛选出的配置项读取到返回结构
- [ ] 扩展 `writeSettingsToCodeWhale()`，支持将筛选出的配置项写入 `config.toml`
- [ ] 保持 `instructions` 的现有逻辑不变
- [ ] 确保 `locale` / `default_text_model` 的双向同步逻辑不变

### 2. 扩展前端配置表单（`packages/web/src/views/settings/index.vue`）
- [ ] 在页面中添加新的配置分组卡片：
  - TUI 界面
  - TUI 终端
  - 安全与审批
  - 子代理
  - 重试
  - 通知
  - 功能开关
  - 搜索
  - 更新检查
- [ ] 为每个配置项选择合适的表单控件（下拉框 / 输入框 / 开关）
- [ ] 绑定数据到 `form` 对象，并在变更时自动保存

### 3. 更新多语言翻译
- [ ] `packages/web/src/locales/zh-Hans.json`
- [ ] `packages/web/src/locales/en.json`
- [ ] `packages/web/src/locales/ja.json`
- [ ] `packages/web/src/locales/pt-BR.json`

### 4. 更新类型定义（`packages/core/src/types.js`）
- [ ] 可选：扩展 `StoreData` JSDoc，增加新配置字段的类型定义

### 5. 回归验证
- [ ] `npm run lint` 通过
- [ ] 本地启动 dev server，验证各配置项可正常读写
- [ ] 验证刷新页面后配置保持与 `config.toml` 一致
- [ ] 验证 Instructions 的现有功能不受影响

## 关键约束
- 所有代码必须使用中文注释（行上方注释）
- Promise 操作优先采用链式写法（`.then()` / `.catch()`）
- 严格遵循 `skills/architecture/SKILL.md` 三层架构规范：
  - **Core 层**（`packages/core/src/`）：不处理 HTTP，不导入 Express；Manager 返回标准格式 `{ success, data?, message? }`；使用 `ok()` / `okMsg()` / `failMsg()`
  - **Server 层**（`packages/server/src/`）：不实现业务逻辑，不直接操作 `node:fs` / `store.json` / `config.toml`；路由职责只有两项：从 `req` 提取参数 + `guard()` / `res.json()`；写操作如需同步 CodeWhale 使用 `withSync(syncMgr, () => mgr.method(...))`
  - **Web 层**（`packages/web/src/`）：不直接操作 `store.json` 或 `config.toml`，所有数据通过 `/api/*` 端点获取；API 函数封装在 `api/` 目录
- 数据流向必须遵守：`Web → API → Server Route → guard → Core Manager → ConfigEngine → store.json ↔ config.toml`
- 保持与 CodeWhale `config.toml` 格式兼容，写入时保留原有注释和结构
- 现有的 `instructions` 只读/可编辑逻辑保持不变
- 添加新域名的 checklist：`types.js` typedef → `utils/i18n.js` SERVER_MSG → `utils/config.js` get/set → Manager 类 → `index.js` 导出

## 待决策项
1. 是否需要在 `store.json` 中完整镜像所有配置项，还是仅从 `config.toml` 实时读取？
   - 建议：从 `config.toml` 实时读取，`store.json` 仅做轻量缓存或仅存储 `locale` / `default_text_model`
2. `[subagents].default_model` 等模型名称字段，下拉选项是写死还是动态获取可用模型列表？
   - 建议：先写死常见模型，后续可改为动态获取
3. 部分配置（如 `approval_policy`、`sandbox_mode`）可能影响 CodeWhale 安全策略，Web UI 是否需要额外权限控制？
   - 建议：当前版本不做额外权限控制，后续可按需添加

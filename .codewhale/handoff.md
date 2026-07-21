# Handoff — 设置页面 i18n 拆分与深层合并支持

> 最后更新: 2026-07-21
> 状态: **已完成**

## 目标
将 `packages/web/src/views/settings/i18n` 中的配置项按照 `settingsGroups.js` 的分组拆分成不同子目录，方便后续维护；修改 `packages/web/src/i18n.js` 支持递归子目录加载并使用深层合并。

## 已完成
- 已修改 `packages/web/src/i18n.js`：
  - `import.meta.glob` 模式从 `./views/*/i18n/*.json` 改为 `./views/*/i18n/**/*.json`，支持递归子目录
  - 新增 `deepMerge` 函数，合并拆分后的 i18n 文件时使用深层合并，避免同名 `settings` 对象互相覆盖
- 已拆分 `packages/web/src/views/settings/i18n`：
  - 删除原来的 4 个大文件（`zh-Hans.json`、`en.json`、`ja.json`、`pt-BR.json`）
  - 按 `settingsGroups.js` 中的 17 个分组创建子目录（`basic_title/`、`tui_interface_title/`、`capacity/`、`context/` 等）
  - 创建 `common/` 目录存放不属于任何分组的通用字段（如 `title`、`loading`、`actions_*`、`placeholders_*`、`instructions_*` 等）
  - 每个子目录内按语言保存 4 个文件，共 72 个文件
- 已验证所有 4 个语言的 135 个 key 在拆分前后完全一致
- 已验证构建 `npm run build` 成功

## 关键变更文件
- `packages/web/src/i18n.js` — 已修改（glob 支持子目录 + deepMerge）
- `packages/web/src/views/settings/i18n/` — 从 4 个平铺文件拆分为 18 个目录 72 个文件

## 拆分目录结构
```
packages/web/src/views/settings/i18n/
├── common/                    # 通用字段（title, language, instructions, actions, placeholders 等）
│   ├── zh-Hans.json
│   ├── en.json
│   ├── ja.json
│   └── pt-BR.json
├── basic_title/               # 基本设置（language, default_model, update_check_for_updates）
├── tui_interface_title/       # TUI 界面（theme, default_mode, sidebar_focus 等）
├── tui_terminal_title/        # TUI 终端（tui_alternate_screen, approval_policy, sandbox_mode 等）
├── security_title/            # 安全（allow_shell）
├── subagents_title/           # 子代理限制（subagents_max_concurrent, subagents_token_budget 等）
├── retry_title/               # 重试（retry_enabled, retry_max_retries 等）
├── notifications_title/       # 通知方法（notifications_method, notifications_threshold_secs 等）
├── features_title/            # 功能开关（features_shell_tool, features_subagents 等）
├── search_title/              # 搜索（search_provider, search_base_url）
├── reasoning/                 # 推理（reasoning_effort）
├── context/                   # 上下文管理（context.enabled, context.l1_threshold 等）
├── update/                    # 更新（update_uri）
├── security/                  # 权限与路径（permissions.toml）
├── paths/                     # 路径（skills_dir, mcp_config_path, notes_path 等）
├── capacity/                  # 容量控制（capacity.*）
├── subagents/                 # 子代理模型（subagents.worker_model, subagents.explorer_model 等）
└── notifications/             # 通知详情（notifications.include_summary, notifications.sound_file）
```

## 验证结果
- 4 个语言的 135 个 key 在拆分前后完全一致，无缺失无多余
- `npm run build` 构建成功，Vite 正确识别并打包了子目录下的 i18n JSON 文件

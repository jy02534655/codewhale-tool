# CodeWhale Handoff — 2026-07-22

## 当前目标（已完成）
1. 修复 views/settings/i18n 中不准确的翻译，参考 codewhale_configuration.md
2. 确保包含其他选项的说明在翻译中正确体现对应选项值
3. 特别修正 approval_policy 在翻译中体现为对应选项（on-request / untrusted / never）

## 已完成的修改

### 1. security/i18n（4 种语言）
- `approval_policy.help`：补充具体选项说明（on-request / untrusted / never）及默认值
- `sandbox_mode.help`：补充四种模式的详细说明（read-only / workspace-write / danger-full-access / external-sandbox）
- `allow_shell.help`：补充 true/false 行为说明，并提及仍受 approval_policy 控制

| 文件 | 修改字段 |
|------|----------|
| `packages/web/src/views/settings/i18n/security/en.json` | approval_policy, sandbox_mode, allow_shell |
| `packages/web/src/views/settings/i18n/security/ja.json` | approval_policy, sandbox_mode, allow_shell |
| `packages/web/src/views/settings/i18n/security/pt-BR.json` | approval_policy, sandbox_mode, allow_shell |
| `packages/web/src/views/settings/i18n/security/zh-Hans.json` | approval_policy, sandbox_mode, allow_shell |

### 2. notifications/i18n（4 种语言）
- `notifications_method.help`：修正错误选项描述（原译 "system notification, email, Telegram" 与配置文档不符），替换为实际选项（auto / osc9 / bel / off）
- `notifications_completion_sound.help`：补充具体选项说明（beep / off / bell / file）

| 文件 | 修改字段 |
|------|----------|
| `packages/web/src/views/settings/i18n/notifications/en.json` | notifications_method, notifications_completion_sound |
| `packages/web/src/views/settings/i18n/notifications/ja.json` | notifications_method, notifications_completion_sound |
| `packages/web/src/views/settings/i18n/notifications/pt-BR.json` | notifications_method, notifications_completion_sound |
| `packages/web/src/views/settings/i18n/notifications/zh-Hans.json` | notifications_method, notifications_completion_sound |

### 3. reasoning/i18n（4 种语言）
- `reasoning_effort.help`：补充缺失选项 `off`、`max`、`ultracode`

| 文件 | 修改字段 |
|------|----------|
| `packages/web/src/views/settings/i18n/reasoning/en.json` | reasoning_effort |
| `packages/web/src/views/settings/i18n/reasoning/ja.json` | reasoning_effort |
| `packages/web/src/views/settings/i18n/reasoning/pt-BR.json` | reasoning_effort |
| `packages/web/src/views/settings/i18n/reasoning/zh-Hans.json` | reasoning_effort |

### 4. basic/zh-Hans
- `update_check_for_updates.help`：补充 `false` 选项说明（完全关闭更新检查）

| 文件 | 修改字段 |
|------|----------|
| `packages/web/src/views/settings/i18n/basic/zh-Hans.json` | update_check_for_updates |

## 验证结果
- 所有修改的 JSON 文件语法验证通过
- `npm run lint` 通过（0 错误）

## 遗留工作（来自上一会话，尚未开始）
- settings cards 禁用项清理
- settings/index.vue 重构（clearObject + assign，formData 无默认值）
- onRestoreDefaults 改为调用后端接口恢复默认
- core 层统一管理通用设置（defaults.js、reader.js、writer.js）
- server routes 瘦身委托 core 层
- 去除冗余 maskingStore.loading 调用

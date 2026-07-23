# CodeWhale Handoff — 2026-07-23

## 当前目标（已完成）
1. 按照 config.md 方案重构通用设置模块（core/settings/）
2. 消除 I/O 重复，统一使用 io.js
3. 引入 Schema 驱动读写（defaults.js + schema.js + utils.js）
4. 修正 TUI 终端字段归属（codewhale_configuration.md 2.8 节：属于 TUI 界面与交互）
5. 为所有核心代码添加中文注释
6. 更新 web 前端适配后端变更

## 已完成的修改

### 1. core/settings/ 模块重构（5 个新文件 + 3 个修改文件）

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `packages/core/src/settings/io.js` | 统一配置读写抽象：codeWhalePath()、readConfig()、writeConfig() |
| 新建 | `packages/core/src/settings/utils.js` | 嵌套操作工具 + lodash 兼容：getNested/setNested/deleteNested、clearObject、readFromTomlBySchema、applyToTomlBySchema |
| 新建 | `packages/core/src/settings/schema.js` | PATH_MAP + 自动生成 SCHEMA |
| 修改 | `packages/core/src/settings/defaults.js` | 恢复 5 个 TUI 终端字段（tui_alternate_screen / tui_mouse_capture / tui_terminal_probe_timeout_ms / tui_stream_chunk_timeout_secs / tui_osc8_links），添加注释 |
| 重写 | `packages/core/src/settings/reader.js` | Schema 驱动读取，使用 io.js 统一 I/O，保留 instruction 内容解析 |
| 重写 | `packages/core/src/settings/writer.js` | Schema 驱动写入，使用 io.js 统一 I/O，智能写入（默认值不落盘） |
| 修改 | `packages/core/src/settings/index.js` | 引入 io.js 管理 instructions，readInstructionsFromConfig/writeInstructionsToConfig 独立复用 io |

### 2. web 前端适配（3 个修改文件）

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `packages/web/src/views/settings/cards/tuiTerminal.js` | 保留 TUI 终端卡片组定义（5 个字段） |
| 修改 | `packages/web/src/views/settings/cards/index.js` | 保留 tuiTerminalGroups 导入和展开 |
| 修改 | `packages/web/src/views/settings/index.vue` | 保留 tui_alternate_screen 校验规则 |

### 3. 关键改进

- **消除 I/O 重复**：所有文件读写、目录创建、TOML 解析/序列化都集中在 io.js，reader/writer/index 均调用 readConfig() 和 writeConfig()
- **声明式 Schema**：新增字段只需在 DEFAULT_SETTINGS 和 PATH_MAP 中各加一行，SCHEMA 自动生成
- **智能写入**：applyToTomlBySchema 使用 lodash isEqual 比较值与默认值，相等则删除字段，使 config.toml 极简
- **TUI 终端字段正确归属**：5 个 TUI 终端字段属于 codewhale_configuration.md 2.8 节"TUI 界面与交互"，通过 PATH_MAP 映射到嵌套 TOML 路径（tui.alternate_screen / tui.mouse_capture / tui.terminal_probe_timeout_ms / tui.stream_chunk_timeout_secs / tui.osc8_links）
- **instructions 独立管理**：通过 io.js 读写，仅保存 path 字符串，content 在读取时从文件系统重新解析
- **保护其他配置**：writer 只处理 SCHEMA 中的字段，其他字段（api_key、projects、providers.*）原样保留

## 验证结果
- 所有 JS 文件语法验证通过（node --check 0 错误）
- SCHEMA 包含全部 5 个 TUI 终端字段，映射到正确的嵌套 TOML 路径
- web 前端 i18n tuiTerminal 翻译文件无需修改（已存在 4 种语言）
- server routes 无需修改（SettingsManager 对外 API 行为不变）

## 遗留工作
- settings cards 禁用项清理（已完成）
- settings/index.vue 重构已完成（clearObject + assign，formData 无默认值）
- onRestoreDefaults 改为调用后端接口恢复默认（已完成）
- core 层统一管理通用设置（已完成）
- server routes 瘦身委托 core 层（已完成，无需修改）

# Handoff — Settings 页面配置项说明 Tooltip + 不可配置项补充

> 最后更新: 2026-07-16
> 状态: **计划已制定，待执行**

## 目标
在通用设置页面的每个配置项 label 后添加 `?` 图标，点击可查看配置说明；并将配置文档中已有但 UI 尚未支持的通用设置配置项补充到页面中，标记为不可配置状态。

## 待修改文件清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `packages/web/src/utils/settingsHelp.js` | **新建** | 存放所有配置项说明文本，基于 `codewhale_configuration.md` 提取 |
| `packages/web/src/views/settings/cards/BasicSettingsCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/TuiInterfaceCard.vue` | 修改 | 每个 label 后加 tooltip；修复 `default_model` 绑定问题 |
| `packages/web/src/views/settings/cards/TuiTerminalCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/SecurityCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/SubagentsCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/RetryCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/NotificationsCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/FeaturesCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/SearchCard.vue` | 修改 | 每个 label 后加 tooltip |
| `packages/web/src/views/settings/cards/ReadOnlySettingsCard.vue` | **新建** | 不可配置项卡片（disabled 状态） |
| `packages/web/src/views/settings/index.vue` | 修改 | 引入新卡片 |
| `packages/web/src/styles/common.css` | 修改 | 添加 help-icon 样式 |
| `packages/web/src/locales/zh-Hans.json` | 修改 | 新增 tooltip 文本（如需 i18n） |

## 配置项分类

### 已可配置（9 个卡片中已有，需加 tooltip）

| 卡片 | 配置项 | 配置文档章节 | 说明来源 |
|------|--------|-------------|----------|
| BasicSettingsCard | locale | 2.1 | 语言选择说明 |
| BasicSettingsCard | default_text_model | 2.1 | 默认文本模型说明 |
| BasicSettingsCard | update_check_for_updates | 2.12 | 启动时检查更新 |
| TuiInterfaceCard | theme | 2.4 | 主题说明 |
| TuiInterfaceCard | default_mode | 2.4 | 默认模式说明 |
| TuiInterfaceCard | sidebar_focus | 2.4 | 侧边栏焦点说明 |
| TuiInterfaceCard | mention_menu_behavior | 2.4 | @提及菜单行为 |
| TuiInterfaceCard | cost_currency | 2.4 | 成本显示货币 |
| TuiInterfaceCard | verbosity | 2.4 | 输出详细程度 |
| TuiInterfaceCard | show_thinking | 2.4 | 显示思考过程 |
| TuiInterfaceCard | show_tool_details | 2.4 | 显示工具详情 |
| TuiInterfaceCard | auto_compact | 2.4 | 自动压缩上下文 |
| TuiInterfaceCard | paste_burst_detection | 2.4 | 粘贴突发检测 |
| TuiInterfaceCard | auto_compact_threshold_percent | 2.4 | 自动压缩阈值 |
| TuiInterfaceCard | mention_menu_limit | 2.4 | @提及菜单候选数 |
| TuiInterfaceCard | mention_walk_depth | 2.4 | @提及遍历深度 |
| TuiInterfaceCard | max_history | 2.4 | 输入历史条数 |
| TuiInterfaceCard | background_color | 2.4 | 自定义背景色 |
| TuiInterfaceCard | default_model_override | 2.1 | 默认模型覆盖（**修复：当前不可配置，需标记**） |
| TuiTerminalCard | tui_alternate_screen | 2.4 | 备用屏幕 |
| TuiTerminalCard | tui_mouse_capture | 2.4 | 鼠标捕获 |
| TuiTerminalCard | tui_terminal_probe_timeout_ms | 2.4 | 终端探测超时 |
| TuiTerminalCard | tui_stream_chunk_timeout_secs | 2.4 | 流式块超时 |
| TuiTerminalCard | tui_osc8_links | 2.4 | OSC 8 超链接 |
| SecurityCard | approval_policy | 2.2 | 审批策略 |
| SecurityCard | sandbox_mode | 2.2 | 沙箱模式 |
| SecurityCard | allow_shell | 2.2 | 允许 shell |
| SubagentsCard | subagents_max_concurrent | 2.3 | 最大并发子代理数 |
| SubagentsCard | subagents_token_budget | 2.3 | 令牌预算 |
| SubagentsCard | subagents_api_timeout_secs | 2.3 | API 超时 |
| SubagentsCard | subagents_heartbeat_timeout_secs | 2.3 | 心跳超时 |
| SubagentsCard | subagents_default_model | 2.3 | 默认子代理模型 |
| RetryCard | retry_enabled | 2.5 | 启用重试 |
| RetryCard | retry_max_retries | 2.5 | 最大重试次数 |
| RetryCard | retry_initial_delay | 2.5 | 初始延迟 |
| RetryCard | retry_max_delay | 2.5 | 最大延迟 |
| RetryCard | retry_exponential_base | 2.5 | 指数退避基数 |
| NotificationsCard | notifications_method | 2.7 | 通知方式 |
| NotificationsCard | notifications_threshold_secs | 2.7 | 触发阈值 |
| NotificationsCard | notifications_completion_sound | 2.7 | 完成声音 |
| FeaturesCard | features_shell_tool | 2.9 | Shell 工具 |
| FeaturesCard | features_subagents | 2.9 | 子代理 |
| FeaturesCard | features_web_search | 2.9 | 网页搜索 |
| FeaturesCard | features_apply_patch | 2.9 | 应用补丁 |
| FeaturesCard | features_mcp | 2.9 | MCP 协议 |
| FeaturesCard | features_exec_policy | 2.9 | 执行策略 |
| FeaturesCard | features_vision_model | 2.9 | 视觉模型 |
| SearchCard | search_provider | 2.10 | 搜索后端 |
| SearchCard | search_base_url | 2.10 | 自定义搜索端点 |

### 不可配置（需新建 ReadOnlySettingsCard，disabled 状态）

| 分组 | 配置项 | 配置文档章节 | 说明 |
|------|--------|-------------|------|
| 上下文管理 | `[context].enabled` | 2.4 | 启用 Fin 快速路径管理 |
| 上下文管理 | `[context].verbatim_window_turns` | 2.4 | 完整保留的最近轮数 |
| 上下文管理 | `[context].l1_threshold` | 2.4 | L1 阈值 |
| 上下文管理 | `[context].l2_threshold` | 2.4 | L2 阈值 |
| 上下文管理 | `[context].l3_threshold` | 2.4 | L3 阈值 |
| 上下文管理 | `[context].seam_model` | 2.4 | 接缝模型 |
| 上下文管理 | `CODEWHALE_CACHE_MAXIMAL` | 2.4 | 缓存最大化模式 |
| 通知 | `[notifications].include_summary` | 2.7 | 包含摘要 |
| 通知 | `[notifications].sound_file` | 2.7 | 自定义声音文件路径 |
| 更新检查 | `[update].update_uri` | 2.12 | 自定义更新镜像 |
| 安全 | `permissions.toml` | 2.2 | 同级权限规则文件 |
| 路径配置 | `skills_dir` | 2.11 | 技能目录 |
| 路径配置 | `[skills].scan_codewhale_only` | 2.11 | 仅扫描 CodeWhale 技能 |
| 路径配置 | `mcp_config_path` | 2.11 | MCP 配置文件 |
| 路径配置 | `notes_path` | 2.11 | 笔记文件路径 |
| 路径配置 | `memory_path` | 2.11 | 记忆文件路径 |
| 路径配置 | `[memory].enabled` | 2.11 | 启用用户记忆 |
| 路径配置 | `[snapshots].enabled` | 2.11 | 启用文件快照 |
| 路径配置 | `[snapshots].max_age_days` | 2.11 | 快照保留天数 |
| 路径配置 | `[verifier].enabled` | 2.11 | 启用自动验证器 |
| 路径配置 | `[verifier].verdict_policy` | 2.11 | 验证器裁决策略 |
| 子代理 | `[subagents].max_depth` | 2.3 | 子代理嵌套深度 |
| 子代理 | `[subagents].launch_concurrency` | 2.3 | 同时启动的直接子代理数 |
| 子代理 | `[subagents].max_admitted` | 2.3 | 排队+运行总数上限 |
| 子代理 | `[subagents].worker_model` | 2.3 | Worker 角色模型 |
| 子代理 | `[subagents].explorer_model` | 2.3 | Explorer 角色模型 |
| 子代理 | `[subagents].awaiter_model` | 2.3 | Awaiter 角色模型 |
| 子代理 | `[subagents].review_model` | 2.3 | Review 角色模型 |
| 子代理 | `[subagents].custom_model` | 2.3 | 自定义角色模型 |
| 功能开关 | `reasoning_effort` | 2.1 | 推理强度 |
| 容量控制 | `[capacity].*` (全部) | 2.6 | 实验性容量控制器（整组） |

## 技术实现方案

### 1. 统一说明文本管理 (`settingsHelp.js`)
```javascript
/**
 * 通用设置配置项说明文本
 * 来源：codewhale_configuration.md
 */
export const settingsHelp = {
  locale: 'Web UI 语言。切换界面显示语言，偏好持久化到 store.json。',
  default_text_model: '默认文本模型。如 deepseek-v4-pro、deepseek-v4-flash 等。',
  update_check_for_updates: '启动时检查更新。后台检查最新稳定版，有新版本时显示提示。',
  // ... 其他配置项
};
```

### 2. Tooltip 组件使用
在每个 `el-form-item` 的 label 后添加：
```vue
<template #label>
  <div class="form-item-label">
    <span>{{ $t('settings.xxx') }}</span>
    <el-tooltip placement="top" :content="helpText">
      <el-icon class="help-icon"><QuestionFilled /></el-icon>
    </el-tooltip>
  </div>
</template>
```

### 3. 不可配置项标记
- 使用 `el-input` / `el-select` / `el-switch` 的 `disabled` 属性
- 添加灰色样式区分
- Tooltip 中说明"暂不可配置，后续版本支持"

### 4. 新增 ReadOnlySettingsCard
- 将不可配置项按逻辑分组（上下文管理、通知、路径配置、子代理、容量控制等）
- 使用 `el-card` + disabled 表单控件
- 每个配置项也有 tooltip

### 5. 样式
```css
.help-icon {
  color: var(--el-text-color-secondary);
  cursor: help;
  margin-left: 4px;
  font-size: 14px;
}
.form-item-label {
  display: flex;
  align-items: center;
  gap: 4px;
}
```

## 执行顺序

1. 先创建 `settingsHelp.js`（说明文本数据）
2. 并行改造 9 个现有卡片（加 tooltip）
3. 新建 `ReadOnlySettingsCard.vue`
4. 修改 `index.vue` 引入新卡片
5. 添加 CSS 样式
6. 运行 `npm run build` 验证构建通过

## 验证计划

- `npm run build`（在 `packages/web` 下）构建通过，无错误
- 手动检查 tooltip 显示正常
- 检查不可配置项是否显示为 disabled 状态

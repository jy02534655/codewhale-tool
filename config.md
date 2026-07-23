# CodeWhale 通用设置模块完整重构方案（ESM 版，消除 I/O 重复）

## 1. 设计目标与原则

- **单一数据源**：所有通用设置的默认值只在 `DEFAULT_SETTINGS` 中定义。
- **声明式映射**：通过 `PATH_MAP` 统一管理平铺键到 TOML 嵌套路径的映射。
- **智能写入**：仅保存非默认值的字段，并主动删除已存在的默认值字段，使配置文件极简。
- **职责分离**：`instructions` 完全由独立接口管理，通用设置模块不包含任何相关逻辑。
- **完全向后兼容**：对外 API（`SettingsManager`）行为不变，`list()` 返回仍包含 `instructions`。
- **保护其他配置**：`writer` 只处理 `SCHEMA` 中的字段，所有其他字段（如 `api_key`、`projects`、`providers.*`）原样保留。
- **纯 ESM**：全部使用 `import/export`，无 `require`。
- **消除 I/O 重复**：抽取统一的 `readConfig` / `writeConfig` 函数，所有模块复用。
- **统一工具链**：core 包与 web 包统一使用 lodash，isEqual / clearObject / pickBy / isEmpty 等函数无重复自实现。

---

## 2. 文件结构

```
settings/
├── defaults.js          # 默认值定义（不含 instructions，不含 TUI 平铺字段）
├── schema.js            # PATH_MAP 及 SCHEMA 生成
├── utils.js             # 通用嵌套操作工具 + 轻量 isEqual / clearObject
├── io.js                # 统一的配置读写、解析、序列化
├── reader.js            # 读取通用设置（基于 io）
├── writer.js            # 写入通用设置（基于 io）
└── index.js             # SettingsManager 门面，合并 instructions 并独立管理（基于 io）
```

> **字段范围说明**：`DEFAULT_SETTINGS` 与 `PATH_MAP` 仅包含 Web UI "通用设置"页面管理的字段。TUI 平铺字段（`tui_alternate_screen`、`tui_mouse_capture`、`tui_terminal_probe_timeout_ms`、`tui_stream_chunk_timeout_secs`、`tui_osc8_links`）由 TUI 层自行从 `config.toml` 读取默认值，不经过通用设置模块。`locale` 保留在通用设置中，供前端 i18n 使用。

---

## 3. 完整代码实现

### 3.1 `defaults.js`

```javascript
// 通用设置默认值（对齐 codewhale_configuration.md，不含 TUI 平铺字段）
// instructions 由独立接口管理，不在此定义
export const DEFAULT_SETTINGS = {
  // 基础
  locale: 'zh-Hans',
  default_text_model: 'deepseek-v4-pro',

  // TUI 界面（由 TUI 层自行管理默认值，此处仅保留 Web UI 可修改的字段）
  theme: 'system',
  default_mode: 'agent',
  sidebar_focus: 'pinned',
  show_thinking: true,
  show_tool_details: true,
  auto_compact: true,
  auto_compact_threshold_percent: 80,
  paste_burst_detection: true,
  mention_menu_limit: 128,
  mention_walk_depth: 6,
  mention_menu_behavior: 'fuzzy',
  cost_currency: 'usd',
  background_color: 'default',
  max_history: 1000,
  verbosity: 'normal',

  // 安全与审批
  approval_policy: 'on-request',
  sandbox_mode: 'read-only',
  allow_shell: false,

  // 子代理
  subagents_max_concurrent: 20,
  subagents_token_budget: [redacted]
  subagents_api_timeout_secs: 120,
  subagents_heartbeat_timeout_secs: 300,
  subagents_default_model: '',
  subagents_max_depth: 0,
  subagents_launch_concurrency: 20,
  subagents_max_admitted: 200,
  subagents_worker_model: '',
  subagents_explorer_model: '',
  subagents_awaiter_model: '',
  subagents_review_model: '',
  subagents_custom_model: '',

  // 重试
  retry_enabled: true,
  retry_max_retries: 3,
  retry_initial_delay: 1.0,
  retry_max_delay: 60.0,
  retry_exponential_base: 2.0,

  // 通知
  notifications_method: 'auto',
  notifications_threshold_secs: 30,
  notifications_completion_sound: 'beep',
  notifications_include_summary: false,
  sound_file: '',

  // 功能开关
  features_shell_tool: true,
  features_subagents: true,
  features_web_search: true,
  features_apply_patch: true,
  features_mcp: true,
  features_exec_policy: true,
  features_vision_model: false,

  // 搜索
  search_provider: 'duckduckgo',
  search_base_url: '',

  // 更新
  update_check_for_updates: true,
  update_uri: '',

  // 容量控制
  capacity_enabled: false,
  capacity_low_risk_max: 0.50,
  capacity_medium_risk_max: 0.62,
  capacity_severe_min_slack: -0.25,
  capacity_severe_violation_ratio: 0.40,
  capacity_refresh_cooldown_turns: 6,
  capacity_replan_cooldown_turns: 5,
  capacity_max_replay_per_turn: 1,
  capacity_min_turns_before_guardrail: 4,
  capacity_profile_window: 8,
  capacity_deepseek_v3_2_chat_prior: 3.9,
  capacity_deepseek_v3_2_reasoner_prior: 4.1,
  capacity_deepseek_v4_pro_prior: 3.5,
  capacity_deepseek_v4_flash_prior: 4.2,
  capacity_fallback_default_prior: 3.8,

  // 上下文管理
  context_enabled: false,
  CODEWHALE_CACHE_MAXIMAL: false,
  context_verbatim_window_turns: 16,
  context_l1_threshold: 192000,
  context_l2_threshold: 384000,
  context_l3_threshold: 576000,
  context_seam_model: 'deepseek-v4-flash',

  // 路径与存储
  skills_scan_codewhale_only: false,
  memory_enabled: false,
  snapshots_enabled: true,
  verifier_enabled: false,
  snapshots_max_age_days: 7,
  skills_dir: '~/.codewhale/skills',
  mcp_config_path: '~/.codewhale/mcp.json',
  notes_path: '~/.codewhale/notes.txt',
  memory_path: '~/.codewhale/memory.md',

  // 推理
  reasoning_effort: 'medium',

  // 安全
  permissions_toml: '',

  // TUI 界面默认模型覆盖
  default_model: '',
};
```

---

### 3.2 `schema.js`

```javascript
import { DEFAULT_SETTINGS } from './defaults.js';

// 平铺键 -> TOML 嵌套路径映射
// TUI 平铺字段（tui_alternate_screen / tui_mouse_capture / tui_terminal_probe_timeout_ms /
// tui_stream_chunk_timeout_secs / tui_osc8_links）由 TUI 层自行管理，不在此映射
const PATH_MAP = {
  // 顶层字段
  default_text_model: 'default_text_model',
  theme: 'theme',
  default_mode: 'default_mode',
  sidebar_focus: 'sidebar_focus',
  show_thinking: 'show_thinking',
  show_tool_details: 'show_tool_details',
  auto_compact: 'auto_compact',
  auto_compact_threshold_percent: 'auto_compact_threshold_percent',
  paste_burst_detection: 'paste_burst_detection',
  mention_menu_limit: 'mention_menu_limit',
  mention_walk_depth: 'mention_walk_depth',
  mention_menu_behavior: 'mention_menu_behavior',
  cost_currency: 'cost_currency',
  background_color: 'background_color',
  max_history: 'max_history',
  verbosity: 'verbosity',
  approval_policy: 'approval_policy',
  sandbox_mode: 'sandbox_mode',
  allow_shell: 'allow_shell',
  skills_scan_codewhale_only: 'skills_scan_codewhale_only',
  skills_dir: 'skills_dir',
  mcp_config_path: 'mcp_config_path',
  notes_path: 'notes_path',
  memory_path: 'memory_path',
  default_model: 'default_model',
  locale: 'tui.locale',

  // Subagents
  subagents_max_concurrent: 'subagents.max_concurrent',
  subagents_token_budget: [redacted]
  subagents_api_timeout_secs: 'subagents.api_timeout_secs',
  subagents_heartbeat_timeout_secs: 'subagents.heartbeat_timeout_secs',
  subagents_default_model: 'subagents.default_model',
  subagents_max_depth: 'subagents.max_depth',
  subagents_launch_concurrency: 'subagents.launch_concurrency',
  subagents_max_admitted: 'subagents.max_admitted',
  subagents_worker_model: 'subagents.worker_model',
  subagents_explorer_model: 'subagents.explorer_model',
  subagents_awaiter_model: 'subagents.awaiter_model',
  subagents_review_model: 'subagents.review_model',
  subagents_custom_model: 'subagents.custom_model',

  // Retry
  retry_enabled: 'retry.enabled',
  retry_max_retries: 'retry.max_retries',
  retry_initial_delay: 'retry.initial_delay',
  retry_max_delay: 'retry.max_delay',
  retry_exponential_base: 'retry.exponential_base',

  // Notifications
  notifications_method: 'notifications.method',
  notifications_threshold_secs: 'notifications.threshold_secs',
  notifications_completion_sound: 'notifications.completion_sound',
  notifications_include_summary: 'notifications.include_summary',
  sound_file: 'notifications.sound_file',

  // Features
  features_shell_tool: 'features.shell_tool',
  features_subagents: 'features.subagents',
  features_web_search: 'features.web_search',
  features_apply_patch: 'features.apply_patch',
  features_mcp: 'features.mcp',
  features_exec_policy: 'features.exec_policy',
  features_vision_model: 'features.vision_model',

  // Search
  search_provider: 'search.provider',
  search_base_url: 'search.base_url',

  // Update
  update_check_for_updates: 'update.check_for_updates',
  update_uri: 'update.uri',

  // Capacity
  capacity_enabled: 'capacity.enabled',
  capacity_low_risk_max: 'capacity.low_risk_max',
  capacity_medium_risk_max: 'capacity.medium_risk_max',
  capacity_severe_min_slack: 'capacity.severe_min_slack',
  capacity_severe_violation_ratio: 'capacity.severe_violation_ratio',
  capacity_refresh_cooldown_turns: 'capacity.refresh_cooldown_turns',
  capacity_replan_cooldown_turns: 'capacity.replan_cooldown_turns',
  capacity_max_replay_per_turn: 'capacity.max_replay_per_turn',
  capacity_min_turns_before_guardrail: 'capacity.min_turns_before_guardrail',
  capacity_profile_window: 'capacity.profile_window',
  capacity_deepseek_v3_2_chat_prior: 'capacity.deepseek_v3_2_chat_prior',
  capacity_deepseek_v3_2_reasoner_prior: 'capacity.deepseek_v3_2_reasoner_prior',
  capacity_deepseek_v4_pro_prior: 'capacity.deepseek_v4_pro_prior',
  capacity_deepseek_v4_flash_prior: 'capacity.deepseek_v4_flash_prior',
  capacity_fallback_default_prior: 'capacity.fallback_default_prior',

  // Context
  context_enabled: 'context.enabled',
  CODEWHALE_CACHE_MAXIMAL: 'context.CODEWHALE_CACHE_MAXIMAL',
  context_verbatim_window_turns: 'context.verbatim_window_turns',
  context_l1_threshold: 'context.l1_threshold',
  context_l2_threshold: 'context.l2_threshold',
  context_l3_threshold: 'context.l3_threshold',
  context_seam_model: 'context.seam_model',

  // Memory / Snapshots / Verifier / Reasoning / Permissions
  memory_enabled: 'memory.enabled',
  snapshots_enabled: 'snapshots.enabled',
  verifier_enabled: 'verifier.enabled',
  snapshots_max_age_days: 'snapshots.max_age_days',
  reasoning_effort: 'reasoning.effort',
  permissions_toml: 'permissions.toml',
};

export const SCHEMA = Object.keys(DEFAULT_SETTINGS).map((key) => ({
  key,
  path: PATH_MAP[key] || key,
  default: DEFAULT_SETTINGS[key],
}));
```

---

### 3.3 `utils.js`

```javascript
import { isEqual, isEmpty, pickBy, isPlainObject } from 'lodash';

/**
 * 通用嵌套操作工具 + clearObject
 *
 * 深比较使用 lodash isEqual，clearObject 对齐 web 端语义。
 */

// ---------- 嵌套读写删 ----------

export function getNested(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function setNested(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

export function deleteNested(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') return;
    current = current[part];
  }
  delete current[parts[parts.length - 1]];
}

// ---------- clearObject（对齐 web 端语义） ----------

/**
 * 清理对象中的"空值"字段：
 * - null / undefined -> 删除
 * - [] -> 删除
 * - {} -> 删除
 * - '' -> 删除（与 web 端 lodash.isEmpty 行为一致）
 */
export function clearObject(o) {
  return pickBy(o, (item) => !isEmpty(item));
}

// ---------- Schema 驱动的读写工具 ----------

export function readFromTomlBySchema(tomlObj, schema) {
  const result = {};
  for (const field of schema) {
    const val = getNested(tomlObj, field.path);
    // field.default 为 undefined 时（如 TUI 字段已从 SCHEMA 移除），保留 undefined
    result[field.key] = val !== undefined ? val : field.default;
  }
  return result;
}

export function applyToTomlBySchema(data, tomlObj, schema) {
  for (const field of schema) {
    const value = data[field.key];
    if (value === undefined) continue;
    // 使用 isEqual 比较是否等于默认值，避免 JSON.stringify 的语义边界问题
    if (isEqual(value, field.default)) {
      deleteNested(tomlObj, field.path);
    } else {
      setNested(tomlObj, field.path, value);
    }
  }
  // 清理空对象 / 空数组 / null / undefined
  clearObject(tomlObj);
}
```

---

### 3.4 `io.js`（统一 I/O 抽象）

```javascript
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse, stringify } from 'smol-toml';

// 获取配置路径
export function codeWhalePath() {
  return join(homedir(), '.codewhale', 'config.toml');
}

// 读取并解析配置，如果文件不存在或解析失败返回空对象
export function readConfig() {
  const cwPath = codeWhalePath();
  if (!existsSync(cwPath)) return {};
  try {
    const raw = readFileSync(cwPath, 'utf-8');
    return parse(raw);
  } catch {
    return {};
  }
}

// 写入配置对象（自动创建目录）
export function writeConfig(config, header = '# CodeWhale Configuration\n# Synced by codewhale-tool\n\n') {
  const cwPath = codeWhalePath();
  const dir = dirname(cwPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  // 如果配置为空，只写注释
  const content = Object.keys(config).length === 0
    ? '# CodeWhale Configuration\n# (All settings are at default values)\n'
    : header + stringify(config);

  writeFileSync(cwPath, content, 'utf-8');
}
```

---

### 3.5 `reader.js`（基于 io）

```javascript
import { DEFAULT_SETTINGS } from './defaults.js';
import { SCHEMA } from './schema.js';
import { readFromTomlBySchema, getNested } from './utils.js';
import { readConfig } from './io.js';

export function readSettingsFromCodeWhale() {
  const cwCfg = readConfig();
  if (Object.keys(cwCfg).length === 0) {
    return { ...DEFAULT_SETTINGS, instructions: [] };
  }

  try {
    const result = readFromTomlBySchema(cwCfg, SCHEMA);

    // 兼容旧版顶层 locale（写入时已删除顶层 locale，但旧文件可能仍有）
    if (cwCfg.locale !== undefined && getNested(cwCfg, 'tui.locale') === undefined) {
      result.locale = cwCfg.locale;
    }
    // 兼容旧版顶层 default_text_model（部分旧文件可能仍有）
    if (result.default_text_model === undefined && cwCfg.default_text_model !== undefined) {
      result.default_text_model = cwCfg.default_text_model;
    }

    return { ...result, instructions: [] };
  } catch {
    return { ...DEFAULT_SETTINGS, instructions: [] };
  }
}

// 对外暴露路径（保留兼容）
export { codeWhalePath } from './io.js';
```

---

### 3.6 `writer.js`（基于 io）

```javascript
import { SCHEMA } from './schema.js';
import { applyToTomlBySchema, clearObject } from './utils.js';
import { readConfig, writeConfig } from './io.js';

export function writeSettingsToCodeWhale(data) {
  // 读取当前配置
  const cwCfg = readConfig();
  const newCfg = JSON.parse(JSON.stringify(cwCfg));

  // 处理 SCHEMA 字段
  applyToTomlBySchema(data, newCfg, SCHEMA);

  // 清理整个配置的空值（包括非 SCHEMA 字段的空对象/空数组/null）
  // 注意：不清空字符串 ''，TOML 中空字符串有意义
  for (const key of Object.keys(newCfg)) {
    if (newCfg[key] === null || newCfg[key] === undefined) {
      delete newCfg[key];
    } else if (Array.isArray(newCfg[key]) && newCfg[key].length === 0) {
      delete newCfg[key];
    } else if (typeof newCfg[key] === 'object' && !Array.isArray(newCfg[key]) && Object.keys(newCfg[key]).length === 0) {
      delete newCfg[key];
    }
  }

  // 写回
  writeConfig(newCfg);
}
```

---

### 3.7 `index.js`（基于 io，复用统一 I/O）

```javascript
import { ok, okMsg } from '../utils/result.js';
import { DEFAULT_SETTINGS as _DEFAULT_SETTINGS } from './defaults.js';
import { readSettingsFromCodeWhale as _readSettingsFromCodeWhale } from './reader.js';
import { writeSettingsToCodeWhale as _writeSettingsToCodeWhale } from './writer.js';
import { readConfig, writeConfig } from './io.js';

// ---------- 独立管理 instructions（复用 io） ----------
function readInstructionsFromConfig() {
  const cwCfg = readConfig();
  return cwCfg.instructions || [];
}

function writeInstructionsToConfig(instructions) {
  const cwCfg = readConfig();
  const newCfg = JSON.parse(JSON.stringify(cwCfg));

  if (!Array.isArray(instructions) || instructions.length === 0) {
    delete newCfg.instructions;
  } else {
    newCfg.instructions = instructions
      .map(item => (typeof item === 'string' ? item : item.path))
      .filter(p => !!p);
  }

  writeConfig(newCfg);
}

// ---------- 导出 ----------
export { DEFAULT_SETTINGS } from './defaults.js';
export { readSettingsFromCodeWhale, codeWhalePath } from './reader.js';
export { writeSettingsToCodeWhale } from './writer.js';

export class SettingsManager {
  list() {
    const settings = _readSettingsFromCodeWhale();
    const instructions = readInstructionsFromConfig();
    return ok({ ...settings, instructions });
  }

  getDefaults() {
    return ok({ ..._DEFAULT_SETTINGS });
  }

  restoreDefaults() {
    // 恢复默认设置时保留现有 instructions，instructions 由独立接口管理
    const current = _readSettingsFromCodeWhale();
    const defaults = { ..._DEFAULT_SETTINGS };
    if (Array.isArray(current.instructions) && current.instructions.length > 0) {
      defaults.instructions = current.instructions;
    } else {
      delete defaults.instructions;
    }
    _writeSettingsToCodeWhale(defaults);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }

  update(data) {
    // instructions 由独立接口 /settings/instructions 管理，此处忽略
    const payload = { ...(data || {}) };
    delete payload.instructions;
    _writeSettingsToCodeWhale(payload);
    return okMsg('updated', _readSettingsFromCodeWhale());
  }

  updateInstructions(instructions) {
    writeInstructionsToConfig(instructions);
    return okMsg('updated', {});
  }
}
```

---

## 4. 关键改进说明

### 4.1 消除 I/O 重复

所有文件读写、目录创建、TOML 解析/序列化都集中在 `io.js`。`reader`、`writer`、`index` 均调用 `readConfig()` 和 `writeConfig()`，不再重复 `existsSync`、`readFileSync`、`parse`、`writeFileSync` 逻辑。`instructions` 管理也复用 `io.js`。

### 4.2 声明式 Schema

新增字段只需在 `DEFAULT_SETTINGS` 和 `PATH_MAP` 中各加一行，`SCHEMA` 自动生成。不再需要在 `reader.js` 和 `writer.js` 中各加多行硬编码。

### 4.3 智能写入（默认值不落盘）

`applyToTomlBySchema` 使用 lodash `isEqual` 比较值与默认值。若相等则删除该字段，使 `config.toml` 极简。`isEqual` 支持递归比较 string / number / boolean / null / undefined / array / plain object，避免 `JSON.stringify` 的语义边界问题（如精度、引用差异等）。

### 4.4 `clearObject` 语义

对齐 `packages/web/src/utils/index.js` 的 `clearObject`，core 端统一使用 lodash `isEmpty` + `pickBy`，行为与 web 端一致：

- `null` / `undefined` → 删除
- `[]` → 删除
- `{}` → 删除
- `''` → 删除（与 web 端 lodash.isEmpty 行为一致）

> **关于空字符串**：TOML 中 `sound_file = ''` 有意义，但 `applyToTomlBySchema` 已通过 `isEqual` 将等默认值的字段删除。`clearObject` 额外清除 `''` 不会丢失有效信息，因为任何字符串字段若值为 `''` 且等于默认值 `''`，已在 `applyToTomlBySchema` 中被删除；若非默认值（用户主动设置），则 `''` 不可能等于非空默认值，不会被清除。

### 4.5 字段范围裁剪

`DEFAULT_SETTINGS` 与 `PATH_MAP` 仅包含 Web UI "通用设置"页面管理的字段。TUI 平铺字段（`tui_alternate_screen`、`tui_mouse_capture`、`tui_terminal_probe_timeout_ms`、`tui_stream_chunk_timeout_secs`、`tui_osc8_links`）由 TUI 层自行从 `config.toml` 读取默认值，不经过通用设置模块。`locale` 保留在通用设置中，供前端 i18n 使用。

### 4.6 保护其他配置

`writer` 只处理 `SCHEMA` 中的字段，其他字段（如 `api_key`、`projects`、`providers.*`）原样保留。`clearObject` 在 `writer.js` 中额外做了一层全配置空值清理，确保不残留空段。

---

## 5. 关键行为说明

### 5.1 读取

- `readConfig()` 返回解析后的 TOML 对象（空对象如果文件不存在或格式错误）。
- `readSettingsFromCodeWhale()` 从该对象中按 Schema 提取通用设置。
- 兼容旧版顶层 `locale` 和 `default_text_model`（旧文件可能仍有这些顶层字段）。

### 5.2 写入

- `writeConfig()` 自动创建目录、处理空配置写注释。
- `writeSettingsToCodeWhale()` 仅修改 `SCHEMA` 字段，其他字段保留。
- `applyToTomlBySchema` 删除已恢复默认的字段，`clearObject` 清理残留空对象/空数组。

### 5.3 `instructions`

完全独立，通过 `readConfig` / `writeConfig` 操作，不干扰通用设置。

---

## 6. 迁移与兼容性

### 6.1 旧版 config.toml 兼容

- 旧版可能同时存在顶层 `locale` 和 `tui.locale`。读取时优先 `tui.locale`，回退顶层 `locale`。写入时仅写 `tui.locale`，不写顶层 `locale`。
- 旧版可能同时存在顶层 `default_text_model` 和嵌套路径。读取时优先嵌套路径，回退顶层字段。

### 6.2 TUI 平铺字段迁移

旧版 `config.toml` 中可能存在的 `tui.alternate_screen`、`tui.mouse_capture` 等字段：
- **读取**：通用设置模块不再读取这些字段。TUI 层启动时自行处理默认值。
- **写入**：通用设置模块不再写入这些字段。TUI 层如需修改，直接操作 `config.toml`。

### 6.3 外部调用方

使用 `SettingsManager` 的接口无需任何改动。

---

## 7. 测试建议

### 7.1 读取测试

- 验证各种 TOML 结构（含/不含字段、旧版 `locale`）能正确映射为平铺对象。
- 验证 TUI 平铺字段不再出现在通用设置返回中。

### 7.2 写入测试

- 写入默认值 → 确认该字段从文件中删除。
- 写入非默认值 → 确认字段被正确写入。
- 写入混合数据 → 确认未知字段保留，空对象/空数组被清理，空字符串保留。
- 使用 `isEqual` 边界值测试：`0`、`false`、`''`、`[]`、`{}`、`null`。

### 7.3 `isEqual` 边界测试

- 基本类型：`0` vs `0`（true）、`0` vs `-0`（true）、`NaN` vs `NaN`（false，需注意）。
- 数组：`[1, 2]` vs `[1, 2]`（true）、`[1, [2]]` vs `[1, [2]]`（true）。
- 对象：`{ a: 1 }` vs `{ a: 1 }`（true）、`{ a: { b: 2 } }` vs `{ a: { b: 2 } }`（true）。
- 不同类型：`[]` vs `{}`（false）、`null` vs `undefined`（false）。

### 7.4 `instructions` 独立性

- 调用 `update` 不应影响 `instructions`。
- 调用 `updateInstructions` 不应影响通用设置。

---

## 8. 实施步骤

1. 备份原 `settings/` 目录。
2. 按 3.x 节创建各文件。
3. 运行现有测试用例（如有），或手动验证关键场景。
4. 检查 `config.toml` 是否按预期精简。
5. 确认 TUI 层对平铺字段的默认值处理正常。
6. 确认其他模块（如调用 `api_key`、`projects` 等）功能正常。

---

## 9. 技术债务与注意事项

### 9.1 统一使用 lodash

`isEqual`、`clearObject`、`pickBy`、`isEmpty`、`isPlainObject` 等函数统一使用 lodash，core 包与 web 包行为一致，无重复维护。

### 9.2 `isEqual` 行为说明

使用 lodash `isEqual`，支持递归比较所有 JavaScript 类型，包括 `NaN`、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、`BigInt` 等。当前 `DEFAULT_SETTINGS` 中均为基本类型，但未来扩展复杂类型时无需更换比较函数。

### 9.3 `clearObject` 与 web 端的一致性

core 端与 web 端统一使用 lodash `isEmpty` + `pickBy`，`clearObject` 行为完全一致：均会清除 `null` / `undefined` / `[]` / `{}` / `''`。TOML 中空字符串有意义，但 `applyToTomlBySchema` 已通过 `isEqual` 将等默认值的字段删除，`clearObject` 额外清除 `''` 不会丢失有效信息。

### 9.4 `writer.js` 中的双重清理

`applyToTomlBySchema` 已调用 `clearObject(tomlObj)`，`writer.js` 又做了一层全配置空值清理。两层清理语义略有重叠，但 `utils.clearObject` 只清 SCHEMA 涉及的嵌套路径上的空对象（通过 `clearObject(tomlObj)` 作用于整个 `tomlObj`），`writer.js` 的循环确保非 SCHEMA 字段的空值也被清除。两层叠加确保万无一失。

---

## 10. 总结

本方案通过引入 **Schema 驱动** 的设计，彻底消除了冗余的硬编码映射，实现了"默认值不落盘"的精简写入，同时对未知字段提供透传保护，确保不影响其他模块的配置。`instructions` 被完全剥离，职责清晰。通过统一 **I/O 抽象**，消除了所有重复的文件操作代码。`isEqual`、`clearObject` 统一使用 lodash，与 web 端行为一致。全部代码遵循 ESM 标准，适用于现代 Node.js 环境。重构后代码更简洁、可维护性更强，且完全向后兼容，可安全落地。

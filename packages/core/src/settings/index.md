# Settings 通用设置模块说明

> 对应目录：`packages/core/src/settings/`

## 三来源分流策略（v3.1）

本模块采用 **三来源分流策略**，严格对齐 CodeWhale 官方行为：

| 文件 | 职责 | 示例键 |
|------|------|--------|
| `~/.codewhale/config.toml` | 引擎、安全、提供商、子代理等**核心运行时配置** | `provider`、`api_key`、`approval_policy` |
| `~/.codewhale/settings.toml` | TUI 界面、布局、主题等**用户界面偏好** | `theme`、`work_surface_placement` |
| `~/.codewhale/permissions.toml` | **独立权限规则文件**（内容为 `[[rules]]` 数组） | 由 `permissions_toml` 字段承载 |

## 路由机制

`schema.js` 中的 `FIELD_ROUTES` 集中声明每个字段的目标文件：

```javascript
export const FIELD_ROUTES = {
  // UI 字段 → settings.toml
  theme: FILE_TARGET.SETTINGS,
  // 权限 → permissions.toml
  permissions_toml: FILE_TARGET.PERMISSIONS,
  // 默认 → FILE_TARGET.CONFIG
};
```

## 读取合并规则

`packages/core/src/settings/reader.js` 中合并三来源：

```javascript
const fromConfig = readFromTomlBySchema(cwCfg, SCHEMA);
const fromSettings = readFromTomlBySchema(settingsCfg, SCHEMA);
const permissionsContent = permissionsManager.read();
const merged = { ...fromConfig, ...fromSettings };
if (permissionsContent !== null) {
  merged.permissions_toml = permissionsContent;
}
```

## v3.1 修复：permissions.toml 不会意外清空

`writer.js` 只在用户明确提交 `permissions_toml` 字段时才写入：

```javascript
if (hasPermissions) {
  permissionsManager.write(permissionsValue);
}
// 未提交则完全不动，保留用户现有文件
```
